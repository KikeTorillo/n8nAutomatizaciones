import { useMemo } from 'react';
import { useAuthStore, selectUser } from '@/features/auth';
import {
  formatCurrencyDynamic,
  getCurrencyConfig,
  DEFAULT_CURRENCY
} from '@/utils/currency';

interface CurrencyData {
  code: string;
  config: ReturnType<typeof getCurrencyConfig>;
  symbol: string;
  locale: string;
  decimals: number;
  name: string;
  format: (amount: number) => string;
}

/**
 * Hook para manejo de moneda en componentes
 */
export function useCurrency(): CurrencyData {
  const user = useAuthStore(selectUser);

  const currencyCode = user?.moneda || DEFAULT_CURRENCY;

  const currencyData = useMemo((): CurrencyData => {
    const config = getCurrencyConfig(currencyCode);

    return {
      code: currencyCode,
      config,
      symbol: config.symbol,
      locale: config.locale,
      decimals: config.decimals,
      name: config.name,
      format: (amount: number) => formatCurrencyDynamic(amount, currencyCode)
    };
  }, [currencyCode]);

  return currencyData;
}

export default useCurrency;
