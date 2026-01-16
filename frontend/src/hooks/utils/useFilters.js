import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getLastFilters, saveLastFilters, clearLastFilters } from '@/lib/filterStorage';

/**
 * Hook para gestionar estado de filtros con persistencia opcional y debounce
 *
 * @param {Object} initialState - Estado inicial de filtros
 * @param {Object} options - Opciones de configuración
 * @param {string} options.moduloId - ID del módulo para persistencia (ej: 'inventario.productos')
 * @param {boolean} options.persist - Si persistir en localStorage (default: true)
 * @param {number} options.debounceMs - Delay para debounce (default: 300ms)
 * @param {Array} options.debounceFields - Campos específicos a aplicar debounce (default: ['busqueda'])
 * @returns {Object} Estado y funciones de filtros
 */
export function useFilters(initialState, options = {}) {
  const {
    moduloId,
    persist = true,
    debounceMs = 300,
    debounceFields = ['busqueda'],
  } = options;

  // Referencia al estado inicial para comparaciones
  const initialStateRef = useRef(initialState);

  // Estado de filtros (inmediato)
  const [filtros, setFiltrosState] = useState(() => {
    // Intentar cargar filtros guardados si persist está habilitado
    if (persist && moduloId) {
      const saved = getLastFilters(moduloId);
      if (saved) {
        // Merge con initialState para asegurar que todos los campos existen
        return { ...initialState, ...saved };
      }
    }
    return initialState;
  });

  // Estado de filtros debounced (para queries)
  const [filtrosDebounced, setFiltrosDebounced] = useState(filtros);

  // Timer ref para debounce
  const debounceTimer = useRef(null);

  // Aplicar debounce solo a campos específicos
  useEffect(() => {
    // Verificar si hay cambios en campos con debounce
    const hasDebounceFieldChange = debounceFields.some(
      (field) => filtros[field] !== filtrosDebounced[field]
    );

    if (hasDebounceFieldChange) {
      // Limpiar timer anterior
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Establecer nuevo timer
      debounceTimer.current = setTimeout(() => {
        setFiltrosDebounced(filtros);
      }, debounceMs);
    } else {
      // Campos sin debounce se aplican inmediatamente
      setFiltrosDebounced(filtros);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filtros, debounceMs, debounceFields]);

  // Persistir filtros cuando cambian (debounced)
  useEffect(() => {
    if (persist && moduloId) {
      saveLastFilters(moduloId, filtrosDebounced);
    }
  }, [filtrosDebounced, persist, moduloId]);

  // Contador de filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    const initial = initialStateRef.current;

    Object.entries(filtros).forEach(([key, value]) => {
      // Ignorar si es igual al valor inicial
      if (value === initial[key]) return;

      // Ignorar valores vacíos
      if (value === '' || value === null || value === undefined) return;

      // Ignorar false (pero contar true)
      if (typeof value === 'boolean' && value === false) return;

      count++;
    });

    return count;
  }, [filtros]);

  // Verificar si hay filtros activos (diferentes al inicial)
  const hasFiltrosActivos = filtrosActivos > 0;

  // Cambiar un filtro específico
  const setFiltro = useCallback((key, value) => {
    setFiltrosState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Cambiar múltiples filtros a la vez
  const setFiltros = useCallback((newFiltros) => {
    if (typeof newFiltros === 'function') {
      setFiltrosState(newFiltros);
    } else {
      setFiltrosState((prev) => ({ ...prev, ...newFiltros }));
    }
  }, []);

  // Limpiar todos los filtros (volver al estado inicial)
  const limpiarFiltros = useCallback(() => {
    setFiltrosState(initialStateRef.current);
    if (persist && moduloId) {
      clearLastFilters(moduloId);
    }
  }, [persist, moduloId]);

  // Aplicar una búsqueda guardada
  const aplicarBusqueda = useCallback((busqueda) => {
    if (busqueda && busqueda.filtros) {
      // Merge con initialState para asegurar que todos los campos existen
      setFiltrosState({ ...initialStateRef.current, ...busqueda.filtros });
    }
  }, []);

  // Obtener filtros activos como array (para mostrar chips)
  const filtrosActivosArray = useMemo(() => {
    const result = [];
    const initial = initialStateRef.current;

    Object.entries(filtros).forEach(([key, value]) => {
      // Ignorar si es igual al valor inicial
      if (value === initial[key]) return;

      // Ignorar valores vacíos
      if (value === '' || value === null || value === undefined) return;

      // Ignorar false
      if (typeof value === 'boolean' && value === false) return;

      result.push({ key, value });
    });

    return result;
  }, [filtros]);

  return {
    // Estado
    filtros, // Estado actual (sin debounce)
    filtrosQuery: filtrosDebounced, // Para pasar a useQuery (con debounce)
    filtrosActivos, // Número de filtros activos
    filtrosActivosArray, // Array de filtros activos para chips
    hasFiltrosActivos, // Boolean si hay filtros activos

    // Acciones
    setFiltro, // Cambiar un filtro: setFiltro('campo', valor)
    setFiltros, // Cambiar múltiples: setFiltros({ campo1: valor1, campo2: valor2 })
    limpiarFiltros, // Resetear a initial
    aplicarBusqueda, // Aplicar búsqueda guardada
  };
}

export default useFilters;
