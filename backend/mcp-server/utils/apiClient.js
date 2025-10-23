/**
 * ====================================================================
 * API CLIENT - Cliente HTTP para comunicación con Backend API
 * ====================================================================
 *
 * Cliente Axios configurado para llamar al backend API del SaaS
 * con autenticación JWT y manejo de errores.
 *
 * MULTI-TENANT: El token JWT se pasa dinámicamente en cada request,
 * no se guarda en el cliente. Cada chatbot usa su propio token.
 */

const axios = require('axios');
const config = require('../config');
const logger = require('./logger');

/**
 * Crea un cliente API con un token específico
 * @param {string} jwtToken - Token JWT único del chatbot
 * @returns {AxiosInstance} Cliente configurado
 */
function createApiClient(jwtToken) {
  if (!jwtToken) {
    throw new Error('JWT Token es requerido para crear cliente API');
  }

  return axios.create({
    baseURL: config.backend.url,
    timeout: config.backend.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
  });
}

/**
 * Cliente HTTP base (SIN token - solo para health check)
 */
const baseClient = axios.create({
  baseURL: config.backend.url,
  timeout: config.backend.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging de requests (baseClient)
baseClient.interceptors.request.use(
  (request) => {
    logger.debug(`API Request: ${request.method.toUpperCase()} ${request.url}`, {
      params: request.params,
      data: request.data,
    });
    return request;
  },
  (error) => {
    logger.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de responses (baseClient)
baseClient.interceptors.response.use(
  (response) => {
    logger.debug(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error(`API Error ${error.response.status}:`, {
        url: error.config.url,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      logger.error('API Network Error:', {
        url: error.config.url,
        message: error.message,
      });
    } else {
      logger.error('API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Agrega interceptores a un cliente creado dinámicamente
 * @param {AxiosInstance} client
 */
function setupInterceptors(client) {
  client.interceptors.request.use(
    (request) => {
      logger.debug(`API Request: ${request.method.toUpperCase()} ${request.url}`);
      return request;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      logger.debug(`API Response: ${response.status}`);
      return response;
    },
    (error) => {
      if (error.response) {
        logger.error(`API Error ${error.response.status}:`, error.response.data);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

module.exports = {
  createApiClient: (jwtToken) => setupInterceptors(createApiClient(jwtToken)),
  baseClient,
};
