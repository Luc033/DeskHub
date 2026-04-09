const prisma = require('../lib/prisma');

module.exports = {
  async index(req, res) {
    try {
      const messages = await prisma.message.findMany({
        where: { userId: req.userId }, // Traz só do usuário logado
        orderBy: { createdAt: 'desc' }
      });
      return res.json(messages);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
  },

  async create(req, res) {
    try {
      const { topic, title, content, command } = req.body;
      const message = await prisma.message.create({
        data: { topic, title, content, command, userId: req.userId } // Salva no nome dele
      });
      return res.status(201).json(message);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar mensagem' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      // Garante que só deleta se for a mensagem dele
      await prisma.message.deleteMany({
        where: { id, userId: req.userId } 
      });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar mensagem' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { topic, title, content, command } = req.body;
      // No updateMany, usamos Many para poder filtrar por ID + userId
      await prisma.message.updateMany({
        where: { id, userId: req.userId },
        data: { topic, title, content, command }
      });
      const updated = await prisma.message.findFirst({ where: { id } });
      return res.json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar mensagem' });
    }
  }
};