import { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * FilterContext - Contexto para manejo de filtros
 * Elimina props drilling de 4-5 niveles en paneles de filtros
 *
 * @example
 * // En el componente padre:
 * <FilterProvider initialFilters={{ estado: '', busqueda: '' }} filterConfig={config}>
 *   <FilterPanel />
 *   <DataTable />
 * </FilterProvider>
 *
 * // En componentes hijos:
 * const { filtros, setFiltro, limpiarFiltros } = useFilterContext();
 */

const FilterContext = createContext(null);

/**
 * FilterProvider - Proveedor del contexto de filtros
 *
 * @param {React.ReactNode} children - Componentes hijos
 * @param {Object} initialFilters - Valores iniciales de filtros
 * @param {Array} filterConfig - Configuración de filtros disponibles
 * @param {string} searchKey - Key para el campo de búsqueda (default: 'busqueda')
 */
export function FilterProvider({
  children,
  initialFilters = {},
  filterConfig = [],
  searchKey = 'busqueda',
}) {
  const [filtros, setFiltros] = useState(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Actualiza un filtro individual
   */
  const setFiltro = useCallback((key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Limpia todos los filtros
   */
  const limpiarFiltros = useCallback(() => {
    const emptyFilters = {};
    filterConfig.forEach(config => {
      emptyFilters[config.key] = '';
    });
    emptyFilters[searchKey] = '';
    setFiltros(emptyFilters);
  }, [filterConfig, searchKey]);

  /**
   * Cuenta los filtros activos
   */
  const filtrosActivos = useMemo(() => {
    let count = 0;
    filterConfig.forEach(config => {
      const value = filtros[config.key];
      if (value !== undefined && value !== '' && value !== null && value !== false) {
        count++;
      }
    });
    if (filtros[searchKey]?.trim()) count++;
    return count;
  }, [filtros, filterConfig, searchKey]);

  /**
   * Verifica si hay filtros activos
   */
  const hayFiltrosActivos = filtrosActivos > 0;

  const value = useMemo(() => ({
    // Estado
    filtros,
    isExpanded,
    filtrosActivos,
    hayFiltrosActivos,
    filterConfig,
    searchKey,

    // Acciones
    setFiltro,
    setFiltros,
    limpiarFiltros,
    setIsExpanded,
    toggleExpanded: () => setIsExpanded(prev => !prev),
  }), [
    filtros,
    isExpanded,
    filtrosActivos,
    hayFiltrosActivos,
    filterConfig,
    searchKey,
    setFiltro,
    limpiarFiltros,
  ]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

/**
 * useFilterContext - Hook para acceder al contexto de filtros
 * @throws {Error} Si se usa fuera de FilterProvider
 */
export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext debe usarse dentro de FilterProvider');
  }
  return context;
}

/**
 * useOptionalFilterContext - Hook para acceder al contexto opcionalmente
 * Retorna null si no hay provider (útil para componentes reutilizables)
 */
export function useOptionalFilterContext() {
  return useContext(FilterContext);
}

export default FilterContext;
