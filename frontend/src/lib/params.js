/**
 * ====================================================================
 * UTILIDADES PARA SANITIZACIÓN DE PARÁMETROS
 * ====================================================================
 *
 * Funciones para sanitizar parámetros antes de enviar a la API.
 * Evita enviar valores vacíos que el backend (Joi) rechazaría.
 *
 * Ene 2026 - Optimización Frontend
 * ====================================================================
 */

/**
 * Sanitiza parámetros eliminando valores vacíos, null y undefined.
 * Backend Joi rechaza strings vacíos en muchos campos (ej: busqueda="" requiere min 2 chars).
 *
 * @param {Object} params - Objeto con parámetros a sanitizar
 * @returns {Object} - Objeto con solo los valores válidos
 *
 * @example
 * // Antes: { busqueda: '', categoria_id: null, activo: true }
 * // Después: { activo: true }
 *
 * const sanitized = sanitizeParams({ busqueda: '', categoria_id: null, activo: true });
 * // sanitized = { activo: true }
 */
export function sanitizeParams(params = {}) {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

/**
 * Sanitiza parámetros excluyendo también valores falsy específicos.
 * Útil para formularios donde 0 y false son valores válidos pero strings vacíos no.
 *
 * @param {Object} params - Objeto con parámetros a sanitizar
 * @param {Array<any>} excludeValues - Valores adicionales a excluir (default: [])
 * @returns {Object} - Objeto con solo los valores válidos
 *
 * @example
 * const sanitized = sanitizeParamsStrict({ page: 0, busqueda: '', limit: 20 }, ['']);
 * // sanitized = { page: 0, limit: 20 }
 */
export function sanitizeParamsStrict(params = {}, excludeValues = []) {
  const baseExclude = ['', null, undefined];
  const allExclude = [...baseExclude, ...excludeValues];

  return Object.entries(params).reduce((acc, [key, value]) => {
    if (!allExclude.includes(value)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export default sanitizeParams;
