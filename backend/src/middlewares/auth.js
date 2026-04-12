const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_SECRET e REFRESH_SECRET não configurados!');
}

// Middleware de autenticação
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Formato inválido: use Bearer <token>' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware de refresh token
module.exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token não fornecido' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    
    const newToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      SECRET,
      { expiresIn: '15m' }
    );
    
    return res.json({ token: newToken });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
  }
};

// Middleware para verificar se é admin
module.exports.requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};