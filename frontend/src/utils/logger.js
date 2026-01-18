/**
 * Logger condicional para desarrollo
 * Solo imprime en consola cuando estamos en modo desarrollo
 *
 * @example
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('[Component] Debugging info', data);
 * logger.info('[Feature] Info message');
 * logger.warn('[Feature] Warning');
 * logger.error('[Feature] Error occurred', error);
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log de debug - solo en desarrollo
   */
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log de info - solo en desarrollo
   */
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Log de warning - siempre visible (problemas potenciales)
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Log de error - siempre visible (errores reales)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log genérico - solo en desarrollo
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log de grupo - solo en desarrollo
   */
  group: (label, fn) => {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },

  /**
   * Log de tabla - solo en desarrollo
   */
  table: (data, columns) => {
    if (isDev) {
      console.table(data, columns);
    }
  },
};

export default logger;
