/**
 * ====================================================================
 * CONFIGURACIÓN MCP SERVER
 * ====================================================================
 *
 * Centraliza todas las variables de entorno y configuraciones del
 * servidor MCP.
 */

require('dotenv').config();

module.exports = {
  // Servidor
  port: parseInt(process.env.MCP_PORT) || 3100,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Backend API
  backend: {
    url: process.env.BACKEND_API_URL || 'http://back:3000',
    timeout: parseInt(process.env.BACKEND_TIMEOUT) || 10000, // 10 segundos
  },

  // Autenticación (MULTI-TENANT)
  // Ya NO se usa un token fijo del .env
  // Cada chatbot pasa su propio token en los headers de cada request

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Rate Limiting (opcional)
  rateLimit: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 requests por minuto
  }
};
