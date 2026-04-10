module.exports = {
  validateSecurityConfig() {
    const required = ['JWT_SECRET', 'REFRESH_SECRET', 'DATABASE_URL'];
    
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(
          `Variável de ambiente obrigatória não configurada: ${key}\n`
        );
      }
    }
  },
  
  getRateLimitConfig() {
    return {
      global: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100,
        message: 'Muitas requisições, tente novamente mais tarde'
      },
      auth: {
        windowMs: 30 * 1000, // 30 segundos
        max: 10,
        skipSuccessfulRequests: true,
        message: 'Muitas tentativas, tente novamente em 30 segundos'
      }
    };
  },
  
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