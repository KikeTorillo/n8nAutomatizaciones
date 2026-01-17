/**
 * Factory para manejadores de error en mutaciones
 *
 * Ene 2026: Centraliza el manejo de errores HTTP en mutaciones
 * para evitar duplicación de código.
 *
 * @example
 * const handleError = createErrorHandler({
 *   404: 'Producto no encontrado',
 *   409: 'Ya existe un producto con ese SKU'
 * }, 'Error al guardar producto');
 *
 * useMutation({
 *   mutationFn: api.create,
 *   onError: handleError
 * });
 */

/**
 * Crea un manejador de errores para mutaciones
 * @param {Object} errorMessages - Mapeo de códigos HTTP a mensajes
 * @param {string} defaultMessage - Mensaje por defecto si no hay match
 * @returns {Function} Handler de error para useMutation
 */
export function createErrorHandler(errorMessages = {}, defaultMessage = 'Error inesperado') {
  return (error) => {
    // Prioridad 1: Mensaje del backend
    const backendMessage = error.response?.data?.message;
    if (backendMessage) {
      throw new Error(backendMessage);
    }

    // Prioridad 2: Mensaje según código HTTP
    const statusCode = error.response?.status;
    if (errorMessages[statusCode]) {
      throw new Error(errorMessages[statusCode]);
    }

    // Fallback: Mensaje por defecto
    throw new Error(defaultMessage);
  };
}

/**
 * Mensajes de error comunes reutilizables
 * Combinar con combineErrorMessages() para uso modular
 */
export const COMMON_ERROR_MESSAGES = {
  NOT_FOUND: { 404: 'Recurso no encontrado' },
  FORBIDDEN: { 403: 'No tienes permisos para esta acción' },
  CONFLICT: { 409: 'Ya existe un registro con esos datos' },
  BAD_REQUEST: { 400: 'Datos inválidos' },
  SERVER_ERROR: { 500: 'Error del servidor' },
  UNAUTHORIZED: { 401: 'Sesión expirada, vuelve a iniciar sesión' },
};

/**
 * Combina múltiples grupos de mensajes de error
 * @param {...Object} groups - Grupos de mensajes a combinar
 * @returns {Object} Mensajes combinados
 *
 * @example
 * const errors = combineErrorMessages(
 *   COMMON_ERROR_MESSAGES.NOT_FOUND,
 *   COMMON_ERROR_MESSAGES.CONFLICT,
 *   { 422: 'Validación fallida' }
 * );
 */
export function combineErrorMessages(...groups) {
  return Object.assign({}, ...groups);
}

/**
 * Extrae el mensaje de error de una excepción
 * Útil para mostrar en toast o UI
 * @param {Error} error - Error capturado
 * @param {string} fallback - Mensaje fallback
 * @returns {string} Mensaje de error
 */
export function getErrorMessage(error, fallback = 'Ocurrió un error') {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  return fallback;
}
