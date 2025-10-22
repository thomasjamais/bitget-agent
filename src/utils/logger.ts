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
      ignore: 'pid,hostname'
    }
  }
});

/**
 * Create a child logger with additional context
 */
export const createLogger = (context: string) => {
  return logger.child({ context });
};