const prisma = require('../lib/prisma');

module.exports = {
  // Traz os KPIs ordenados apenas do usuário logado
  async index(req, res) {
    try {
      const kpis = await prisma.dailyKpi.findMany({
        where: { userId: req.userId },
        orderBy: { date: 'desc' }
      });
      return res.json(kpis);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar KPIs' });
    }
  },

  // Registra ou Atualiza o KPI do dia atual para o usuário
  async register(req, res) {
    try {
      const { missedCalls, pausesMins } = req.body;
      
      // Garante a data correta no Fuso Horário do Brasil (America/Sao_Paulo)
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // Retorna YYYY-MM-DD
      const today = new Date(todayStr + "T00:00:00.000Z"); // Zera as horas

      // 1. Busca se JÁ EXISTE um registro de KPI para este usuário hoje
      const existingKpi = await prisma.dailyKpi.findFirst({
        where: {
          userId: req.userId,
          date: today
        }
      });

      let kpi;

      // 2. Se existir, apenas ATUALIZA os dados
      if (existingKpi) {
        kpi = await prisma.dailyKpi.update({
          where: { id: existingKpi.id },
          data: {
            missedCalls: missedCalls !== undefined ? missedCalls : undefined,
            pausesMins: pausesMins !== undefined ? pausesMins : undefined,
          }
        });
      } 
      // 3. Se não existir, CRIA a linha do dia para este usuário
      else {
        kpi = await prisma.dailyKpi.create({
          data: {
            date: today,
            missedCalls: missedCalls || 0,
            pausesMins: pausesMins || 0,
            userId: req.userId
          }
        });
      }
      
      return res.json(kpi);
    } catch (error) {
      console.error("Erro no KpiController:", error);
      return res.status(500).json({ error: 'Erro ao atualizar KPI' });
    }
  }
};