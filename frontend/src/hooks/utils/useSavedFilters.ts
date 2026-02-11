import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getSavedSearches,
  addSavedSearch,
  removeSavedSearch,
  setSearchAsDefault,
} from '@/lib/filterStorage';

export interface SavedSearch {
  id: string;
  nombre: string;
  filtros: Record<string, unknown>;
  es_default: boolean;
  [key: string]: unknown;
}

interface SavedFiltersReturn {
  busquedas: SavedSearch[];
  busquedaDefault: SavedSearch | null;
  isLoading: boolean;
  guardarBusqueda: (nombre: string, filtros: Record<string, unknown>, esDefault?: boolean) => SavedSearch | null;
  eliminarBusqueda: (searchId: string) => void;
  toggleDefault: (searchId: string) => void;
  renombrarBusqueda: (searchId: string, nuevoNombre: string) => void;
  existeNombre: (nombre: string) => boolean;
}

/**
 * Hook para CRUD de búsquedas guardadas
 */
export function useSavedFilters(moduloId: string): SavedFiltersReturn {
  const [busquedas, setBusquedas] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!moduloId) {
      setBusquedas([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const saved = getSavedSearches(moduloId);
      setBusquedas(saved);
    } catch (error) {
      console.error('Error loading saved searches:', error);
      setBusquedas([]);
    } finally {
      setIsLoading(false);
    }
  }, [moduloId]);

  const guardarBusqueda = useCallback(
    (nombre: string, filtros: Record<string, unknown>, esDefault = false): SavedSearch | null => {
      if (!moduloId || !nombre || !filtros) {
        console.warn('guardarBusqueda: moduloId, nombre y filtros son requeridos');
        return null;
      }

      try {
        const updated = addSavedSearch(moduloId, {
          nombre,
          filtros,
          es_default: esDefault,
        });
        setBusquedas(updated);
        return updated[updated.length - 1];
      } catch (error) {
        console.error('Error saving search:', error);
        return null;
      }
    },
    [moduloId]
  );

  const eliminarBusqueda = useCallback(
    (searchId: string) => {
      if (!moduloId || !searchId) return;

      try {
        const updated = removeSavedSearch(moduloId, searchId);
        setBusquedas(updated);
      } catch (error) {
        console.error('Error removing search:', error);
      }
    },
    [moduloId]
  );

  const toggleDefault = useCallback(
    (searchId: string) => {
      if (!moduloId || !searchId) return;

      try {
        const current = busquedas.find((b) => b.id === searchId);
        if (current?.es_default) {
          const updated = busquedas.map((b) => ({ ...b, es_default: false }));
          setBusquedas(updated);
          localStorage.setItem(
            'nexo_saved_searches',
            JSON.stringify({
              ...JSON.parse(localStorage.getItem('nexo_saved_searches') || '{}'),
              [moduloId]: updated,
            })
          );
        } else {
          const updated = setSearchAsDefault(moduloId, searchId);
          setBusquedas(updated);
        }
      } catch (error) {
        console.error('Error toggling default:', error);
      }
    },
    [moduloId, busquedas]
  );

  const busquedaDefault = useMemo(() => {
    return busquedas.find((b) => b.es_default) || null;
  }, [busquedas]);

  const existeNombre = useCallback(
    (nombre: string): boolean => {
      return busquedas.some(
        (b) => b.nombre.toLowerCase() === nombre.toLowerCase()
      );
    },
    [busquedas]
  );

  const renombrarBusqueda = useCallback(
    (searchId: string, nuevoNombre: string) => {
      if (!moduloId || !searchId || !nuevoNombre) return;

      try {
        const updated = busquedas.map((b) =>
          b.id === searchId ? { ...b, nombre: nuevoNombre } : b
        );
        setBusquedas(updated);

        const stored = localStorage.getItem('nexo_saved_searches');
        const all = stored ? JSON.parse(stored) : {};
        all[moduloId] = updated;
        localStorage.setItem('nexo_saved_searches', JSON.stringify(all));
      } catch (error) {
        console.error('Error renaming search:', error);
      }
    },
    [moduloId, busquedas]
  );

  return {
    busquedas,
    busquedaDefault,
    isLoading,
    guardarBusqueda,
    eliminarBusqueda,
    toggleDefault,
    renombrarBusqueda,
    existeNombre,
  };
}

export default useSavedFilters;
