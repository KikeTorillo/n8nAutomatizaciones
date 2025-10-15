/**
 * Utilidades de formateo adicionales
 *
 * NOTA: formatCurrency ya existe en @/lib/utils.js
 * Este archivo contiene formatters específicos para el módulo de servicios
 */

/**
 * Formatea duración en minutos a formato legible
 *
 * @param {number} minutes - Duración en minutos
 * @returns {string} Formato: "45 min" o "1h 30min"
 *
 * @example
 * formatDuration(45)   // "45 min"
 * formatDuration(90)   // "1h 30min"
 * formatDuration(120)  // "2h"
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0 min';

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

/**
 * Parsea el conteo de profesionales del backend
 * Backend retorna total_profesionales_asignados como string (resultado de COUNT SQL)
 *
 * @param {string|number} count - Conteo como string o number
 * @returns {number} Número parseado o 0 si es inválido
 *
 * @example
 * parseProfessionalsCount("3")  // 3
 * parseProfessionalsCount(3)    // 3
 * parseProfessionalsCount(null) // 0
 */
export const parseProfessionalsCount = (count) => {
  if (!count && count !== 0) return 0;
  const parsed = parseInt(count, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formatea precio a número
 * Backend retorna precio como string (resultado de NUMERIC SQL)
 *
 * @param {string|number} price - Precio como string o number
 * @returns {number} Precio parseado o 0 si es inválido
 *
 * @example
 * parsePrice("50000.00")  // 50000
 * parsePrice(50000)       // 50000
 * parsePrice(null)        // 0
 */
export const parsePrice = (price) => {
  if (!price && price !== 0) return 0;
  const parsed = parseFloat(price);
  return isNaN(parsed) ? 0 : parsed;
};
