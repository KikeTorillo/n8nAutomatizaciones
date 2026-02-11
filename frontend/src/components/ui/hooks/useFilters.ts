import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

export interface FilterPersistence {
  load: (key: string) => Record<string, unknown> | null;
  save: (key: string, filters: Record<string, unknown>) => void;
  clear: (key: string) => void;
}

export interface UseFiltersOptions<T> {
  moduloId?: string;
  persist?: boolean | FilterPersistence;
  debounceMs?: number;
  debounceFields?: (keyof T & string)[];
}

export interface UseFiltersReturn<T extends Record<string, unknown>> {
  filtros: T;
  filtrosQuery: T;
  filtrosActivos: number;
  filtrosActivosArray: Array<{ key: string; value: unknown }>;
  hasFiltrosActivos: boolean;
  setFiltro: <K extends keyof T>(key: K, value: T[K]) => void;
  setFiltros: (newFiltros: Partial<T> | ((prev: T) => T)) => void;
  limpiarFiltros: () => void;
  aplicarBusqueda: (busqueda: { filtros?: Partial<T> }) => void;
}

/**
 * Hook para gestionar estado de filtros con persistencia opcional y debounce
 *
 * @example
 * // Sin persistencia (default en UI library)
 * const { filtros, setFiltro } = useFilters({ busqueda: '', categoria: '' });
 *
 * // Con persistencia inyectada
 * const { filtros, setFiltro } = useFilters(
 *   { busqueda: '', categoria: '' },
 *   { moduloId: 'productos', persist: myPersistAdapter }
 * );
 */
export function useFilters<T extends Record<string, unknown>>(
  initialState: T,
  options: UseFiltersOptions<T> = {}
): UseFiltersReturn<T> {
  const {
    moduloId,
    persist = false,
    debounceMs = 300,
    debounceFields = ['busqueda'] as (keyof T & string)[],
  } = options;

  const initialStateRef = useRef(initialState);

  // Resolve persistence adapter
  const persistAdapter: FilterPersistence | null = useMemo(() => {
    if (!persist || !moduloId) return null;
    if (typeof persist === 'object') return persist;
    // persist === true: usar localStorage como default
    return {
      load: (key: string) => {
        try {
          const stored = localStorage.getItem('nexo_last_filters');
          if (!stored) return null;
          const all = JSON.parse(stored);
          return all[key] || null;
        } catch {
          return null;
        }
      },
      save: (key: string, filters: Record<string, unknown>) => {
        try {
          const stored = localStorage.getItem('nexo_last_filters');
          const all = stored ? JSON.parse(stored) : {};
          all[key] = filters;
          localStorage.setItem('nexo_last_filters', JSON.stringify(all));
        } catch {
          /* ignore */
        }
      },
      clear: (key: string) => {
        try {
          const stored = localStorage.getItem('nexo_last_filters');
          if (!stored) return;
          const all = JSON.parse(stored);
          delete all[key];
          localStorage.setItem('nexo_last_filters', JSON.stringify(all));
        } catch {
          /* ignore */
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filtros, setFiltrosState] = useState<T>(() => {
    if (persistAdapter && moduloId) {
      const saved = persistAdapter.load(moduloId);
      if (saved) {
        return { ...initialState, ...saved } as T;
      }
    }
    return initialState;
  });

  const [filtrosDebounced, setFiltrosDebounced] = useState<T>(filtros);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hasDebounceFieldChange = debounceFields.some(
      (field) => filtros[field] !== filtrosDebounced[field]
    );

    if (hasDebounceFieldChange) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        setFiltrosDebounced(filtros);
      }, debounceMs);
    } else {
      setFiltrosDebounced(filtros);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filtros, debounceMs, debounceFields]);

  useEffect(() => {
    if (persistAdapter && moduloId) {
      persistAdapter.save(moduloId, filtrosDebounced);
    }
  }, [filtrosDebounced, persistAdapter, moduloId]);

  const filtrosActivos = useMemo(() => {
    let count = 0;
    const initial = initialStateRef.current;

    Object.entries(filtros).forEach(([key, value]) => {
      if (value === initial[key]) return;
      if (value === '' || value === null || value === undefined) return;
      if (typeof value === 'boolean' && value === false) return;
      count++;
    });

    return count;
  }, [filtros]);

  const hasFiltrosActivos = filtrosActivos > 0;

  const setFiltro = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltrosState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFiltros = useCallback(
    (newFiltros: Partial<T> | ((prev: T) => T)) => {
      if (typeof newFiltros === 'function') {
        setFiltrosState(newFiltros);
      } else {
        setFiltrosState((prev) => ({ ...prev, ...newFiltros }));
      }
    },
    []
  );

  const limpiarFiltros = useCallback(() => {
    setFiltrosState(initialStateRef.current);
    if (persistAdapter && moduloId) {
      persistAdapter.clear(moduloId);
    }
  }, [persistAdapter, moduloId]);

  const aplicarBusqueda = useCallback((busqueda: { filtros?: Partial<T> }) => {
    if (busqueda && busqueda.filtros) {
      setFiltrosState({ ...initialStateRef.current, ...busqueda.filtros } as T);
    }
  }, []);

  const filtrosActivosArray = useMemo(() => {
    const result: Array<{ key: string; value: unknown }> = [];
    const initial = initialStateRef.current;

    Object.entries(filtros).forEach(([key, value]) => {
      if (value === initial[key]) return;
      if (value === '' || value === null || value === undefined) return;
      if (typeof value === 'boolean' && value === false) return;
      result.push({ key, value });
    });

    return result;
  }, [filtros]);

  return {
    filtros,
    filtrosQuery: filtrosDebounced,
    filtrosActivos,
    filtrosActivosArray,
    hasFiltrosActivos,
    setFiltro,
    setFiltros,
    limpiarFiltros,
    aplicarBusqueda,
  };
}

export default useFilters;
