import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * usePagination - Hook para gestión centralizada de paginación
 *
 * Elimina código duplicado de paginación en páginas CRUD (~15 líneas por página)
 *
 * @param {Object} options - Opciones de configuración
 * @param {number} [options.initialPage=1] - Página inicial
 * @param {number} [options.limit=20] - Items por página
 * @param {boolean} [options.scrollToTop=true] - Scroll al cambiar página
 * @param {Array} [options.resetOnChange] - Dependencias que resetean la página a 1
 *
 * @returns {Object} Utilidades de paginación
 *
 * @example
 * // Uso básico
 * const { page, handlePageChange, queryParams } = usePagination();
 *
 * // Con reset automático al cambiar filtros
 * const { page, handlePageChange, queryParams } = usePagination({
 *   limit: 10,
 *   resetOnChange: [busqueda, filtros.categoria],
 * });
 *
 * // En el query
 * const { data } = useProductos({ ...queryParams, busqueda });
 *
 * // En el componente Pagination
 * <Pagination
 *   pagination={data?.paginacion}
 *   onPageChange={handlePageChange}
 * />
 */
export function usePagination({
  initialPage = 1,
  limit = 20,
  scrollToTop = true,
  resetOnChange = [],
} = {}) {
  const [page, setPage] = useState(initialPage);
  const isFirstRender = useRef(true);

  /**
   * Cambiar de página con scroll opcional
   */
  const handlePageChange = useCallback(
    (newPage) => {
      setPage(newPage);
      if (scrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [scrollToTop]
  );

  /**
   * Resetear a página 1
   */
  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  /**
   * Ir a una página específica (sin scroll)
   */
  const goToPage = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  /**
   * Resetear página cuando cambian las dependencias
   * (búsqueda, filtros, etc.)
   */
  useEffect(() => {
    // Ignorar el primer render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Solo resetear si hay dependencias definidas
    if (resetOnChange.length > 0) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetOnChange);

  /**
   * Parámetros para pasar al query hook
   * Formato estándar: { page, limit }
   */
  const queryParams = {
    page,
    limit,
  };

  return {
    // Estado
    page,
    limit,

    // Setters
    setPage,

    // Handlers
    handlePageChange,
    resetPage,
    goToPage,

    // Query params (para pasar directamente al hook de datos)
    queryParams,
  };
}

/**
 * Crear objeto de paginación para el componente Pagination
 * cuando el backend devuelve formato diferente
 *
 * @param {Object} backendPagination - Paginación del backend
 * @returns {Object} Formato para componente Pagination
 *
 * @example
 * const paginationProps = normalizePagination(data?.paginacion);
 * <Pagination pagination={paginationProps} onPageChange={handlePageChange} />
 */
export function normalizePagination(backendPagination) {
  if (!backendPagination) {
    return {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
  }

  // Soportar múltiples formatos de paginación:
  // - page/limit (nuevo estándar)
  // - pagina/limite (legacy)
  // - pagina_actual/elementos_por_pagina (ServicioModel, etc.)
  const page = backendPagination.page ?? backendPagination.pagina ?? backendPagination.pagina_actual ?? 1;
  const limit = backendPagination.limit ?? backendPagination.limite ?? backendPagination.elementos_por_pagina ?? 20;
  const total = backendPagination.total ?? backendPagination.total_elementos ?? 0;
  const totalPages = backendPagination.totalPages ?? backendPagination.pages ?? backendPagination.totalPaginas ?? backendPagination.total_paginas ?? Math.ceil(total / limit);
  const hasNext = backendPagination.hasNext ?? backendPagination.tiene_siguiente ?? page < totalPages;
  const hasPrev = backendPagination.hasPrev ?? backendPagination.tiene_anterior ?? page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
}

export default usePagination;
