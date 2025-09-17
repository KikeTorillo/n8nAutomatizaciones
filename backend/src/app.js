/**
 * Aplicación principal del backend SaaS
 * Sistema multi-tenant de agendamiento con integración n8n
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const database = require('./config/database');
const { ResponseHelper } = require('./utils/helpers');

// Importar rutas (cuando las creemos)
// const authRoutes = require('./routes/api/v1/auth');
// const citasRoutes = require('./routes/api/v1/citas');

class SaaSApplication {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.environment = process.env.NODE_ENV || 'development';

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeGracefulShutdown();
  }

  /**
   * Inicializa middlewares globales
   */
  initializeMiddlewares() {
    // Seguridad básica
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }));

    // CORS configurado
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
    }));

    // Compresión
    this.app.use(compression());

    // Parsing de JSON con límite
    this.app.use(express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));

    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        success: false,
        message: 'Demasiadas solicitudes, intenta más tarde',
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use('/api/', limiter);

    // Logging de requests
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => {
          logger.info(message.trim(), { source: 'morgan' });
        }
      }
    }));

    // Middleware para logging personalizado
    this.app.use((req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.httpRequest(req, res, duration);
      });

      next();
    });

    logger.info('Middlewares inicializados', {
      environment: this.environment,
      corsOrigin: process.env.CORS_ORIGIN
    });
  }

  /**
   * Inicializa rutas de la aplicación
   */
  initializeRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await database.healthCheck();
        const health = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment: this.environment,
          version: process.env.npm_package_version || '1.0.0',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          database: dbHealth
        };

        // Verificar si alguna BD está con problemas
        const hasDbIssues = Object.values(dbHealth).some(db => db.status !== 'ok');
        const statusCode = hasDbIssues ? 503 : 200;

        res.status(statusCode).json(health);
      } catch (error) {
        logger.error('Error en health check', { error: error.message });
        res.status(503).json({
          status: 'error',
          message: 'Service unavailable',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Info de la API
    this.app.get('/api', (req, res) => {
      ResponseHelper.success(res, {
        name: 'SaaS Agendamiento API',
        version: process.env.npm_package_version || '1.0.0',
        environment: this.environment,
        documentation: '/api-docs',
        endpoints: {
          auth: '/api/v1/auth',
          citas: '/api/v1/citas',
          clientes: '/api/v1/clientes',
          disponibilidad: '/api/v1/disponibilidad',
          webhooks: '/api/v1/webhooks'
        }
      });
    });

    // Rutas de la API v1 (placeholder hasta que las creemos)
    this.app.use('/api/v1', (req, res, next) => {
      // Middleware placeholder para rutas API
      logger.debug('API v1 request', {
        method: req.method,
        path: req.path,
        body: req.body
      });
      next();
    });

    // TODO: Agregar rutas cuando las creemos
    // this.app.use('/api/v1/auth', authRoutes);
    // this.app.use('/api/v1/citas', citasRoutes);

    // Ruta 404 para API
    this.app.use('/api/*', (req, res) => {
      ResponseHelper.notFound(res, `Endpoint ${req.originalUrl} no encontrado`);
    });

    // Ruta raíz
    this.app.get('/', (req, res) => {
      res.json({
        message: 'SaaS Agendamiento Backend API',
        version: process.env.npm_package_version || '1.0.0',
        documentation: '/api-docs',
        health: '/health',
        api: '/api'
      });
    });

    logger.info('Rutas inicializadas');
  }

  /**
   * Inicializa manejo de errores globales
   */
  initializeErrorHandling() {
    // Manejo de errores 404
    this.app.use('*', (req, res) => {
      ResponseHelper.notFound(res, `Ruta ${req.originalUrl} no encontrada`);
    });

    // Manejo de errores globales
    this.app.use((error, req, res, next) => {
      logger.error('Error no manejado', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        userId: req.user?.id,
        organizacionId: req.tenant?.id
      });

      // No revelar detalles del error en producción
      const message = this.environment === 'production'
        ? 'Error interno del servidor'
        : error.message;

      ResponseHelper.error(res, message, 500);
    });

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('Excepción no capturada', {
        error: error.message,
        stack: error.stack
      });

      // Graceful shutdown
      this.shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Promesa rechazada no manejada', {
        reason: reason?.message || reason,
        promise: promise?.toString()
      });

      // Graceful shutdown
      this.shutdown('unhandledRejection');
    });

    logger.info('Manejo de errores configurado');
  }

  /**
   * Configura graceful shutdown
   */
  initializeGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT'];

    signals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`Señal ${signal} recibida, iniciando graceful shutdown`);
        this.shutdown(signal);
      });
    });
  }

  /**
   * Ejecuta graceful shutdown
   */
  async shutdown(reason) {
    logger.info('Iniciando graceful shutdown', { reason });

    try {
      // Cerrar servidor HTTP
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('Servidor HTTP cerrado');
      }

      // Cerrar conexiones de base de datos
      await database.close();
      logger.info('Conexiones de base de datos cerradas');

      logger.info('Graceful shutdown completado');
      process.exit(0);
    } catch (error) {
      logger.error('Error durante graceful shutdown', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Inicia el servidor
   */
  async start() {
    try {
      // Verificar conexión a base de datos
      const dbHealth = await database.healthCheck();
      const hasDbIssues = Object.values(dbHealth).some(db => db.status !== 'ok');

      if (hasDbIssues) {
        logger.error('Problemas de conectividad con base de datos', { dbHealth });
        throw new Error('No se puede conectar a todas las bases de datos');
      }

      // Iniciar servidor
      this.server = this.app.listen(this.port, () => {
        logger.info('Servidor iniciado exitosamente', {
          port: this.port,
          environment: this.environment,
          pid: process.pid,
          nodeVersion: process.version,
          memory: process.memoryUsage()
        });

        // Log de configuración importante
        logger.info('Configuración del servidor', {
          corsOrigin: process.env.CORS_ORIGIN,
          rateLimit: `${process.env.RATE_LIMIT_MAX_REQUESTS || 100} req/${process.env.RATE_LIMIT_WINDOW_MS || 900000}ms`,
          logLevel: process.env.LOG_LEVEL || 'info'
        });
      });

      return this.server;
    } catch (error) {
      logger.error('Error iniciando servidor', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Obtiene instancia de Express
   */
  getExpressApp() {
    return this.app;
  }
}

// Crear y exportar instancia
const saasApp = new SaaSApplication();

// Si se ejecuta directamente, iniciar servidor
if (require.main === module) {
  saasApp.start();
}

module.exports = saasApp;