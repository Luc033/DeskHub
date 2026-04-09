const prisma = require('../lib/prisma');

module.exports = {
  async index(req, res) {
    try {
      const notes = await prisma.note.findMany({
        where: { userId: req.userId },
        orderBy: [
          { isPinned: 'desc' },
          { updatedAt: 'desc' }
        ]
      });
      return res.json(notes);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar anotações.' });
    }
  },

  async create(req, res) {
    const { title, content, category, isPinned } = req.body;
    try {
      const note = await prisma.note.create({
        data: { title, content, category, isPinned: isPinned || false, userId: req.userId }
      });
      return res.json(note);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar anotação.' });
    }
  },

  async update(req, res) {
    const { id } = req.params;
    const { title, content, category, isPinned } = req.body;
    try {
      await prisma.note.updateMany({
        where: { id, userId: req.userId },
        data: { title, content, category, isPinned }
      });
      const note = await prisma.note.findFirst({ where: { id, userId: req.userId } });
      return res.json(note);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar anotação.' });
    }
  },

  async delete(req, res) {
    const { id } = req.params;
    try {
      await prisma.note.deleteMany({ where: { id, userId: req.userId } });
      return res.send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar anotação.' });
    }
  }
};