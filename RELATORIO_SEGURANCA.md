# 🔐 RELATÓRIO DE SEGURANÇA - DeskHub Project

**Data da Análise:** 08 de Abril de 2026  
**Status:** ⚠️ MÚLTIPLOS RISCOS IDENTIFICADOS

---

## 📊 RESUMO EXECUTIVO

Foram identificados **15 problemas de segurança** críticos e de alta severidade que precisam ser corrigidos antes de colocar este projeto em produção. O projeto atualmente está com configurações apropriadas apenas para ambiente **DE DESENVOLVIMENTO LOCAL**.

---

## 🔴 RISCOS CRÍTICOS (Máxima Prioridade)

### 1. **JWT_SECRET Hardcoded no Código**
**Severidade:** 🔴 CRÍTICA  
**Localização:** 
- [backend/src/controllers/AuthController.js](backend/src/controllers/AuthController.js#L6)
- [backend/src/middlewares/auth.js](backend/src/middlewares/auth.js#L4)

**Problema:**
```javascript
const SECRET = process.env.JWT_SECRET || 'deskhub_super_secreto_2026';
```

O valor `'deskhub_super_secreto_2026'` está hardcoded no código. Isso significa que:
- Qualquer pessoa com acesso ao repositório pode gerar tokens válidos
- Tokens de produção podem ser falsificados
- Qualquer usuário com acesso ao código pode impersonar qualquer usuário

**Impacto:** Um invasor pode:
- Falsificar tokens JWT e acessar a API como qualquer usuário
- Escalar privilégios para admin
- Contornar toda autenticação

**Solução:**
```javascript
// ✅ CORRETO - Exigir variável de ambiente
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET não configurado! Defina a variável de ambiente JWT_SECRET');
}
```

---

### 2. **Credenciais do Banco de Dados em Texto Plano**
**Severidade:** 🔴 CRÍTICA  
**Localização:** [docker-compose.yml](docker-compose.yml#L10-L12)

**Problema:**
```yaml
environment:
  POSTGRES_USER: deskhub_user
  POSTGRES_PASSWORD: deskhub_password  # 🚨 EXPOSTO!
  POSTGRES_DB: deskhub_db
```

E no backend:
```yaml
DATABASE_URL: postgresql://deskhub_user:deskhub_password@postgres:5432/deskhub_db?schema=public
```

**Impacto:**
- Qualquer pessoa com acesso ao docker-compose.yml tem credenciais do banco
- Acesso não autorizado ao banco de dados
- Risco de SQL injection com credenciais fracas

**Solução:**
```yaml
# ✅ CORRETO - Usar variáveis de ambiente
environment:
  POSTGRES_USER: ${DB_USER}
  POSTGRES_PASSWORD: ${DB_PASSWORD}
  POSTGRES_DB: ${DB_NAME}
```

Criar arquivo `.env`:
```env
DB_USER=deskhub_user_prod
DB_PASSWORD=gerar_senha_forte_44_caracteres_aqui_com_random
DB_NAME=deskhub_prod_db
DB_HOST=postgres
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?schema=public
```

---

### 3. **API Key do Gemini Armazenada em Texto Plano no Banco**
**Severidade:** 🔴 CRÍTICA  
**Localização:** [backend/src/controllers/AiController.js](backend/src/controllers/AiController.js#L15-L20)

**Problema:**
```javascript
const aiConfig = await prisma.aiSetting.findUnique({
  where: { id: 'ai_config' }
});
const genAI = new GoogleGenerativeAI(aiConfig.apiKey); // 🚨 API Key em texto plano
```

A API key do Google Gemini é armazenada em texto plano no banco de dados.

**Impacto:**
- Vazamento da API key compromete acesso à API do Gemini
- Custos não autorizados (billing)
- Throttling da API afeta o sistema inteiro

**Solução - Opção 1: Usar apenas variáveis de ambiente (RECOMENDADO)**
```javascript
// ✅ CORRETO - Usar variáveis de ambiente apenas
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('GOOGLE_API_KEY não configurada');
}

const genAI = new GoogleGenerativeAI(apiKey);
```

**Solução - Opção 2: Se precisa armazenar no banco (menos seguro)**
```javascript
// Criptografar antes de salvar
const crypto = require('crypto');

function encryptApiKey(apiKey) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptApiKey(encrypted) {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

### 4. **Exposição de Porta PostgreSQL**
**Severidade:** 🔴 CRÍTICA  
**Localização:** [docker-compose.yml](docker-compose.yml#L18)

**Problema:**
```yaml
postgres:
  ports:
    - "5432:5432"  # 🚨 Expõe banco para toda a rede!
```

O Postgres está acessível de qualquer máquina na rede local.

**Impacto:**
- Qualquer pessoa na rede pode conectar ao banco de dados
- COM as credenciais fracas (`deskhub_user:deskhub_password`), é trivial invadir

**Solução:**
```yaml
# ✅ CORRETO - NÃO expor PostgreSQL
postgres:
  # Remover ports completo, ou apenas expor para localhost em desenvolvimento
  # ports:
  #   - "127.0.0.1:5432:5432"  # Apenas se necessário em dev local
  
  # Ou manter sem ports (só acessível por containers)
```

---

### 5. **CORS Muito Permissivo**
**Severidade:** 🔴 CRÍTICA  
**Localização:** [backend/src/server.js](backend/src/server.js#L11)

**Problema:**
```javascript
app.use(cors());  // 🚨 Permite requisições de QUALQUER origem
```

Isto permite CSRF (Cross-Site Request Forgery) attacks.

**Impacto:**
- Qualquer site pode fazer requisições para sua API
- Um site malicioso pode: criar registros, deletar dados, transferir informações
- Sem proteção CSRF

**Solução:**
```javascript
// ✅ CORRETO - CORS restritivo
app.use(cors({
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 horas
}));

// Adicionar proteção CSRF
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ cookie: true }));
```

---

### 6. **Headers de Segurança Implementados APÓS Middlewares Públicos**
**Severidade:** 🔴 CRÍTICA  
**Localização:** [backend/src/server.js](backend/src/server.js#L16-L21)

**Problema:**
```javascript
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(routes);

// ❌ ERRADO - Headers aplicados DESPUÉS das rotas!
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "...");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
```

Os headers de segurança devem ser aplicados ANTES de qualquer rota.

**Solução:**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');  // ✅ Nova dependência

require('dotenv').config();
const routes = require('./routers/routes');

const app = express();

// 1. Headers de segurança PRIMEIRO
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}));

// 2. CORS com configuração rigorosa
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. Limitar tamanho de requisição
app.use(express.json({ limit: '10mb' }));  // Reduzir de 50mb!
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 4. Então rotas
app.use(routes);

// 5. Error handling ÚLTIMO
app.use((err, req, res, next) => {
  // Nunca expor detalhes do erro em produção
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(status).json({
    error: isDev ? err.message : 'Erro interno do servidor',
    ...(isDev && { stack: err.stack })
  });
});
```

**Instalar dependência:**
```bash
npm install helmet
```

---

## 🟠 RISCOS ALTOS

### 7. **Validação de Autorização Fraca (Não verifica propriedade)**
**Severidade:** 🟠 ALTA  
**Localização:** [backend/src/controllers/AttendanceController.js](backend/src/controllers/AttendanceController.js)

**Problema:**
```javascript
async delete(req, res) {
  const { id } = req.params;
  await prisma.attendance.delete({
    where: { id: String(id) }  // 🚨 Não verifica se pertence ao usuário!
  });
}
```

Um usuário pode deletar registros de outros usuários apenas sabendo o ID.

**Solução:**
```javascript
// ✅ CORRETO
async delete(req, res) {
  try {
    const { id } = req.params;
    
    // 1. Verificar propriedade
    const attendance = await prisma.attendance.findUnique({
      where: { id }
    });
    
    if (!attendance) {
      return res.status(404).json({ error: 'Atendimento não encontrado' });
    }
    
    if (attendance.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // 2. Então deletar
    await prisma.attendance.delete({ where: { id } });
    
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao deletar' });
  }
}
```

**Aplicar a todos os controllers:**
- AttendanceController (create, update, delete, finalize)
- MessageController (create, update, delete)
- ShortcutController
- LinkController
- EmojiController
- NoteController
- AlertController
- KpiController

---

### 8. **Expiração de Token Muito Longa (7 dias)**
**Severidade:** 🟠 ALTA  
**Localização:** [backend/src/controllers/AuthController.js](backend/src/controllers/AuthController.js#L69)

**Problema:**
```javascript
const token = jwt.sign({ id: user.id, role: user.role }, SECRET, {
  expiresIn: '7d',  // 🚨 Muito tempo!
});
```

Se o token for comprometido, dura 7 dias de acesso não autorizado.

**Solução:**
```javascript
// ✅ CORRETO - Token curto + Refresh Token
const token = jwt.sign({ id: user.id, role: user.role }, SECRET, {
  expiresIn: '15m'  // 15 minutos
});

const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, {
  expiresIn: '7d'
});

res.json({ user, token, refreshToken });
```

Criar rota para refresh:
```javascript
routes.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newToken = jwt.sign({ id: decoded.id }, SECRET, { expiresIn: '15m' });
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
});
```

---

### 9. **Nenhum Rate Limiting**
**Severidade:** 🟠 ALTA  
**Localização:** Todo o servidor

**Problema:**
- API vulnerável a força bruta em login
- Sem proteção contra DDoS
- Sem limite de requisições por usuário

**Solução:**
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

// Limite global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições, tente novamente mais tarde'
});

app.use(limiter);

// Limite específico para login (mais rigoroso)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // apenas 5 tentativas
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login, tente novamente em 15 minutos'
});

routes.post('/login', loginLimiter, AuthController.login);
routes.post('/register', loginLimiter, AuthController.register);
```

---

### 10. **Não há HTTPS/TLS**
**Severidade:** 🟠 ALTA  
**Localização:** Toda comunicação

**Problema:**
- Dados em trânsito não são criptografados
- Tokens e credenciais podem ser interceptados
- Ataque man-in-the-middle possível

**Solução (Produção):**
1. Usar certificado SSL/TLS válido (Let's Encrypt)
2. Configurar reverse proxy (Nginx):

```nginx
# nginx.conf
upstream backend {
    server backend:3333;
}

server {
    listen 443 ssl http2;
    server_name api.deskhub.com;
    
    ssl_certificate /etc/letsencrypt/live/api.deskhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.deskhub.com/privkey.pem;
    
    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization $http_authorization;
    }
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name api.deskhub.com;
    return 301 https://$server_name$request_uri;
}
```

---

### 11. **IP Hardcoded no Frontend**
**Severidade:** 🟠 ALTA  
**Localização:** [docker-compose.yml](docker-compose.yml#L63)

**Problema:**
```yaml
frontend:
  environment:
    VITE_API_URL: http://192.168.3.82:3333  # 🚨 IP fixo!
```

**Solução:**
```yaml
# ✅ CORRETO - Usar variável de ambiente
frontend:
  environment:
    VITE_API_URL: ${API_URL}
    VITE_ENV: ${NODE_ENV}
```

Criar `.env`:
```env
API_URL=http://localhost:3333
NODE_ENV=development
```

Para produção:
```env
API_URL=https://api.deskhub.com
NODE_ENV=production
```

---

### 12. **Dados Sensíveis nos Logs**
**Severidade:** 🟠 ALTA  
**Localização:** Vários arquivos

**Problema:**
```javascript
console.error(error);  // 🚨 Pode expor dados sensíveis
```

**Solução:**
```javascript
// ✅ CORRETO - Logger seguro
const logger = {
  error: (message, error, isDev = false) => {
    console.error(`[ERROR] ${message}`);
    if (isDev && error) {
      console.error(error.stack);
    }
  },
  warn: (message) => {
    console.warn(`[WARN] ${message}`);
  },
  info: (message) => {
    console.info(`[INFO] ${message}`);
  }
};

try {
  // código
} catch (error) {
  logger.error('Erro ao processar', error, process.env.NODE_ENV === 'development');
  return res.status(500).json({ error: 'Erro interno' });
}
```

---

## 🟡 RISCOS MÉDIOS

### 13. **NFeController - Scraping com User-Agent Falso**
**Severidade:** 🟡 MÉDIA  
**Localização:** [backend/src/controllers/NfeController.js](backend/src/controllers/NfeController.js)

**Problema:**
```javascript
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...');
```

- Violação de ToS do site consultadanfe.com
- Pode ser bloqueado a qualquer momento
- Puppeteer é pesado e consume muitos recursos

**Solução Recomendada:**
```javascript
// Integrar com API oficial da SEFAZ ou SerTão
const axios = require('axios');

async function getNfeData(chave) {
  // Usar API oficial em vez de scraping
  const response = await axios.get(`https://api.sefaz.com.br/nfe/${chave}`, {
    headers: {
      'Authorization': `Bearer ${process.env.SEFAZ_API_KEY}`
    }
  });
  return response.data;
}
```

Ou usar biblioteca oficial:
```bash
npm install nfse-api
```

---

### 14. **Validação de Entrada Fraca**
**Severidade:** 🟡 MÉDIA  
**Localização:** Todos os controllers

**Problema:**
```javascript
const { name, email, password, role } = req.body;
// ❌ Sem validação de formato!
```

**Solução:**
```bash
npm install joi
```

```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  role: Joi.string().valid('user', 'admin').default('user')
});

async register(req, res) {
  // Validar entrada
  const { error, value } = registerSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const { name, email, password, role } = value;
  // ... resto do código
}
```

---

### 15. **Não há versionamento de API**
**Severidade:** 🟡 MÉDIA  
**Localização:** [backend/src/routers/routes.js](backend/src/routers/routes.js)

**Problema:**
- Sem versão nas rotas (`/api/v1/`)
- Mudanças quebram clientes em produção

**Solução:**
```javascript
// ✅ CORRETO
const v1Router = Router();

v1Router.post('/login', AuthController.login);
v1Router.post('/register', AuthController.register);
// ... todas as rotas

const routes = Router();
routes.use('/v1', v1Router);

// No frontend, usar /api/v1/login
```

---

## 🟢 RISCOS BAIXOS (Boas Práticas)

### 16. **Limite de Tamanho de Requisição Muito Alto**
```javascript
// ❌ ATUAL
app.use(express.json({ limit: '50mb' }));

// ✅ RECOMENDADO
app.use(express.json({ limit: '10mb' }));
```

### 17. **Falta de SQL Injection Protection**
Prisma já protege contra isso, mas validar entrada adiciona camada extra.

### 18. **Query Database Sem Timeout**
```javascript
// Adicionar timeout
const prisma = new PrismaClient({
  connectionLimit: 5,
});
```

### 19. **Sem HTTP/2 ou H2C**
O proxy Nginx recomendado acima já implementa.

---

## 📋 CHECKLIST DE CORREÇÃO

### 🔴 CRÍTICO (Fazer PRIMEIRO):
- [ ] Gerar JWT_SECRET randomicamente e usar variável de ambiente
- [ ] Mover credenciais do banco para `.env`
- [ ] Remover exposição da porta 5432
- [ ] Corrigir CORS com whitelist
- [ ] Instalar Helmet e aplicar headers antes das rotas
- [ ] Criptografar/mover API keys do Gemini

### 🟠 ALTO (Fazer em seguida):
- [ ] Adicionar validação de autorização em todos os controllers
- [ ] Reduzir expiração de token para 15 minutos
- [ ] Implementar rate limiting
- [ ] Configurar HTTPS/TLS
- [ ] Remover IP hardcoded do frontend

### 🟡 MÉDIO (Implementar logo):
- [ ] Melhorar validação de entrada (Joi)
- [ ] Melhorar handling de erros
- [ ] Trocar NFeController para API oficial
- [ ] Adicionar versionamento de API

---

## 🔧 EXEMPLO: arquivo `.env` seguro

```env
# ===== SEGURANÇA =====
NODE_ENV=production
JWT_SECRET=gerar_com_node_-c_require('crypto').randomBytes(32).toString('hex')
REFRESH_SECRET=gerar_com_node_-c_require('crypto').randomBytes(32).toString('hex')
ENCRYPTION_KEY=gerar_com_node_-c_require('crypto').randomBytes(32).toString('hex')

# ===== BANCO DE DADOS =====
DB_USER=deskhub_user_prod
DB_PASSWORD=senha_muito_forte_gerada_aleatoriamente_aqui
DB_NAME=deskhub_prod
DB_HOST=postgres
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?schema=public

# ===== API KEYS =====
GOOGLE_API_KEY=sua_chave_do_google_gemini
SEFAZ_API_KEY=sua_chave_da_sefaz_se_usar

# ===== URLS E PORTAS =====
PORT=3333
CORS_ORIGINS=https://deskhub.com,https://www.deskhub.com
API_URL=https://api.deskhub.com
FRONTEND_URL=https://deskhub.com

# ===== LOGS =====
LOG_LEVEL=info

# ===== THROTTLING =====
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📞 PRÓXIMOS PASSOS RECOMENDADOS

1. **Semana 1:** Corrigir todos os problemas 🔴 CRÍTICOS
2. **Semana 2:** Implementar todos os 🟠 ALTOS
3. **Semana 3:** Melhorias 🟡 MÉDIAS
4. **Antes de deploy:** Testes de segurança e penetration testing

---

**Documento preparado para:** Development Team  
**Classificação:** Confidencial - Interno  
**Próxima revisão:** Após implementação das correções
