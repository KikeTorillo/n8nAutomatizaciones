/**
 * Aplicación principal del backend SaaS
 * Sistema multi-tenant de agendamiento con integración n8n
 */

// Carga las variables de entorno desde el archivo .env al objeto process.env
// El archivo .env está en el directorio raíz del proyecto
require('dotenv').config();

// Importación del framework web Express.js para crear el servidor HTTP
const express = require('express');

// CORS (Cross-Origin Resource Sharing) - permite solicitudes desde diferentes dominios
const cors = require('cors');

// Helmet - middleware de seguridad que configura headers HTTP seguros
const helmet = require('helmet');

// Compression - comprime las respuestas HTTP para reducir el tamaño de transferencia
const compression = require('compression');

// Cookie parser - permite leer cookies del request
const cookieParser = require('cookie-parser');

// Morgan - logger HTTP que registra todas las peticiones entrantes
const morgan = require('morgan');

// Rate limiting - limita el número de peticiones por IP para prevenir ataques
const rateLimit = require('express-rate-limit');

// Logger personalizado del proyecto para logging estructurado
const logger = require('./utils/logger');

// Base de datos - conexiones a PostgreSQL
const database = require('./config/database');

// Helper para generar respuestas HTTP estandarizadas
const { ResponseHelper } = require('./utils/helpers');

const routerApi = require('./routes/api/v1');

// Importar rutas de la API (pendientes de implementar)
// const authRoutes = require('./routes/api/v1/auth');        // Rutas de autenticación
// const citasRoutes = require('./routes/api/v1/citas');       // Rutas de gestión de citas

/**
 * Clase principal que encapsula toda la aplicación SaaS
 * Implementa el patrón de clase para organizar la configuración del servidor
 */
class SaaSApplication {
  constructor() {
    // Crea una nueva instancia de Express
    this.app = express();

    // Puerto del servidor - usa variable de entorno o 3000 por defecto
    this.port = process.env.PORT || 3000;

    // Entorno de ejecución - development, production, test
    this.environment = process.env.NODE_ENV || 'development';

    // Inicializa todos los componentes de la aplicación en orden específico
    this.initializeMiddlewares();      // 1. Middlewares globales (seguridad, CORS, etc.)
    this.initializeRoutes();           // 2. Rutas de la API
    this.initializeErrorHandling();    // 3. Manejo de errores globales
    this.initializeGracefulShutdown(); // 4. Configuración para cierre limpio
  }

  /**
   * Inicializa middlewares globales
   * Los middlewares se ejecutan en el orden que se declaran
   */
  initializeMiddlewares() {
    // TRUST PROXY: Confiar en reverse proxies (Nginx)
    // Necesario en producción para que Express lea correctamente
    // los headers X-Forwarded-* enviados por el proxy
    this.app.set('trust proxy', true);

    // HELMET: Configuración de seguridad HTTP
    this.app.use(helmet({
      // Content Security Policy - previene ataques XSS
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],                    // Solo contenido del mismo origen por defecto
          styleSrc: ["'self'", "'unsafe-inline'"],  // CSS del mismo origen + inline styles
          scriptSrc: ["'self'"],                     // Solo scripts del mismo origen
          imgSrc: ["'self'", "data:", "https:"]      // Imágenes: mismo origen + data URLs + HTTPS
        }
      }
    }));

    // CORS: Configuración de Cross-Origin Resource Sharing
    this.app.use(cors({
      // Orígenes permitidos - desde env o localhost por defecto
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],

      // Permite el envío de cookies y headers de autenticación
      credentials: true,

      // Métodos HTTP permitidos
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

      // Headers permitidos en las peticiones
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
    }));

    // COMPRESSION: Comprime las respuestas para reducir el ancho de banda
    this.app.use(compression());

    // COOKIE PARSER: Permite leer cookies de las peticiones
    this.app.use(cookieParser());

    // JSON PARSER: Analiza el body de las peticiones JSON
    this.app.use(express.json({
      limit: '10mb',                    // Límite de tamaño del payload JSON
      verify: (req, res, buf) => {      // Función de verificación personalizada
        req.rawBody = buf;              // Guarda el body crudo para webhooks
      }
    }));

    // URL-ENCODED PARSER: Analiza datos de formularios HTML
    this.app.use(express.urlencoded({
      extended: true,                   // Permite objetos anidados y arrays
      limit: '10mb'                     // Límite de tamaño del payload
    }));

    // RATE LIMITING: Previene abuso limitando peticiones por IP
    const limiter = rateLimit({
      // Ventana de tiempo para el conteo (15 minutos por defecto)
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,

      // Máximo número de peticiones por ventana de tiempo
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

      // Mensaje de respuesta cuando se excede el límite
      message: {
        success: false,
        message: 'Demasiadas solicitudes, intenta más tarde',
        timestamp: new Date().toISOString()
      },

      // Incluye headers estándar de rate limiting (X-RateLimit-*)
      standardHeaders: true,

      // No incluye headers legacy (X-RateLimit-Limit, X-RateLimit-Remaining)
      legacyHeaders: false,

      // Saltar rate limiting en ambiente de test
      skip: (req) => process.env.NODE_ENV === 'test',

      // Desactivar validación estricta de trust proxy
      // En producción, Express está configurado con trust proxy para leer
      // correctamente los headers X-Forwarded-* de nginx
      validate: { trustProxy: false }
    });

    // Aplica rate limiting solo a rutas de API
    this.app.use('/api/', limiter);

    // MORGAN LOGGING: Logger HTTP para todas las peticiones
    this.app.use(morgan('combined', {
      stream: {
        // Redirige los logs de Morgan al logger personalizado
        write: (message) => {
          logger.info(message.trim(), { source: 'morgan' });
        }
      }
    }));

    // LOGGING PERSONALIZADO: Middleware para métricas detalladas
    this.app.use((req, res, next) => {
      // Marca el tiempo de inicio de la petición
      const start = Date.now();

      // Escucha cuando la respuesta termine
      res.on('finish', () => {
        // Calcula la duración total de la petición
        const duration = Date.now() - start;

        // Log detallado con información de rendimiento
        logger.httpRequest(req, res, duration);
      });

      // Continúa al siguiente middleware
      next();
    });

    // Log de confirmación de inicialización exitosa
    logger.info('Middlewares inicializados', {
      environment: this.environment,
      corsOrigin: process.env.CORS_ORIGIN
    });
  }

  /**
   * Inicializa rutas de la aplicación
   * Aquí se registrarán todas las rutas de la API cuando estén implementadas
   */
  initializeRoutes() {
    routerApi(this.app);

    // Health check endpoint (usado por MCP Server y monitoring)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'saas-backend',
        environment: this.environment
      });
    });

    // Ruta básica de prueba
    this.app.get('/', (req, res) => {
      res.json({
        message: 'SaaS Agendamiento API',
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });

    logger.info('Rutas inicializadas');
  }

  /**
   * Inicializa manejo de errores globales
   * Los manejadores de errores deben ir al final, después de todas las rutas
   */
  initializeErrorHandling() {
    // MANEJO 404: Captura todas las rutas no encontradas
    this.app.use('*', (req, res) => {
      ResponseHelper.notFound(res, `Ruta ${req.originalUrl} no encontrada`);
    });

    // MANEJO DE ERRORES GLOBALES: Captura todos los errores no manejados
    this.app.use((error, req, res, next) => {
      // Log detallado del error con contexto completo
      logger.error('Error no manejado', {
        error: error.message,           // Mensaje del error
        stack: error.stack,             // Stack trace completo
        url: req.originalUrl,           // URL de la petición que falló
        method: req.method,             // Método HTTP (GET, POST, etc.)
        body: req.body,                 // Body de la petición
        userId: req.user?.id,           // ID del usuario autenticado (si aplica)
        organizacionId: req.tenant?.id  // ID del tenant (multi-tenancy)
      });

      // Seguridad: No revelar detalles internos en producción
      const message = this.environment === 'production'
        ? 'Error interno del servidor'  // Mensaje genérico en producción
        : error.message;                // Mensaje detallado en desarrollo

      // Respuesta estandarizada de error
      ResponseHelper.error(res, message, 500);
    });

    // MANEJO DE EXCEPCIONES NO CAPTURADAS: Errores síncronos no manejados
    process.on('uncaughtException', (error) => {
      // Log crítico - esto indica un error grave en el código
      logger.error('Excepción no capturada', {
        error: error.message,
        stack: error.stack
      });

      // Cierre seguro del servidor - estas excepciones pueden dejar la app en estado inestable
      this.shutdown('uncaughtException');
    });

    // MANEJO DE PROMESAS RECHAZADAS: Promesas async/await no manejadas
    process.on('unhandledRejection', (reason, promise) => {
      // Log crítico - promesas rechazadas pueden causar memory leaks
      logger.error('Promesa rechazada no manejada', {
        reason: reason?.message || reason,  // Razón del rechazo
        promise: promise?.toString()        // Información de la promesa
      });

      // Cierre seguro del servidor - las promesas rechazadas pueden acumularse
      this.shutdown('unhandledRejection');
    });

    // Confirmación de configuración exitosa
    logger.info('Manejo de errores configurado');
  }

  /**
   * Configura graceful shutdown para cierre limpio del servidor
   * Escucha señales del sistema operativo para terminar ordenadamente
   */
  initializeGracefulShutdown() {
    // Señales del sistema que indican que la aplicación debe cerrarse
    const signals = ['SIGTERM', 'SIGINT'];  // SIGTERM (Docker), SIGINT (Ctrl+C)

    // Registra manejadores para cada señal
    signals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`Señal ${signal} recibida, iniciando graceful shutdown`);
        this.shutdown(signal);
      });
    });
  }

  /**
   * Ejecuta graceful shutdown
   * Cierra todos los recursos de manera ordenada antes de terminar el proceso
   */
  async shutdown(reason) {
    logger.info('Iniciando graceful shutdown', { reason });

    try {
      // 1. CERRAR SERVIDOR HTTP: Detiene la aceptación de nuevas conexiones
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);  // Espera a que terminen las conexiones activas
        });
        logger.info('Servidor HTTP cerrado');
      }

      // 2. CERRAR CONEXIONES DE BASE DE DATOS
      await database.close();
      logger.info('Conexiones de base de datos cerradas');

      // 3. Otros recursos: Redis, workers, etc. (futuro)

      // Shutdown exitoso
      logger.info('Graceful shutdown completado');
      process.exit(0);  // Exit code 0 = éxito
    } catch (error) {
      // Error durante el shutdown
      logger.error('Error durante graceful shutdown', { error: error.message });
      process.exit(1);  // Exit code 1 = error
    }
  }

  /**
   * Inicia el servidor HTTP y todas las dependencias
   * Método principal para arrancar la aplicación
   */
  async start() {
    try {
      // VERIFICACIÓN DE DEPENDENCIAS
      const dbHealth = await database.healthCheck();
      const hasDbIssues = Object.values(dbHealth).some(db => db.status !== 'ok');

      if (hasDbIssues) {
        logger.error('Problemas de conectividad con base de datos', { dbHealth });
        throw new Error('No se puede conectar a todas las bases de datos');
      }

      // INICIAR SERVIDOR HTTP: Escucha en el puerto configurado
      this.server = this.app.listen(this.port, () => {
        // Log de inicio exitoso con métricas del sistema
        logger.info('Servidor iniciado exitosamente', {
          port: this.port,                    // Puerto donde escucha el servidor
          environment: this.environment,      // Entorno (development/production)
          pid: process.pid,                   // Process ID del servidor
          nodeVersion: process.version,       // Versión de Node.js
          memory: process.memoryUsage()       // Uso de memoria al iniciar
        });

        // Log de configuración importante para troubleshooting
        logger.info('Configuración del servidor', {
          corsOrigin: process.env.CORS_ORIGIN,  // Orígenes permitidos para CORS
          // Rate limiting: X peticiones por Y milisegundos
          rateLimit: `${process.env.RATE_LIMIT_MAX_REQUESTS || 100} req/${process.env.RATE_LIMIT_WINDOW_MS || 900000}ms`,
          logLevel: process.env.LOG_LEVEL || 'info'  // Nivel de logging configurado
        });
      });

      // Retorna la instancia del servidor para uso en tests
      return this.server;
    } catch (error) {
      // Error crítico durante el inicio
      logger.error('Error iniciando servidor', { error: error.message });
      process.exit(1);  // Termina el proceso con código de error
    }
  }

  /**
   * Obtiene instancia de Express
   * Método público para acceder a la aplicación Express (útil para testing)
   */
  getExpressApp() {
    return this.app;
  }
}

// INSTANCIACIÓN: Crear una instancia única de la aplicación (patrón Singleton)
const saasApp = new SaaSApplication();

// EJECUCIÓN DIRECTA: Solo inicia el servidor si el archivo se ejecuta directamente
// (no cuando se importa como módulo en tests)
if (require.main === module) {
  saasApp.start();

  /**
   * SINCRONIZACIÓN AUTOMÁTICA DE PLANES CON MERCADO PAGO
   * =====================================================
   * Se ejecuta en background 5 segundos después del inicio del servidor
   * Solo en entornos de desarrollo/producción (no en tests)
   * Controlado por variable de entorno AUTO_SYNC_PLANS
   */
  if (process.env.AUTO_SYNC_PLANS === 'true' && process.env.NODE_ENV !== 'test') {
    setTimeout(async () => {
      try {
        const { exec } = require('child_process');
        const path = require('path');
        const scriptPath = path.join(__dirname, 'scripts', 'sync-plans-to-mercadopago.js');

        logger.info('🔄 Iniciando sincronización automática de planes con Mercado Pago...');

        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
          if (error) {
            logger.warn('⚠️  Error en sincronización automática de planes:', {
              error: error.message,
              stderr: stderr?.trim()
            });
          } else {
            logger.info('✅ Sincronización automática de planes completada');
            if (stdout && process.env.LOG_LEVEL === 'debug') {
              logger.debug('Output de sincronización:', { stdout: stdout.trim() });
            }
          }
        });
      } catch (error) {
        logger.warn('⚠️  No se pudo ejecutar sincronización automática de planes:', {
          error: error.message
        });
      }
    }, 5000); // Esperar 5 segundos para que el servidor esté completamente inicializado
  }
}

// EXPORTACIÓN: Permite importar la instancia desde otros archivos
module.exports = saasApp;