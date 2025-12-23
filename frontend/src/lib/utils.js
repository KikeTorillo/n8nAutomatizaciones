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
