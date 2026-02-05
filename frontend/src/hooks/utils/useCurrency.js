/**
 * ====================================================================
 * HOOK - useCurrency
 * ====================================================================
 *
 * Hook para obtener la moneda del usuario y funciones de formateo.
 * Fase 4 - Multi-Moneda (Dic 2025)
 *
 * JERARQUÍA DE MONEDA:
 * 1. Sucursal del usuario (si tiene override) - para sucursales en otros países
 * 2. Organización (fallback) - moneda base del negocio
 *
 * La moneda se determina en el backend (usuario.model.js buscarPorEmail)
 * y se envía como `user.moneda` en el login.
 */

import { useMemo } from 'react';
import { useAuthStore, selectUser } from '@/features/auth';
import {
  formatCurrencyDynamic,
  getCurrencyConfig,
  getCurrencySymbol,
  DEFAULT_CURRENCY
} from '@/utils/currency';

/**
 * Hook para manejo de moneda en componentes
 *
 * @returns {Object} Objeto con:
 *   - code: Código de moneda efectiva (sucursal override > organización)
 *   - config: Configuración completa de la moneda
 *   - symbol: Símbolo de la moneda ($, €, etc.)
 *   - locale: Locale para formateo (es-MX, es-CO, etc.)
 *   - format: Función para formatear montos
 *
 * @example
 * const { format, symbol, code } = useCurrency();
 * return <span>{format(1500)}</span>; // "$1,500.00" si MXN
 */
export function useCurrency() {
  const user = useAuthStore(selectUser);

  // Moneda viene del backend: COALESCE(sucursal.moneda, organizacion.moneda)
  const currencyCode = user?.moneda || DEFAULT_CURRENCY;

  // Memoizar la configuración para evitar recálculos
  const currencyData = useMemo(() => {
    const config = getCurrencyConfig(currencyCode);

    return {
      code: currencyCode,
      config,
      symbol: config.symbol,
      locale: config.locale,
      decimals: config.decimals,
      name: config.name,
      // Función de formateo que usa el código de moneda del usuario
      format: (amount) => formatCurrencyDynamic(amount, currencyCode)
    };
  }, [currencyCode]);

  return currencyData;
}

export default useCurrency;
