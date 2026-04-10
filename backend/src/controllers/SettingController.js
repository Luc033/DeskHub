const prisma = require('../lib/prisma');

module.exports = {
  // ================= CONFIGURAÇÕES DO SISTEMA =================
  async getSystem(req, res) {
    try {
      let config = await prisma.systemSetting.findUnique({ where: { id: 'global_config' } });
      if (!config) config = await prisma.systemSetting.create({ data: { id: 'global_config' } });
      return res.json(config);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar configs do sistema' });
    }
  },

  async updateSystem(req, res) {
    try {
      const { companyName, defaultTratativa, theme } = req.body;
      const data = {};
      if (companyName !== undefined) data.companyName = String(companyName).slice(0, 100);
      if (defaultTratativa !== undefined) data.defaultTratativa = String(defaultTratativa).slice(0, 2000);
      if (theme !== undefined) data.theme = String(theme).slice(0, 20);

      const config = await prisma.systemSetting.upsert({
        where: { id: 'global_config' },
        update: data,
        create: { id: 'global_config', ...data }
      });
      return res.json(config);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar configs do sistema' });
    }
  },

  // ================= CONFIGURAÇÕES DA IA =================
  async getAi(req, res) {
    try {
      let config = await prisma.aiSetting.findUnique({ where: { id: 'ai_config' } });
      if (!config) config = await prisma.aiSetting.create({ data: { id: 'ai_config' } });
      return res.json({
        id: config.id,
        model: config.model,
        systemPrompt: config.systemPrompt,
        updatedAt: config.updatedAt,
        geminiKey: config.apiKey ? '***configured***' : '',
        openaiKey: config.openaiKey ? '***configured***' : '',
        groqKey: config.groqKey ? '***configured***' : '',
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar configs da IA' });
    }
  },

  async updateAi(req, res) {
    try {
      const { geminiKey, openaiKey, groqKey, model, systemPrompt } = req.body;
      const data = {};

      // Só atualiza chaves que o usuário realmente digitou (não o placeholder)
      if (geminiKey && geminiKey !== '***configured***') {
        data.apiKey = String(geminiKey).slice(0, 200);
      }
      if (openaiKey && openaiKey !== '***configured***') {
        data.openaiKey = String(openaiKey).slice(0, 200);
      }
      if (groqKey && groqKey !== '***configured***') {
        data.groqKey = String(groqKey).slice(0, 200);
      }
      if (model !== undefined) data.model = String(model).slice(0, 50);
      if (systemPrompt !== undefined) data.systemPrompt = String(systemPrompt).slice(0, 2000);

      const config = await prisma.aiSetting.upsert({
        where: { id: 'ai_config' },
        update: data,
        create: { id: 'ai_config', ...data }
      });
      return res.json({
        id: config.id,
        model: config.model,
        systemPrompt: config.systemPrompt,
        updatedAt: config.updatedAt,
        geminiKey: config.apiKey ? '***configured***' : '',
        openaiKey: config.openaiKey ? '***configured***' : '',
        groqKey: config.groqKey ? '***configured***' : '',
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar configs da IA' });
    }
  }
};