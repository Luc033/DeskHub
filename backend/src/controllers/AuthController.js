const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

module.exports = {
  
  async register(req, res) {
    const { name, email, password } = req.body;

    try {
      // ✅ Validação básica
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      // ✅ Validação de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }

      if (name.length < 3 || name.length > 50) {
        return res.status(400).json({ error: 'Nome deve ter entre 3 e 50 caracteres' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
      }

      // ✅ Verificar se existe
      const userExists = await prisma.user.findFirst({
        where: { OR: [{ email }, { name }] }
      });

      if (userExists) {
        return res.status(400).json({ 
          error: userExists.email === email 
            ? 'Este email já está em uso' 
            : 'Este nome já está em uso' 
        });
      }

      // ✅ Hash seguro (rounds aumentado)
      const hashedPassword = await bcrypt.hash(password, 12);

      // ✅ SEGURANÇA: role é sempre 'user' — promoção a admin somente via painel admin
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role: 'user' }
      });

      // ✅ NÃO retornar senha
      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      logger.error('Erro no registro', error);
      return res.status(500).json({ error: 'Falha ao criar usuário' });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // ✅ Mensagem genérica por segurança (não revelar que email não existe)
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      // ✅ Tokens curtos
      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user.id, role: user.role },
        REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        user: userWithoutPassword,
        token,
        refreshToken
      });
    } catch (error) {
      logger.error('Erro no login', error);
      return res.status(500).json({ error: 'Falha na autenticação' });
    }
  },

  async me(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      logger.error('Erro ao buscar perfil', error);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },

  async updateProfile(req, res) {
    const { name } = req.body;

    try {
      if (!name || name.length < 3) {
        return res.status(400).json({ error: 'Nome deve ter no mínimo 3 caracteres' });
      }

      // ✅ Verificar se é único (exceto próprio usuário)
      const nameExists = await prisma.user.findFirst({
        where: { name, NOT: { id: req.userId } }
      });

      if (nameExists) {
        return res.status(400).json({ error: 'Este nome já está em uso' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: { name }
      });

      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      logger.error('Erro ao atualizar perfil', error);
      return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },

  async updatePassword(req, res) {
    const { oldPassword, newPassword } = req.body;

    try {
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Senha antiga e nova são obrigatórias' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });

      // ✅ Verificar senha antiga
      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      // ✅ Hash nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: { password: hashedPassword }
      });

      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      logger.error('Erro ao atualizar senha', error);
      return res.status(500).json({ error: 'Erro ao atualizar senha' });
    }
  },

  async updateAvatar(req, res) {
    const { avatar } = req.body;

    try {
      if (!avatar) {
        return res.status(400).json({ error: 'Avatar é obrigatório' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: { avatar: String(avatar).slice(0, 500) }
      });

      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      logger.error('Erro ao atualizar avatar', error);
      return res.status(500).json({ error: 'Erro ao atualizar avatar' });
    }
  },

  async listUsers(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true }
      });
      return res.json(users);
    } catch (error) {
      logger.error('Erro ao listar usuários', error);
      return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  },

  async deleteUser(req, res) {
    const { id } = req.params;

    try {
      if (id === req.userId) {
        return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
      }

      await prisma.user.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      logger.error('Erro ao deletar usuário', error);
      return res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
  },

  async resetUserPassword(req, res) {
    const { id } = req.params;
    const { newPassword } = req.body;

    try {
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });

      return res.json({ message: 'Senha resetada com sucesso' });
    } catch (error) {
      logger.error('Erro ao resetar senha', error);
      return res.status(500).json({ error: 'Erro ao resetar senha' });
    }
  }
};