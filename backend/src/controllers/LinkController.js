const prisma = require('../lib/prisma');

module.exports = {
  async index(req, res) {
    try {
      const links = await prisma.link.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(links);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar links' });
    }
  },

  async create(req, res) {
    try {
      const { title, url, command } = req.body;
      const link = await prisma.link.create({
        data: { title, url, command, userId: req.userId }
      });
      return res.status(201).json(link);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar link' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.link.deleteMany({
        where: { id, userId: req.userId }
      });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar link' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, url, command } = req.body;
      await prisma.link.updateMany({
        where: { id, userId: req.userId },
        data: { title, url, command }
      });
      const updated = await prisma.link.findFirst({ where: { id } });
      return res.json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar link' });
    }
  }
};