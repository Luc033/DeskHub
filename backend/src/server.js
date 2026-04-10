const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const routes = require('./routers/routes');
const securityConfig = require('./config/security');
const logger = require('./utils/logger');

try {
  securityConfig.validateSecurityConfig();
} catch (error) {
  logger.error('Falha na validação de segurança', error);
  process.exit(1);
}

const app = express();

app.use(helmet());

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "https:"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
};
if (process.env.NODE_ENV === 'production') {
  cspDirectives.upgradeInsecureRequests = [];
}
app.use(helmet.contentSecurityPolicy({ directives: cspDirectives }));

const limiterGlobal = rateLimit(securityConfig.getRateLimitConfig().global);
app.use(limiterGlobal);

app.use(cors(securityConfig.getCorsConfig()));

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: true }));

app.use(routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  logger.error('Erro não tratado', err);
  
  const isDev = process.env.NODE_ENV === 'development';
  const status = err.status || 500;
  
  res.status(status).json({
    error: isDev ? err.message : 'Erro interno do servidor',
    ...(isDev && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor DeskHub rodando na porta ${PORT} (${process.env.NODE_ENV})`);
});

module.exports = app;