/**
 * @fileoverview Middleware de Rate Limiting Enterprise con Redis
 *
 * Sistema completo de rate limiting para proteger la API contra abuso y ataques DDoS.
 * Utiliza Redis (DB 2) para almacenamiento persistente con fallback en memoria.
 *
 * Características:
 * - Múltiples tipos de rate limiting (IP, usuario, organización, plan)
 * - Integración con Redis para persistencia
 * - Transacciones atómicas MULTI/EXEC
 * - Headers HTTP estándar (X-RateLimit-*)
 * - Fallback automático en memoria si Redis falla
 * - Logging detallado de eventos de seguridad
 * - Configuración flexible por endpoint
 *
 * @author Backend Team
 * @version 1.0.0
 * @since 2025-09-17
 */

const redis = require('redis');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

/**
 * Servicio principal de Rate Limiting
 *
 * Maneja la conexión a Redis y proporciona métodos para incrementar contadores,
 * obtener valores actuales y gestionar TTL de las keys.
 *
 * @class RateLimitingService
 */
class RateLimitingService {
  /**
   * Inicializa el servicio de rate limiting
   *
   * Configura la conexión a Redis y un almacén de fallback en memoria.
   * Se conecta automáticamente a Redis DB 2 (dedicada a rate limiting).
   */
  constructor() {
    /** @type {import('redis').RedisClientType|null} Cliente Redis para rate limiting */
    this.redisClient = null;

    /** @type {Map<string, number>} Almacén de fallback en memoria si Redis falla */
    this.fallbackStore = new Map();

    // Inicializar conexión Redis de forma asíncrona
    this.initRedis();
  }

  /**
   * Inicializa la conexión a Redis para rate limiting
   *
   * Se conecta a la base de datos 2 de Redis, dedicada exclusivamente
   * para almacenar contadores de rate limiting. Si falla, usa fallback en memoria.
   *
   * @async
   * @private
   * @throws {Error} Si hay problemas de conexión (manejado con fallback)
   */
  async initRedis() {
    try {
      // Solo intentar conectar Redis si está configurado
      if (process.env.REDIS_HOST) {
        this.redisClient = redis.createClient({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
          },
          password: process.env.REDIS_PASSWORD || undefined,
          database: 2 // DB 2: Dedicada exclusivamente para rate limiting
        });

        await this.redisClient.connect();
        logger.info('Redis conectado para rate limiting');
      } else {
        logger.info('Redis no configurado, usando almacenamiento en memoria para rate limiting');
      }
    } catch (error) {
      logger.warn('Redis no disponible para rate limiting, usando fallback en memoria', {
        error: error.message
      });
      this.redisClient = null;
    }
  }

  /**
   * Obtiene el contador actual para una key específica
   *
   * @async
   * @param {string} key - Key del rate limit (ej: 'rate_limit:ip:192.168.1.1')
   * @returns {Promise<number>} Número actual de requests en la ventana
   * @example
   * const count = await rateLimitService.getCount('rate_limit:ip:127.0.0.1');
   * console.log(`Requests actuales: ${count}`);
   */
  async getCount(key) {
    try {
      if (this.redisClient && this.redisClient.isReady) {
        const count = await this.redisClient.get(key);
        return parseInt(count) || 0;
      } else {
        return this.fallbackStore.get(key) || 0;
      }
    } catch (error) {
      logger.error('Error obteniendo contador de rate limit', { error: error.message, key });
      return 0;
    }
  }

  /**
   * Incrementa el contador de requests y establece TTL
   *
   * Utiliza transacciones Redis (MULTI/EXEC) para operaciones atómicas.
   * Incrementa el contador y establece el TTL en una sola transacción.
   *
   * @async
   * @param {string} key - Key del rate limit
   * @param {number} windowSeconds - Duración de la ventana en segundos
   * @returns {Promise<number>} Nuevo valor del contador después del incremento
   * @example
   * // Incrementar contador con ventana de 15 minutos
   * const newCount = await rateLimitService.incrementCount('rate_limit:ip:127.0.0.1', 900);
   */
  async incrementCount(key, windowSeconds) {
    try {
      if (this.redisClient && this.redisClient.isReady) {
        // Usar transacción atómica para incrementar y establecer TTL
        const pipeline = this.redisClient.multi();
        pipeline.incr(key);                    // Incrementar contador
        pipeline.expire(key, windowSeconds);   // Establecer TTL
        const results = await pipeline.exec(); // Ejecutar transacción
        return parseInt(results[0]) || 1;
      } else {
        const current = this.fallbackStore.get(key) || 0;
        const newCount = current + 1;
        this.fallbackStore.set(key, newCount);

        // Limpiar después del tiempo especificado
        setTimeout(() => {
          this.fallbackStore.delete(key);
        }, windowSeconds * 1000);

        return newCount;
      }
    } catch (error) {
      logger.error('Error incrementando contador de rate limit', { error: error.message, key });
      return 1;
    }
  }

  /**
   * Obtiene el tiempo restante antes de que expire la key
   *
   * @async
   * @param {string} key - Key del rate limit
   * @returns {Promise<number>} Segundos restantes hasta que expire la key (0 si no tiene TTL)
   * @example
   * const remaining = await rateLimitService.getRemainingTime('rate_limit:ip:127.0.0.1');
   * console.log(`Expira en ${remaining} segundos`);
   */
  async getRemainingTime(key) {
    try {
      if (this.redisClient && this.redisClient.isReady) {
        const ttl = await this.redisClient.ttl(key);
        return ttl > 0 ? ttl : 0;
      } else {
        return 0; // En memoria no podemos obtener TTL fácilmente
      }
    } catch (error) {
      logger.error('Error obteniendo tiempo restante', { error: error.message, key });
      return 0;
    }
  }

  /**
   * Cierra la conexión a Redis y limpia recursos
   *
   * Debe llamarse al finalizar la aplicación o tests para evitar
   * que el proceso se quede colgado esperando conexiones abiertas.
   *
   * @async
   * @example
   * // En shutdown de la app
   * await rateLimitService.close();
   *
   * @example
   * // En teardown de tests
   * afterAll(async () => {
   *   await rateLimitService.close();
   * });
   */
  async close() {
    try {
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.quit();
        logger.info('Cliente Redis de rate limiting cerrado');
      }
      this.fallbackStore.clear();
    } catch (error) {
      logger.warn('Error cerrando cliente Redis de rate limiting', {
        error: error.message
      });
    }
  }
}

// Instancia singleton del servicio de rate limiting
const rateLimitService = new RateLimitingService();

/**
 * Factory para crear middlewares de rate limiting personalizados
 *
 * Crea un middleware Express que controla la cantidad de requests permitidas
 * en una ventana de tiempo específica. Soporta configuración flexible para
 * diferentes tipos de endpoints.
 *
 * @param {Object} options - Configuración del rate limiting
 * @param {number} [options.windowMs=900000] - Duración de la ventana en ms (15 min por defecto)
 * @param {number} [options.max=100] - Máximo número de requests por ventana
 * @param {string} [options.message] - Mensaje de error cuando se excede el límite
 * @param {Function} [options.keyGenerator] - Función para generar la key del rate limit
 * @param {Function} [options.skip] - Función para determinar si saltar el rate limiting
 * @param {Function} [options.onLimitReached] - Callback cuando se alcanza el límite
 * @returns {Function} Middleware Express de rate limiting
 *
 * @example
 * // Rate limiting básico por IP
 * const ipLimit = createRateLimit({
 *   windowMs: 15 * 60 * 1000, // 15 minutos
 *   max: 100,                 // 100 requests
 *   keyGenerator: (req) => `ip:${req.ip}`
 * });
 *
 * @example
 * // Rate limiting por usuario autenticado
 * const userLimit = createRateLimit({
 *   windowMs: 60 * 60 * 1000,  // 1 hora
 *   max: 1000,                 // 1000 requests
 *   keyGenerator: (req) => req.user ? `user:${req.user.id}` : `ip:${req.ip}`,
 *   skip: (req) => !req.user   // Solo aplicar a usuarios autenticados
 * });
 */
const createRateLimit = (options = {}) => {
  // Configuración por defecto del rate limiting
  const config = {
    windowMs: 15 * 60 * 1000,                              // 15 minutos por defecto
    max: 100,                                               // 100 requests por defecto
    message: 'Demasiadas solicitudes, intenta más tarde',   // Mensaje de error estándar
    keyGenerator: (req) => req.ip,                          // Usar IP por defecto
    skip: () => process.env.NODE_ENV === 'test',            // Saltar en entorno de test
    onLimitReached: null,                                   // Sin callback por defecto
    ...options                                              // Sobreescribir con opciones del usuario
  };

  /**
   * Middleware Express de rate limiting
   *
   * @param {import('express').Request} req - Request de Express
   * @param {import('express').Response} res - Response de Express
   * @param {import('express').NextFunction} next - Función next de Express
   */
  return async (req, res, next) => {
    try {
      // Verificar si debe saltar esta request (ej: IPs whitelistadas, usuarios especiales)
      const shouldSkip = config.skip(req);

      if (shouldSkip) {
        return next();
      }

      // Generar key única para este rate limit
      const key = `rate_limit:${config.keyGenerator(req)}`;
      const windowSeconds = Math.ceil(config.windowMs / 1000);

      // Incrementar contador y obtener tiempo restante
      const currentCount = await rateLimitService.incrementCount(key, windowSeconds);
      const remainingTime = await rateLimitService.getRemainingTime(key);

      // Agregar headers estándar de rate limiting (RFC 6585)
      res.set({
        'X-RateLimit-Limit': config.max,                                                    // Límite máximo
        'X-RateLimit-Remaining': Math.max(0, config.max - currentCount),                   // Requests restantes
        'X-RateLimit-Reset': new Date(Date.now() + (remainingTime * 1000)).toISOString()   // Cuándo se resetea
      });

      // Verificar si se excedió el límite
      if (currentCount > config.max) {
        // Ejecutar callback personalizado si se proporciona
        if (config.onLimitReached) {
          config.onLimitReached(req, res);
        }

        logger.warn('Rate limit excedido', {
          key: key,
          count: currentCount,
          limit: config.max,
          ip: req.ip,
          userId: req.user?.id,
          path: req.path
        });

        return ResponseHelper.error(res, config.message, 429, {
          retryAfter: remainingTime
        });
      }

      next();
    } catch (error) {
      logger.error('Error en rate limiting', { error: error.message });
      // En caso de error, permitir la request para no bloquear el servicio
      next();
    }
  };
};

/**
 * Rate limiting general por dirección IP
 *
 * Protección básica contra spam y ataques automatizados.
 * Aplica a todas las requests desde la misma IP.
 *
 * Configuración:
 * - 100 requests por 15 minutos por IP
 * - Key format: 'rate_limit:ip:192.168.1.1'
 *
 * @type {Function} Middleware Express
 * @example
 * router.use('/api/v1/*', ipRateLimit);
 */
const ipRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,                                              // 15 minutos
  max: 100,                                                            // 100 requests
  message: 'Demasiadas solicitudes desde esta IP, intenta en 15 minutos',
  keyGenerator: (req) => `ip:${req.ip}`                                 // Key por IP
});

/**
 * Rate limiting para usuarios autenticados
 *
 * Límites más generosos para usuarios identificados del sistema.
 * Fallback a rate limiting por IP si no hay usuario autenticado.
 *
 * Configuración:
 * - 200 requests por 15 minutos por usuario
 * - Solo se aplica si req.user existe
 * - Key format: 'rate_limit:user:123' o 'rate_limit:ip:X' como fallback
 *
 * @type {Function} Middleware Express
 * @example
 * router.use('/api/v1/dashboard/*', userRateLimit);
 */
const userRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,                                      // 15 minutos
  max: 1000,                                                   // 1000 requests (POS necesita muchas)
  message: 'Demasiadas solicitudes, intenta en 15 minutos',
  keyGenerator: (req) => req.user ? `user:${req.user.id}` : `ip:${req.ip}`, // Usuario o IP
  skip: (req) => process.env.NODE_ENV === 'test' || !req.user  // Saltar en test o sin usuario
});

/**
 * Rate limiting por organización (tenant)
 *
 * Controla el uso de API a nivel de empresa/organización.
 * Útil para evitar que una organización abuse del sistema.
 *
 * Configuración:
 * - 1000 requests por hora por organización
 * - Requiere usuario autenticado
 * - Key format: 'rate_limit:org:456'
 *
 * @type {Function} Middleware Express
 * @example
 * router.use('/api/v1/organizaciones/:id/*', organizationRateLimit);
 */
const organizationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,                                              // 1 hora
  max: 1000,                                                           // 1000 requests por org
  message: 'Límite de solicitudes de la organización excedido',
  keyGenerator: (req) => req.user ? `org:${req.user.organizacion_id}` : `ip:${req.ip}`,
  skip: (req) => process.env.NODE_ENV === 'test' || !req.user          // Saltar en test o sin usuario
});

/**
 * Rate limiting estricto para endpoints de autenticación
 *
 * Protección específica contra ataques de fuerza bruta en login/registro.
 * Límites muy restrictivos para prevenir intentos automatizados.
 *
 * Configuración:
 * - 10 intentos por 15 minutos por IP
 * - Logging automático de eventos sospechosos
 * - Key format: 'rate_limit:auth:192.168.1.1'
 *
 * @type {Function} Middleware Express
 * @example
 * router.post('/auth/login', authRateLimit, loginController);
 * router.post('/auth/register', authRateLimit, registerController);
 */
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,                                        // 15 minutos
  max: 10,                                                       // Solo 10 intentos
  message: 'Demasiados intentos de inicio de sesión, intenta en 15 minutos',
  keyGenerator: (req) => `auth:${req.ip}`,                        // Key específica para auth
  onLimitReached: (req, res) => {
    // Log detallado de eventos de seguridad
    logger.warn('Rate limit de autenticación excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiting para APIs públicas y webhooks
 *
 * Diseñado para integraciones de terceros y endpoints públicos.
 * Ventana más corta pero más permisiva para uso legítimo de APIs.
 *
 * Configuración:
 * - 60 requests por minuto
 * - Soporte para API keys (límites por key vs por IP)
 * - Key format: 'rate_limit:api:key123' o 'rate_limit:ip:X'
 *
 * @type {Function} Middleware Express
 * @example
 * router.use('/api/public/*', apiRateLimit);
 * router.use('/webhooks/*', apiRateLimit);
 */
const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000,                                           // 1 minuto
  max: 1000,                                                    // 1000 requests por minuto (temporal para diagnóstico)
  message: 'Límite de API excedido, máximo 1000 requests por minuto',
  keyGenerator: (req) => {
    // Priorizar API key si está disponible, sino usar IP
    const apiKey = req.headers['x-api-key'];
    return apiKey ? `api:${apiKey}` : `ip:${req.ip}`;
  },
  skip: (req) => {
    // Saltar en ambiente de test o desarrollo (Docker usa IPs 172.x.x.x)
    if (process.env.NODE_ENV === 'test') return true;
    if (process.env.NODE_ENV === 'development') {
      const ip = req.ip || '';
      return ip === '127.0.0.1' || ip === '::1' ||
             ip.startsWith('::ffff:127.') || ip.startsWith('::ffff:172.') ||
             ip.startsWith('172.') || ip.startsWith('192.168.');
    }
    return false;
  }
});

/**
 * Rate limiting para operaciones computacionalmente costosas
 *
 * Específico para endpoints que consumen muchos recursos del servidor
 * como generación de reportes, exports masivos, backups, configuración de chatbots, etc.
 *
 * Configuración:
 * - 20 operaciones por hora por usuario
 * - Ventana larga para operaciones intensivas
 * - Key format: 'rate_limit:heavy:123' por usuario
 *
 * @type {Function} Middleware Express
 * @example
 * router.post('/reports/export-all', heavyOperationRateLimit, exportController);
 * router.get('/analytics/full-report', heavyOperationRateLimit, analyticsController);
 * router.post('/chatbots/configurar', heavyOperationRateLimit, chatbotController);
 */
const heavyOperationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,                                      // 1 hora
  max: 20,                                                     // 20 operaciones pesadas
  message: 'Límite de operaciones pesadas excedido, máximo 20 por hora',
  keyGenerator: (req) => req.user ? `heavy:${req.user.id}` : `heavy:${req.ip}` // Por usuario
});

/**
 * Rate limiting dinámico basado en el plan de suscripción
 *
 * Ajusta automáticamente los límites según el plan de la organización.
 * Los planes superiores obtienen límites más generosos.
 *
 * Límites por plan:
 * - Básico: 500 requests/hora
 * - Profesional: 2000 requests/hora
 * - Premium: 5000 requests/hora
 * - Enterprise: 10000 requests/hora
 *
 * @param {import('express').Request} req - Request con información de tenant
 * @param {import('express').Response} res - Response de Express
 * @param {import('express').NextFunction} next - Función next
 *
 * @example
 * router.use('/api/v1/premium-features/*', planBasedRateLimit);
 */
const planBasedRateLimit = (req, res, next) => {
  if (!req.user || !req.tenant) {
    return next();
  }

  // Configuración de límites por plan de suscripción
  const planLimits = {
    basico: { max: 500, windowMs: 60 * 60 * 1000 },        // 500 requests/hora
    profesional: { max: 2000, windowMs: 60 * 60 * 1000 },  // 2000 requests/hora
    premium: { max: 5000, windowMs: 60 * 60 * 1000 },      // 5000 requests/hora
    enterprise: { max: 10000, windowMs: 60 * 60 * 1000 }   // 10000 requests/hora
  };

  const limits = planLimits[req.tenant.plan] || planLimits.basico;

  const dynamicRateLimit = createRateLimit({
    ...limits,
    message: `Límite del plan ${req.tenant.plan} excedido`,
    keyGenerator: (req) => `plan:${req.user.organizacion_id}`
  });

  return dynamicRateLimit(req, res, next);
};

/**
 * Utilidad para limpiar contadores de rate limiting
 *
 * Función de utilidad para remover keys específicas de rate limiting.
 * Útil para testing, debugging o para resetear límites manualmente.
 *
 * @async
 * @param {string} key - Key específica a limpiar o patrón
 * @throws {Error} Si hay problemas al conectar con Redis
 *
 * @example
 * // Limpiar rate limit específico
 * await clearRateLimit('rate_limit:ip:127.0.0.1');
 *
 * @example
 * // En tests
 * afterEach(async () => {
 *   await clearRateLimit('rate_limit:test:*');
 * });
 */
const clearRateLimit = async (key) => {
  try {
    if (rateLimitService.redisClient && rateLimitService.redisClient.isReady) {
      await rateLimitService.redisClient.del(key);
    } else {
      rateLimitService.fallbackStore.delete(key);
    }
  } catch (error) {
    logger.error('Error limpiando rate limit', { error: error.message, key });
  }
};

// Exportar todos los middlewares y utilidades de rate limiting
module.exports = {
  // Middlewares predefinidos
  ipRateLimit,                    // Rate limiting general por IP
  userRateLimit,                  // Rate limiting por usuario autenticado
  organizationRateLimit,          // Rate limiting por organización
  authRateLimit,                  // Rate limiting estricto para autenticación
  apiRateLimit,                   // Rate limiting para APIs públicas
  heavyOperationRateLimit,        // Rate limiting para operaciones costosas
  planBasedRateLimit,             // Rate limiting dinámico por plan

  // Utilidades
  createRateLimit,                // Factory para crear rate limits personalizados
  clearRateLimit,                 // Función para limpiar contadores (testing)
  rateLimitService                // Servicio de rate limiting (para cerrar conexiones)
};