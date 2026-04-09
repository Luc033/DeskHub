const { GoogleGenerativeAI } = require("@google/generative-ai");
const prisma = require('../lib/prisma');

module.exports = {
  async categorize(req, res) {
    try {
      const { text } = req.body;
      if (!text) return res.json({ category: "Outros" });

      // ✅ SEGURANÇA: Sanitizar e truncar input para evitar prompt injection
      const sanitizedText = String(text).slice(0, 500).replace(/[`${}]/g, '');

      const aiConfig = await prisma.aiSetting.findUnique({
        where: { id: 'ai_config' }
      });

      if (!aiConfig || !aiConfig.apiKey) {
        console.warn("API Key do Gemini não configurada no painel de Settings.");
        return res.json({ category: "Outros" });
      }

      const genAI = new GoogleGenerativeAI(aiConfig.apiKey);
      const model = genAI.getGenerativeModel({ model: aiConfig.model || "gemini-2.5-flash" });

      const prompt = `
${aiConfig.systemPrompt || 'Você é um classificador de tickets. Responda apenas com a categoria adequada.'}
        
Texto do atendimento: "${sanitizedText}"`;

      const result = await model.generateContent(prompt);
      const category = result.response.text().trim().replace(/['"]/g, '');

      return res.json({ category });
    } catch (error) {
      console.error("Erro na API do Gemini:", error);
      return res.json({ category: "Outros" });
    }
  },
};