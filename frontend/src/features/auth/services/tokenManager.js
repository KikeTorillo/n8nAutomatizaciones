/**
 * Token Manager - Gestión de accessToken en memoria
 * Ene 2026 - Migración de seguridad XSS
 *
 * El accessToken se almacena SOLO en memoria (no localStorage)
 * para prevenir ataques XSS. El refreshToken se maneja via
 * cookie httpOnly desde el backend.
 */

// Token en memoria - no persiste entre recargas
let accessToken = null;

// Control de refresh en progreso
let isRefreshing = false;

// Cola de callbacks esperando nuevo token
let refreshSubscribers = [];

/**
 * Obtener el accessToken actual
 * @returns {string|null}
 */
export const getAccessToken = () => accessToken;

/**
 * Guardar accessToken en memoria
 * @param {string} token
 */
export const setAccessToken = (token) => {
  accessToken = token;
};

/**
 * Limpiar accessToken de memoria
 */
export const clearAccessToken = () => {
  accessToken = null;
};

/**
 * Verificar si hay un token válido
 * @returns {boolean}
 */
export const hasToken = () => !!accessToken;

/**
 * Obtener estado de refresh en progreso
 * @returns {boolean}
 */
export const getIsRefreshing = () => isRefreshing;

/**
 * Establecer estado de refresh
 * @param {boolean} value
 */
export const setIsRefreshing = (value) => {
  isRefreshing = value;
};

/**
 * Suscribir callback para cuando termine el refresh
 * @param {Function} callback - (error, newToken) => void
 */
export const subscribeToRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Notificar a todos los suscriptores el resultado del refresh
 * @param {Error|null} error
 * @param {string|null} newToken
 */
export const notifyRefreshSubscribers = (error, newToken) => {
  refreshSubscribers.forEach((callback) => callback(error, newToken));
  refreshSubscribers = [];
};

/**
 * Resetear todo el estado del token manager
 * Útil para logout completo
 */
export const resetTokenManager = () => {
  accessToken = null;
  isRefreshing = false;
  refreshSubscribers = [];
};
