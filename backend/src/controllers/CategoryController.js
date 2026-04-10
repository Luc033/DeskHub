const prisma = require('../lib/prisma');

module.exports = {
  async index(req, res) {
    try {
      const categories = await prisma.category.findMany({
        where: { userId: req.userId },
        orderBy: { name: 'asc' }
      });
      return res.json(categories);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  },

  async create(req, res) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
      }
      const existing = await prisma.category.findFirst({
        where: { name: name.trim(), userId: req.userId }
      });
      if (existing) {
        return res.status(409).json({ error: 'Você já tem uma categoria com esse nome' });
      }
      const category = await prisma.category.create({
        data: { name: name.trim(), userId: req.userId }
      });
      return res.status(201).json(category);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
      }
      await prisma.category.updateMany({
        where: { id, userId: req.userId },
        data: { name: name.trim() }
      });
      const updated = await prisma.category.findFirst({ where: { id } });
      return res.json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.category.deleteMany({
        where: { id, userId: req.userId }
      });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar categoria' });
    }
  }
};
