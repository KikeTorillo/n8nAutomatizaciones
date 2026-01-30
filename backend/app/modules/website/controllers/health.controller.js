/**
 * ====================================================================
 * HEALTH CONTROLLER
 * ====================================================================
 * Controlador para monitoreo de salud del módulo Website.
 * Incluye estado de circuit breakers, servicios externos y DB.
 *
 * @author Backend Team
 * @version 1.0.0
 * @since 2026-01-29
 */

const asyncHandler = require('express-async-handler');
const { CircuitBreakerFactory } = require('../services/circuitBreaker.service');
const UnsplashService = require('../services/unsplash.service');
const WebsiteAIService = require('../services/ai.service');
const RedisClientFactory = require('../../../services/RedisClientFactory');
const { pool } = require('../../../config/database');

// Tiempo de inicio del servidor
const startTime = Date.now();

/**
 * Obtener estado de salud del módulo website
 * GET /api/v1/website/health
 */
const obtenerHealth = asyncHandler(async (req, res) => {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  // Verificar estado de circuit breakers
  const circuitBreakers = CircuitBreakerFactory.getAllStatus();

  // Verificar Redis
  let redisStatus = { status: 'unknown', latencyMs: null };
  try {
    const redisStart = Date.now();
    const redisClient = await RedisClientFactory.getClient(5, 'HealthCheck');
    if (redisClient) {
      await redisClient.ping();
      redisStatus = {
        status: 'ok',
        latencyMs: Date.now() - redisStart,
      };
    } else {
      redisStatus = { status: 'unavailable', latencyMs: null };
    }
  } catch (error) {
    redisStatus = {
      status: 'error',
      latencyMs: null,
      error: error.message,
    };
  }

  // Verificar Database
  let databaseStatus = { status: 'unknown', latencyMs: null };
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    databaseStatus = {
      status: 'ok',
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    databaseStatus = {
      status: 'error',
      latencyMs: null,
      error: error.message,
    };
  }

  // Estado de servicios de IA
  const aiStatus = {
    provider: 'OpenRouter',
    apiKeyConfigured: WebsiteAIService.isAvailable(),
    circuitBreaker: circuitBreakers['ai:openrouter'] || null,
  };

  // Estado de Unsplash
  const unsplashStatus = {
    apiKeyConfigured: UnsplashService.isAvailable(),
    circuitBreaker: circuitBreakers['images:unsplash'] || null,
  };

  // Determinar estado general
  const isRedisOk = redisStatus.status === 'ok' || redisStatus.status === 'unavailable';
  const isDatabaseOk = databaseStatus.status === 'ok';
  const isAICircuitClosed = !circuitBreakers['ai:openrouter'] ||
    circuitBreakers['ai:openrouter'].state === 'CLOSED';
  const isUnsplashCircuitClosed = !circuitBreakers['images:unsplash'] ||
    circuitBreakers['images:unsplash'].state === 'CLOSED';

  let overallStatus;
  if (isDatabaseOk && isRedisOk && isAICircuitClosed && isUnsplashCircuitClosed) {
    overallStatus = 'ok';
  } else if (isDatabaseOk) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'unhealthy';
  }

  // Formatear circuit breakers para respuesta
  const formattedCircuitBreakers = {};
  for (const [name, status] of Object.entries(circuitBreakers)) {
    formattedCircuitBreakers[name] = {
      state: status.state,
      failureCount: status.failureCount,
      lastError: status.lastError,
      timeUntilRetry: status.timeUntilRetry > 0 ? status.timeUntilRetry : null,
      redisAvailable: status.redisAvailable,
    };
  }

  res.json({
    success: true,
    data: {
      status: overallStatus,
      timestamp,
      uptime,
      services: {
        circuitBreakers: formattedCircuitBreakers,
        redis: redisStatus,
        database: databaseStatus,
        ai: {
          provider: aiStatus.provider,
          apiKeyConfigured: aiStatus.apiKeyConfigured,
        },
        unsplash: {
          apiKeyConfigured: unsplashStatus.apiKeyConfigured,
        },
      },
    },
  });
});

/**
 * Obtener resumen rápido de salud (solo status)
 * GET /api/v1/website/health/ping
 */
const ping = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  obtenerHealth,
  ping,
};
