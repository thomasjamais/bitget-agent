import pino from 'pino';

/**
 * Structured logger configuration
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
      // Configuration critique pour afficher TOUS les objets
      includeObject: true,
      singleLine: false,
      // Affiche les objets avec une belle indentation
      messageFormat: '{msg}',
      // Garde tous les champs des objets
      hideObject: false
    }
  }
});

/**
 * Create a child logger with additional context
 */
export const createLogger = (context: string) => {
  return logger.child({ context });
};

/**
 * Log avec affichage explicite des objets
 */
export const logWithObject = {
  info: (message: string, obj?: any) => {
    if (obj) {
      logger.info({ data: obj }, message);
      // Affichage de secours si pino-pretty ne fonctionne pas
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 OBJECT DATA for "${message}":`, JSON.stringify(obj, null, 2));
      }
    } else {
      logger.info(message);
    }
  },
  
  error: (message: string, obj?: any) => {
    if (obj) {
      logger.error({ data: obj }, message);
      // Affichage de secours si pino-pretty ne fonctionne pas
      if (process.env.NODE_ENV === 'development') {
        console.error(`🔴 ERROR DATA for "${message}":`, JSON.stringify(obj, null, 2));
      }
    } else {
      logger.error(message);
    }
  },
  
  warn: (message: string, obj?: any) => {
    if (obj) {
      logger.warn({ data: obj }, message);
      // Affichage de secours si pino-pretty ne fonctionne pas
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ WARN DATA for "${message}":`, JSON.stringify(obj, null, 2));
      }
    } else {
      logger.warn(message);
    }
  }
};