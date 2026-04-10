const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const prisma = require('../lib/prisma');

// ================= PROVIDERS =================

async function callGemini(apiKey, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text().trim().replace(/['"]/g, '');
}

async function callOpenAI(apiKey, prompt) {
  const client = new OpenAI.default({ apiKey });
  const result = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 50,
    temperature: 0.1,
  });
  return result.choices[0].message.content.trim().replace(/['"]/g, '');
}

async function callGroq(apiKey, prompt) {
  const client = new OpenAI.default({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
  const result = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 50,
    temperature: 0.1,
  });
  return result.choices[0].message.content.trim().replace(/['"]/g, '');
}

// ================= FALLBACK ENGINE =================

async function categorizeWithFallback(aiConfig, prompt) {
  const providers = [];

  // Prioridade 1: Gemini
  if (aiConfig.apiKey) {
    providers.push({ name: "Gemini", fn: () => callGemini(aiConfig.apiKey, prompt) });
  }
  // Prioridade 2: ChatGPT
  if (aiConfig.openaiKey) {
    providers.push({ name: "ChatGPT", fn: () => callOpenAI(aiConfig.openaiKey, prompt) });
  }
  // Prioridade 3: Llama (Groq)
  if (aiConfig.groqKey) {
    providers.push({ name: "Llama (Groq)", fn: () => callGroq(aiConfig.groqKey, prompt) });
  }

  if (providers.length === 0) {
    return { category: null, provider: null, error: "Nenhuma API Key configurada." };
  }

  for (const provider of providers) {
    try {
      const category = await provider.fn();
      console.log(`[IA] ${provider.name} respondeu: ${category}`);
      return { category, provider: provider.name, error: null };
    } catch (error) {
      const status = error.status || error.statusCode || 0;
      console.warn(`[IA] ${provider.name} falhou (${status}): ${error.message?.substring(0, 150)}`);
    }
  }

  return { category: null, provider: null, error: "Todos os provedores de IA falharam." };
}

// ================= CONTROLLER =================


module.exports = {
  async categorize(req, res) {
    try {
      const { text } = req.body;
      if (!text) return res.json({ category: "Outros" });

      const sanitizedText = String(text).slice(0, 500).replace(/[`${}]/g, '');

      const aiConfig = await prisma.aiSetting.findUnique({
        where: { id: 'ai_config' }
      });

      if (!aiConfig) {
        return res.status(400).json({ category: "Outros", error: "Configuração de IA não encontrada." });
      }

      const prompt = `
${aiConfig.systemPrompt || 'Você é um classificador de tickets de suporte técnico. Responda APENAS com o nome da categoria, sem explicações.'}
        
Categorias válidas: Fiscal, Integrações, ERP, Logística, Minha conta, Financeiro, API, Outros

Texto do atendimento: "${sanitizedText}"`;

      const result = await categorizeWithFallback(aiConfig, prompt);

      if (result.error) {
        return res.status(503).json({ category: "Outros", error: result.error });
      }

      const VALID_CATEGORIES = ["Fiscal", "Integrações", "ERP", "Logística", "Minha conta", "Financeiro", "API", "Outros"];
      const normalized = VALID_CATEGORIES.find(
        cat => cat.toLowerCase() === result.category.toLowerCase()
      ) || "Outros";

      return res.json({ category: normalized, provider: result.provider });
    } catch (error) {
      console.error("[IA] Erro inesperado:", error);
      return res.status(500).json({ category: "Outros", error: "Erro interno ao consultar IA." });
    }
  },
};