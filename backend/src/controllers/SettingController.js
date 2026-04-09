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
      // ✅ SEGURANÇA: Não expor a API key completa
      const { apiKey, ...safeConfig } = config;
      return res.json({ ...safeConfig, apiKey: apiKey ? '***configured***' : '' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar configs da IA' });
    }
  },

  async updateAi(req, res) {
    try {
      const { apiKey, model, systemPrompt } = req.body;
      const data = {};
      if (apiKey !== undefined) data.apiKey = String(apiKey).slice(0, 200);
      if (model !== undefined) data.model = String(model).slice(0, 50);
      if (systemPrompt !== undefined) data.systemPrompt = String(systemPrompt).slice(0, 2000);

      const config = await prisma.aiSetting.upsert({
        where: { id: 'ai_config' },
        update: data,
        create: { id: 'ai_config', ...data }
      });
      const { apiKey: key, ...safeConfig } = config;
      return res.json({ ...safeConfig, apiKey: key ? '***configured***' : '' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar configs da IA' });
    }
  }
};