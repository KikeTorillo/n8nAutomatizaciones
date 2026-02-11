import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getSavedSearches,
  addSavedSearch,
  removeSavedSearch,
  setSearchAsDefault,
} from '@/lib/filterStorage';

/**
 * Hook para CRUD de búsquedas guardadas
 * Gestiona la persistencia en localStorage con estructura compatible para BD futura
 *
 * @param {string} moduloId - Identificador del módulo (ej: 'inventario.productos')
 * @returns {Object} Estado y funciones para gestionar búsquedas guardadas
 */
export function useSavedFilters(moduloId) {
  const [busquedas, setBusquedas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar búsquedas al montar o cuando cambia el módulo
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

  // Guardar nueva búsqueda
  const guardarBusqueda = useCallback(
    (nombre, filtros, esDefault = false) => {
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
        return updated[updated.length - 1]; // Retornar la búsqueda creada
      } catch (error) {
        console.error('Error saving search:', error);
        return null;
      }
    },
    [moduloId]
  );

  // Eliminar búsqueda
  const eliminarBusqueda = useCallback(
    (searchId) => {
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

  // Marcar/desmarcar como default
  const toggleDefault = useCallback(
    (searchId) => {
      if (!moduloId || !searchId) return;

      try {
        // Si ya es default, quitarlo
        const current = busquedas.find((b) => b.id === searchId);
        if (current?.es_default) {
          // Quitar default (pasar null como searchId para quitar a todos)
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

  // Obtener búsqueda default (si existe)
  const busquedaDefault = useMemo(() => {
    return busquedas.find((b) => b.es_default) || null;
  }, [busquedas]);

  // Verificar si existe una búsqueda con el mismo nombre
  const existeNombre = useCallback(
    (nombre) => {
      return busquedas.some(
        (b) => b.nombre.toLowerCase() === nombre.toLowerCase()
      );
    },
    [busquedas]
  );

  // Renombrar búsqueda
  const renombrarBusqueda = useCallback(
    (searchId, nuevoNombre) => {
      if (!moduloId || !searchId || !nuevoNombre) return;

      try {
        const updated = busquedas.map((b) =>
          b.id === searchId ? { ...b, nombre: nuevoNombre } : b
        );
        setBusquedas(updated);

        // Actualizar en localStorage
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
    // Estado
    busquedas, // Array de búsquedas guardadas
    busquedaDefault, // Búsqueda marcada como default (o null)
    isLoading, // Si está cargando

    // Acciones
    guardarBusqueda, // (nombre, filtros, esDefault?) => búsqueda creada
    eliminarBusqueda, // (searchId) => void
    toggleDefault, // (searchId) => void
    renombrarBusqueda, // (searchId, nuevoNombre) => void

    // Utilidades
    existeNombre, // (nombre) => boolean
  };
}

export default useSavedFilters;
