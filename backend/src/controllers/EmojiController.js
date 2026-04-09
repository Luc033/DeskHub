const prisma = require('../lib/prisma');

module.exports = {
  async index(req, res) {
    try {
      const emojis = await prisma.emoji.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(emojis);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar emojis' });
    }
  },

  async create(req, res) {
    try {
      const { name, value, command } = req.body;
      const emoji = await prisma.emoji.create({
        data: { name, value, command, userId: req.userId }
      });
      return res.status(201).json(emoji);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar emoji' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.emoji.deleteMany({
        where: { id, userId: req.userId }
      });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar emoji' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, value, command } = req.body;
      await prisma.emoji.updateMany({
        where: { id, userId: req.userId },
        data: { name, value, command }
      });
      const updated = await prisma.emoji.findFirst({ where: { id } });
      return res.json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar emoji' });
    }
  }
};