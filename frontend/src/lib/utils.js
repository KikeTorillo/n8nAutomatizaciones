import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatCurrencyDynamic, DEFAULT_CURRENCY } from '@/utils/currency';

/**
 * Combina clases de Tailwind CSS evitando conflictos
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea números a moneda
 * @param {number} amount - Monto a formatear
 * @param {string} currency - Código de moneda (default: MXN)
 * @returns {string} Monto formateado
 *
 * NOTA: Para formateo dinámico basado en la moneda del usuario,
 * usar el hook useCurrency() en componentes React.
 */
export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  return formatCurrencyDynamic(amount, currency);
}

// Re-exportar para compatibilidad
export { formatCurrencyDynamic } from '@/utils/currency';

/**
 * Formatea fechas
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - Formato: 'short', 'long', 'time'
 * @returns {string} Fecha formateada
 */
export function formatDate(date, format = 'long') {
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    time: { hour: '2-digit', minute: '2-digit' },
  };

  // Usar locale de México por defecto (consistente con MXN)
  return new Intl.DateTimeFormat('es-MX', options[format] || options.long).format(
    new Date(date)
  );
}

/**
 * Formatear tamaño de archivo en formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Genera un ID único y seguro usando crypto.randomUUID()
 * Reemplaza Date.now() que puede generar colisiones en operaciones rápidas
 *
 * @returns {string} UUID v4 único
 *
 * @example
 * const item = { id: generateId(), nombre: 'Producto' };
 */
export function generateId() {
  // crypto.randomUUID() disponible en browsers modernos (Chrome 92+, Firefox 95+, Safari 15.4+)
  // Fallback para entornos sin soporte
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: generar UUID v4 manualmente
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
