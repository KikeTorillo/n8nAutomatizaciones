import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatCurrencyDynamic, DEFAULT_CURRENCY } from '@/utils/currency';

/**
 * Combina clases de Tailwind CSS evitando conflictos
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatea números a moneda
 * @param amount - Monto a formatear
 * @param currency - Código de moneda (default: MXN)
 * @returns Monto formateado
 *
 * NOTA: Para formateo dinámico basado en la moneda del usuario,
 * usar el hook useCurrency() en componentes React.
 */
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return formatCurrencyDynamic(amount, currency);
}

// Re-exportar para compatibilidad
export { formatCurrencyDynamic } from '@/utils/currency';

type DateFormat = 'short' | 'long' | 'time';

/**
 * Formatea fechas
 * @param date - Fecha a formatear
 * @param format - Formato: 'short', 'long', 'time'
 * @returns Fecha formateada
 */
export function formatDate(date: Date | string, format: DateFormat = 'long'): string {
  const options: Record<DateFormat, Intl.DateTimeFormatOptions> = {
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
 * @param bytes - Tamaño en bytes
 * @returns Tamaño formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
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
 * @returns UUID v4 único
 *
 * @example
 * const item = { id: generateId(), nombre: 'Producto' };
 */
export function generateId(): string {
  // crypto.randomUUID() disponible en browsers modernos (Chrome 92+, Firefox 95+, Safari 15.4+)
  // Fallback para entornos sin soporte
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: generar UUID v4 manualmente
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
