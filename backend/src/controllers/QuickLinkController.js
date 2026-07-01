const prisma = require('../lib/prisma');

module.exports = {
  async index(req, res) {
    try {
      const quickLinks = await prisma.quickLink.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(quickLinks);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar QuickLinks' });
    }
  },

  async create(req, res) {
    try {
      const { title, url, category, favorite } = req.body;
      const quickLink = await prisma.quickLink.create({
        data: {
          title,
          url,
          category: category || 'Geral',
          favorite: Boolean(favorite),
          userId: req.userId
        }
      });
      return res.status(201).json(quickLink);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar QuickLink' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, url, category, favorite } = req.body;
      const data = {};
      if (title !== undefined) data.title = title;
      if (url !== undefined) data.url = url;
      if (category !== undefined) data.category = category;
      if (favorite !== undefined) data.favorite = Boolean(favorite);
      await prisma.quickLink.updateMany({
        where: { id, userId: req.userId },
        data
      });
      const updated = await prisma.quickLink.findFirst({
        where: { id, userId: req.userId }
      });
      return res.json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar QuickLink' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.quickLink.deleteMany({
        where: { id, userId: req.userId }
      });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar QuickLink' });
    }
  }
};
