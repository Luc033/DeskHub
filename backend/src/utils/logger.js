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