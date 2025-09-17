/**
 * Sistema de logging estructurado con Winston
 */

const winston = require('winston');
const path = require('path');

// Configuración de formatos
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Configuración de transportes
const transports = [];

// Console transport (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'info'
    })
  );
}

// File transport para todos los logs
transports.push(
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'app.log'),
    format: logFormat,
    level: process.env.LOG_LEVEL || 'info',
    maxsize: 5242880, // 5MB
    maxFiles: 10,
    tailable: true
  })
);

// File transport solo para errores
transports.push(
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    format: logFormat,
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  })
);

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'saas-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  // Manejar excepciones no capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log')
    })
  ],
  // Manejar rechazos de promesas no capturados
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log')
    })
  ]
});

// Crear directorio de logs si no existe
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger con métodos de conveniencia para diferentes contextos
 */
class AppLogger {
  constructor(baseLogger) {
    this.logger = baseLogger;
  }

  /**
   * Log de información general
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log de errores
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * Log de advertencias
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log específico para requests HTTP
   */
  httpRequest(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      organizacionId: req.tenant?.id
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    this.logger.log(level, `${req.method} ${req.originalUrl}`, meta);
  }

  /**
   * Log específico para operaciones de base de datos
   */
  dbOperation(operation, table, duration, meta = {}) {
    const logMeta = {
      operation,
      table,
      duration: `${duration}ms`,
      ...meta
    };

    const level = duration > 1000 ? 'warn' : 'debug';
    this.logger.log(level, `DB ${operation} en ${table}`, logMeta);
  }

  /**
   * Log específico para autenticación
   */
  auth(event, userId, meta = {}) {
    const logMeta = {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...meta
    };

    this.logger.info(`Auth: ${event}`, logMeta);
  }

  /**
   * Log específico para integraciones externas
   */
  integration(service, operation, success, meta = {}) {
    const logMeta = {
      service,
      operation,
      success,
      timestamp: new Date().toISOString(),
      ...meta
    };

    const level = success ? 'info' : 'error';
    this.logger.log(level, `${service}: ${operation}`, logMeta);
  }

  /**
   * Log específico para webhooks
   */
  webhook(source, event, success, meta = {}) {
    const logMeta = {
      source,
      event,
      success,
      timestamp: new Date().toISOString(),
      ...meta
    };

    const level = success ? 'info' : 'error';
    this.logger.log(level, `Webhook ${source}: ${event}`, logMeta);
  }

  /**
   * Log específico para citas (core business)
   */
  cita(action, citaId, organizacionId, meta = {}) {
    const logMeta = {
      action,
      citaId,
      organizacionId,
      timestamp: new Date().toISOString(),
      ...meta
    };

    this.logger.info(`Cita: ${action}`, logMeta);
  }

  /**
   * Log específico para multi-tenant
   */
  tenant(action, organizacionId, meta = {}) {
    const logMeta = {
      action,
      organizacionId,
      timestamp: new Date().toISOString(),
      ...meta
    };

    this.logger.info(`Tenant: ${action}`, logMeta);
  }

  /**
   * Log de performance con métricas
   */
  performance(operation, metrics) {
    const logMeta = {
      operation,
      ...metrics,
      timestamp: new Date().toISOString()
    };

    const level = metrics.duration > 1000 ? 'warn' : 'info';
    this.logger.log(level, `Performance: ${operation}`, logMeta);
  }

  /**
   * Log de seguridad
   */
  security(event, level = 'warn', meta = {}) {
    const logMeta = {
      security_event: event,
      timestamp: new Date().toISOString(),
      ...meta
    };

    this.logger.log(level, `Security: ${event}`, logMeta);
  }
}

// Exportar instancia única
module.exports = new AppLogger(logger);