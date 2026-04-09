const prisma = require('../lib/prisma');

module.exports = {
  async create(req, res) {
    try {
      const {
        type,
        status,
        ticket,
        descricao,
        category,
        cnpj,
        companyName,
        tratativa,
        notes,
      } = req.body;
      const attendance = await prisma.attendance.create({
        data: {
          type,
          status: status || "in_progress",
          ticket,
          descricao,
          category,
          cnpj,
          companyName,
          tratativa,
          notes,
          userId: req.userId,
        },
      });
      return res.status(201).json(attendance);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao criar atendimento" });
    }
  },

  async index(req, res) {
    try {
      const attendances = await prisma.attendance.findMany({
        where: { userId: req.userId },
        orderBy: { openedAt: "desc" },
      });
      return res.json(attendances);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar atendimentos" });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.attendance.deleteMany({
        where: { id: String(id), userId: req.userId },
      });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao deletar atendimento" });
    }
  },

  async finalize(req, res) {
    try {
      const { id } = req.params;
      const { tratativa, notes } = req.body;

      await prisma.attendance.updateMany({
        where: { id: String(id), userId: req.userId },
        data: {
          tratativa,
          notes,
          status: "finalized",
          closedAt: new Date(),
        },
      });
      const attendance = await prisma.attendance.findFirst({ where: { id: String(id), userId: req.userId } });
      return res.json(attendance);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao finalizar atendimento" });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        ticket,
        descricao,
        category,
        cnpj,
        companyName,
        tratativa,
        notes,
      } = req.body;

      await prisma.attendance.updateMany({
        where: { id: String(id), userId: req.userId },
        data: {
          ticket,
          descricao,
          category,
          cnpj,
          companyName,
          tratativa,
          notes,
        },
      });
      const attendance = await prisma.attendance.findFirst({ where: { id: String(id), userId: req.userId } });

      return res.json(attendance);
    } catch (error) {
      console.error("Erro no auto-save:", error);
      return res
        .status(500)
        .json({ error: "Erro ao atualizar o atendimento em progresso." });
    }
  },
};
