const prisma = require('../lib/prisma');

module.exports = {
  async index(req, res) {
    try {
      const shortcuts = await prisma.shortcut.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(shortcuts);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar rotas' });
    }
  },

  async create(req, res) {
    try {
      const { title, content, command } = req.body;
      const shortcut = await prisma.shortcut.create({
        data: { title, content, command, userId: req.userId }
      });
      return res.status(201).json(shortcut);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar rota' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.shortcut.deleteMany({
        where: { id, userId: req.userId }
      });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar rota' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, content, command } = req.body;
      await prisma.shortcut.updateMany({
        where: { id, userId: req.userId },
        data: { title, content, command }
      });
      const updated = await prisma.shortcut.findFirst({ where: { id } });
      return res.json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar rota' });
    }
  }
};