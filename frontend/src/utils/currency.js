/**
 * ====================================================================
 * CURRENCY UTILS - Multi-Moneda
 * ====================================================================
 *
 * Configuración y utilidades para formateo de monedas.
 * Fase 4 - Multi-Moneda (Dic 2025)
 */

/**
 * Configuración de monedas soportadas
 * Mapea código ISO a configuración de formateo
 */
export const CURRENCY_CONFIG = {
  MXN: {
    locale: 'es-MX',
    symbol: '$',
    decimals: 2,
    name: 'Peso Mexicano'
  },
  COP: {
    locale: 'es-CO',
    symbol: '$',
    decimals: 0,
    name: 'Peso Colombiano'
  },
  USD: {
    locale: 'en-US',
    symbol: '$',
    decimals: 2,
    name: 'Dólar Estadounidense'
  },
  ARS: {
    locale: 'es-AR',
    symbol: '$',
    decimals: 2,
    name: 'Peso Argentino'
  },
  CLP: {
    locale: 'es-CL',
    symbol: '$',
    decimals: 0,
    name: 'Peso Chileno'
  },
  PEN: {
    locale: 'es-PE',
    symbol: 'S/',
    decimals: 2,
    name: 'Sol Peruano'
  },
  EUR: {
    locale: 'es-ES',
    symbol: '€',
    decimals: 2,
    name: 'Euro'
  }
};

/**
 * Moneda por defecto del sistema
 */
export const DEFAULT_CURRENCY = 'MXN';

/**
 * Formatea un monto en la moneda especificada
 * Usa Intl.NumberFormat con el locale correcto para cada moneda
 *
 * @param {number} amount - Monto a formatear
 * @param {string} currencyCode - Código ISO de la moneda (MXN, COP, USD, etc.)
 * @returns {string} Monto formateado (ej: "$1,500.00")
 *
 * @example
 * formatCurrencyDynamic(1500, 'MXN') // "$1,500.00"
 * formatCurrencyDynamic(1500000, 'COP') // "$1.500.000"
 * formatCurrencyDynamic(100, 'USD') // "$100.00"
 */
export function formatCurrencyDynamic(amount, currencyCode = DEFAULT_CURRENCY) {
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG[DEFAULT_CURRENCY];

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(amount || 0);
  } catch (error) {
    // Fallback si el código de moneda no es válido
    console.warn(`[Currency] Código de moneda inválido: ${currencyCode}, usando ${DEFAULT_CURRENCY}`);
    return new Intl.NumberFormat(CURRENCY_CONFIG[DEFAULT_CURRENCY].locale, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }
}

/**
 * Obtiene la configuración de una moneda
 * @param {string} currencyCode - Código ISO de la moneda
 * @returns {Object} Configuración de la moneda
 */
export function getCurrencyConfig(currencyCode = DEFAULT_CURRENCY) {
  return CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
}

/**
 * Obtiene el símbolo de una moneda
 * @param {string} currencyCode - Código ISO de la moneda
 * @returns {string} Símbolo de la moneda
 */
export function getCurrencySymbol(currencyCode = DEFAULT_CURRENCY) {
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
  return config.symbol;
}

/**
 * Lista de monedas disponibles para selector
 * @returns {Array<{code: string, name: string, symbol: string}>}
 */
export function getAvailableCurrencies() {
  return Object.entries(CURRENCY_CONFIG).map(([code, config]) => ({
    code,
    name: config.name,
    symbol: config.symbol,
    locale: config.locale
  }));
}
