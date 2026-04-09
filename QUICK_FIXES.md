# 🚀 QUICK FIXES - Implementação Prática

Este arquivo contém soluções prontas para copiar e colar nos seus arquivos.

---

## 1. Arquivo `.env.example` (Commitar no Git)

```env
# ===== SEGURANÇA =====
NODE_ENV=development
JWT_SECRET=mude_para_chave_aleatoria_de_32_caracteres
REFRESH_SECRET=mude_para_outra_chave_aleatoria_de_32_caracteres
ENCRYPTION_KEY=mude_para_outra_chave_aleatoria_de_32_caracteres

# ===== BANCO DE DADOS =====
DB_USER=deskhub_user
DB_PASSWORD=mude_para_senha_segura
DB_NAME=deskhub_db
DB_HOST=postgres
DATABASE_URL=postgresql://deskhub_user:deskhub_password@postgres:5432/deskhub_db?schema=public

# ===== API KEYS =====
GOOGLE_API_KEY=seu_google_api_key_aqui

# ===== URLS =====
PORT=3333
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
API_URL=http://localhost:3333

# ===== LOGS =====
LOG_LEVEL=debug
```

**Guardar em:** `backend/.env.example`

---

## 2. Gerar Chaves Seguras

```bash
# No terminal, gerar secrets aleatórios:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiar as 3 saídas para seu `.env` real (NÃO commitar).

---

## 3. Arquivo: `backend/src/config/security.js` (NOVO)

```javascript
module.exports = {
  // Validar variáveis de ambiente críticas
  validateSecurityConfig() {
    const required = ['JWT_SECRET', 'REFRESH_SECRET', 'DATABASE_URL'];
    
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(
          `❌ Variável de ambiente obrigatória não configurada: ${key}\n` +
          `Copie .env.example para .env e configure os valores de produção`
        );
      }
    }
  },
  
  // Configuração de Rate Limiting
  getRateLimitConfig() {
    return {
      global: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100,
        message: 'Muitas requisições, tente novamente mais tarde'
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5,
        skipSuccessfulRequests: true,
        message: 'Muitas tentativas, tente novamente em 15 minutos'
      }
    };
  },
  
  // Configuração de CORS segura
  getCorsConfig() {
    const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
      .split(',')
      .map(origin => origin.trim());
    
    return {
      origin: origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400 // 24 horas
    };
  }
};
```

---

## 4. Arquivo: `backend/src/utils/logger.js` (NOVO)

```javascript
const isDev = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || 'info';

const levels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = levels[logLevel] || levels.info;

module.exports = {
  debug: (message, data) => {
    if (currentLevel <= 0) {
      console.log(`[DEBUG] ${message}`, data ?? '');
    }
  },
  
  info: (message, data) => {
    if (currentLevel <= 1) {
      console.log(`[INFO] ${message}`, data ?? '');
    }
  },
  
  warn: (message, data) => {
    if (currentLevel <= 2) {
      console.warn(`[WARN] ${message}`, data ?? '');
    }
  },
  
  error: (message, error) => {
    console.error(`[ERROR] ${message}`);
    if (isDev && error) {
      console.error(error.stack);
    }
  },
  
  // Nunca logar dados sensíveis
  sanitize: (obj) => {
    const sensitive = ['password', 'token', 'apiKey', 'secret', 'key'];
    const copy = JSON.parse(JSON.stringify(obj));
    
    Object.keys(copy).forEach(key => {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        copy[key] = '***REDACTED***';
      }
    });
    
    return copy;
  }
};
```

---

## 5. Atualizar: `backend/src/server.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const routes = require('./routers/routes');
const securityConfig = require('./config/security');
const logger = require('./utils/logger');

// ✅ VALIDAR CONFIGURAÇÃO ANTES DE INICIAR
try {
  securityConfig.validateSecurityConfig();
} catch (error) {
  logger.error('Falha na validação de segurança', error);
  process.exit(1);
}

const app = express();

// ✅ 1. HEADERS DE SEGURANÇA PRIMEIRO (HELMET)
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https:"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
  }
}));

// ✅ 2. RATE LIMITING GLOBAL
const limiterGlobal = rateLimit(securityConfig.getRateLimitConfig().global);
app.use(limiterGlobal);

// ✅ 3. CORS SEGURO
app.use(cors(securityConfig.getCorsConfig()));

// ✅ 4. PARSE JSON/URL (COM LIMITE MENOR)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ 5. ROTAS
app.use(routes);

// ✅ 6. HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ✅ 7. ERROR HANDLER (ÚLTIMO)
app.use((err, req, res, next) => {
  logger.error('Erro não tratado', err);
  
  const isDev = process.env.NODE_ENV === 'development';
  const status = err.status || 500;
  
  // NÃO expor detalhes do erro em produção
  res.status(status).json({
    error: isDev ? err.message : 'Erro interno do servidor',
    ...(isDev && { stack: err.stack })
  });
});

// ✅ 8. 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor DeskHub rodando na porta ${PORT} (${process.env.NODE_ENV})`);
});

module.exports = app;
```

**Instalar dependências:**
```bash
cd backend
npm install helmet express-rate-limit
```

---

## 6. Atualizar: `backend/src/middlewares/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// ✅ Validar que as chaves foram configuradas
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
```

---

## 7. Atualizar: `backend/src/controllers/AuthController.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

module.exports = {
  
  async register(req, res) {
    const { name, email, password, role } = req.body;

    try {
      // ✅ Validação básica
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
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
      const hashedPassword = await bcrypt.hash(password, 10);
      const userRole = (role || 'user').toLowerCase();

      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role: userRole }
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
  }
};
```

---

## 8. Atualizar: `backend/src/routers/routes.js`

```javascript
const { Router } = require('express');
const routes = Router();
const rateLimit = require('express-rate-limit');

// Controllers
const AuthController = require('../controllers/AuthController');
const MessageController = require('../controllers/MessageController');
const ShortcutController = require('../controllers/ShortcutController');
// ... importar outros

// Middlewares
const authMiddleware = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/auth');
const securityConfig = require('../config/security');

// ✅ Rate limiters específicos
const authLimiter = rateLimit(securityConfig.getRateLimitConfig().auth);

// ✅ Rotas públicas (SEM autenticação)
routes.get('/ping', (req, res) => res.json({ status: 'API Online!' }));

routes.post('/register', authLimiter, AuthController.register);
routes.post('/login', authLimiter, AuthController.login);

// ✅ Rotas que precisam de autenticação
routes.use(authMiddleware);

// Profile
routes.get('/me', AuthController.me);
routes.put('/me/profile', AuthController.updateProfile);
routes.put('/me/password', AuthController.updatePassword);

// Admin only
routes.get('/users', requireAdmin, AuthController.listUsers);
routes.delete('/users/:id', requireAdmin, AuthController.deleteUser);

// Mensagens (com validação de propriedade)
routes.post('/messages', MessageController.create);
routes.get('/messages', MessageController.index);
routes.put('/messages/:id', MessageController.update);
routes.delete('/messages/:id', MessageController.delete);

// ... outras rotas

module.exports = routes;
```

---

## 9. Atualizar: `backend/docker-compose.yml`

```yaml
version: '3.8'

services:
  # ✅ PostgreSQL SEM exposição de porta
  postgres:
    image: postgres:16-alpine
    container_name: deskhub_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    # ❌ REMOVIDO: ports - só acesso interno
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - deskhub_net

  backend:
    container_name: deskhub_backend
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public
      PORT: 3333
      NODE_ENV: ${NODE_ENV}
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_SECRET: ${REFRESH_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
      CORS_ORIGINS: ${CORS_ORIGINS}
      LOG_LEVEL: ${LOG_LEVEL}
    ports:
      - "3333:3333"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - deskhub_net

  frontend:
    container_name: deskhub_frontend
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      VITE_API_URL: ${API_URL}
      VITE_ENV: ${NODE_ENV}
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - deskhub_net

volumes:
  postgres_data:
    driver: local

networks:
  deskhub_net:
    driver: bridge
```

---

## 10. Exemplo: `backend/.env` (NÃO COMMITAR!)

```env
NODE_ENV=development

# Gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0
REFRESH_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0
ENCRYPTION_KEY=w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0

# Database
DB_USER=deskhub_user
DB_PASSWORD=sua_senha_super_segura_aqui_min_20_chars
DB_NAME=deskhub_dev
DB_HOST=postgres
DATABASE_URL=postgresql://deskhub_user:sua_senha_super_segura_aqui_min_20_chars@postgres:5432/deskhub_dev?schema=public

# API Keys
GOOGLE_API_KEY=sua_chave_do_google_api

# URLs e Portas
PORT=3333
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
API_URL=http://localhost:3333

# Logs
LOG_LEVEL=debug
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Copiar `.env.example` → `backend/.env.example`
- [ ] Criar `backend/.env` com valores reais
- [ ] Copiar código de `backend/src/config/security.js`
- [ ] Copiar código de `backend/src/utils/logger.js`
- [ ] Atualizar `backend/src/server.js`
- [ ] Atualizar `backend/src/middlewares/auth.js`
- [ ] Atualizar `backend/src/controllers/AuthController.js`
- [ ] Atualizar `backend/src/routers/routes.js`
- [ ] Atualizar `backend/docker-compose.yml`
- [ ] Instalar: `npm install helmet express-rate-limit`
- [ ] Testar: `npm run dev`
- [ ] Adicionar `.env` ao `.gitignore`

---
