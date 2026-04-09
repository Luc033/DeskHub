const prisma = require('../lib/prisma');

module.exports = {
  async index(req, res) {
    try {
      const alerts = await prisma.alert.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(alerts);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar recados.' });
    }
  },

  async create(req, res) {
    const { title, description, type } = req.body;
    try {
      const alert = await prisma.alert.create({
        data: { title, description, type, userId: req.userId }
      });
      return res.json(alert);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar recado.' });
    }
  },

  async update(req, res) {
    const { id } = req.params;
    const { title, description, type, status } = req.body;
    try {
      await prisma.alert.updateMany({
        where: { id, userId: req.userId },
        data: { title, description, type, status }
      });
      const alert = await prisma.alert.findFirst({ where: { id, userId: req.userId } });
      return res.json(alert);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar recado.' });
    }
  },

  async delete(req, res) {
    const { id } = req.params;
    try {
      await prisma.alert.deleteMany({ where: { id, userId: req.userId } });
      return res.send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar recado.' });
    }
  }
};