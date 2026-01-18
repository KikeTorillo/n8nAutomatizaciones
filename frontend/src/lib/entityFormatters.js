/**
 * entityFormatters.js
 * Helpers centralizados para formateo de entidades.
 * Re-exporta desde entityStates.js + agrega helpers convenientes.
 */
import {
  getEstadoVariant,
  formatearEstado,
  getEstadoOptions,
  getEstadoColorClasses
} from '@/constants/entityStates';

// Re-exportar funciones existentes
export { getEstadoVariant, formatearEstado, getEstadoOptions, getEstadoColorClasses };

/**
 * Obtiene info completa de un estado (label + variant)
 * @param {string} entityType - Tipo de entidad (orden_compra, pago, conteo, etc.)
 * @param {string} estado - Estado actual
 * @returns {{ label: string, variant: string }}
 */
export const getEstadoInfo = (entityType, estado) => ({
  label: formatearEstado(entityType, estado),
  variant: getEstadoVariant(entityType, estado),
});

/**
 * Genera props para un Badge basado en estado
 * @param {string} entityType - Tipo de entidad
 * @param {string} estado - Estado actual
 * @returns {{ variant: string, children: string }}
 */
export const getEstadoBadgeProps = (entityType, estado) => ({
  variant: getEstadoVariant(entityType, estado),
  children: formatearEstado(entityType, estado),
});

/**
 * Formatea un valor monetario
 * @param {number} amount - Cantidad
 * @param {string} currency - Moneda (default: MXN)
 * @returns {string}
 */
export const formatMoney = (amount, currency = 'MXN') => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(amount || 0);
};

/**
 * Formatea una fecha para mostrar
 * @param {string|Date} date - Fecha
 * @param {string} format - 'short' | 'long' | 'time' | 'datetime'
 * @returns {string}
 */
export const formatDisplayDate = (date, format = 'short') => {
  if (!date) return '-';
  const d = new Date(date);

  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  };

  if (format === 'time') {
    return d.toLocaleTimeString('es-MX', options[format]);
  }

  return d.toLocaleDateString('es-MX', options[format]);
};

/**
 * Formatea un rango de fechas
 * @param {string|Date} startDate - Fecha inicio
 * @param {string|Date} endDate - Fecha fin (opcional)
 * @returns {string}
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate) return '-';
  const start = formatDisplayDate(startDate);
  if (!endDate) return start;
  return `${start} - ${formatDisplayDate(endDate)}`;
};

/**
 * Formatea un nombre completo
 * @param {Object} persona - Objeto con nombre y apellido(s)
 * @returns {string}
 */
export const formatFullName = (persona) => {
  if (!persona) return '-';
  const parts = [
    persona.nombre,
    persona.apellido_paterno || persona.apellido,
    persona.apellido_materno,
  ].filter(Boolean);
  return parts.join(' ') || '-';
};

/**
 * Trunca texto con ellipsis
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string}
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
