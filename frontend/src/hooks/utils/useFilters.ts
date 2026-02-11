/**
 * Re-export de useFilters desde ui/hooks con persistencia por defecto.
 *
 * Este wrapper mantiene retrocompatibilidad: `persist` default es `true`
 * (en ui/hooks/ es `false`), y provee filterStorage como adapter.
 */
import {
  useFilters as useFiltersBase,
  type UseFiltersOptions as UIFiltersOptions,
  type UseFiltersReturn,
  type FilterPersistence,
} from '@nexo2/ui/hooks';
import {
  getLastFilters,
  saveLastFilters,
  clearLastFilters,
} from '@/lib/filterStorage';

export type { UseFiltersReturn, FilterPersistence };

export interface UseFiltersOptions<T> {
  moduloId?: string;
  persist?: boolean;
  debounceMs?: number;
  debounceFields?: (keyof T & string)[];
}

const filterStorageAdapter: FilterPersistence = {
  load: getLastFilters,
  save: saveLastFilters,
  clear: clearLastFilters,
};

export function useFilters<T extends Record<string, unknown>>(
  initialState: T,
  options: UseFiltersOptions<T> = {}
): UseFiltersReturn<T> {
  const { persist = true, ...rest } = options;
  const uiOptions: UIFiltersOptions<T> = {
    ...rest,
    persist: persist ? filterStorageAdapter : false,
  };
  return useFiltersBase(initialState, uiOptions);
}

export default useFilters;
