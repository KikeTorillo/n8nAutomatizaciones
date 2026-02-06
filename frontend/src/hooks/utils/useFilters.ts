import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getLastFilters, saveLastFilters, clearLastFilters } from '@/lib/filterStorage';

export interface UseFiltersOptions<T> {
  moduloId?: string;
  persist?: boolean;
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
 * const { filtros, filtrosQuery, setFiltro, limpiarFiltros } = useFilters(
 *   { busqueda: '', categoria: '', activo: true },
 *   { moduloId: 'inventario.productos' }
 * );
 */
export function useFilters<T extends Record<string, unknown>>(
  initialState: T,
  options: UseFiltersOptions<T> = {},
): UseFiltersReturn<T> {
  const {
    moduloId,
    persist = true,
    debounceMs = 300,
    debounceFields = ['busqueda'] as (keyof T & string)[],
  } = options;

  const initialStateRef = useRef(initialState);

  const [filtros, setFiltrosState] = useState<T>(() => {
    if (persist && moduloId) {
      const saved = getLastFilters(moduloId);
      if (saved) {
        return { ...initialState, ...saved };
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
    if (persist && moduloId) {
      saveLastFilters(moduloId, filtrosDebounced);
    }
  }, [filtrosDebounced, persist, moduloId]);

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

  const setFiltros = useCallback((newFiltros: Partial<T> | ((prev: T) => T)) => {
    if (typeof newFiltros === 'function') {
      setFiltrosState(newFiltros);
    } else {
      setFiltrosState((prev) => ({ ...prev, ...newFiltros }));
    }
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltrosState(initialStateRef.current);
    if (persist && moduloId) {
      clearLastFilters(moduloId);
    }
  }, [persist, moduloId]);

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
