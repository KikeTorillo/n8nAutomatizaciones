import { useState, useCallback, useEffect, useRef } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  limit?: number;
  scrollToTop?: boolean;
  resetOnChange?: unknown[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  handlePageChange: (newPage: number) => void;
  resetPage: () => void;
  goToPage: (newPage: number) => void;
  queryParams: { page: number; limit: number };
}

/**
 * usePagination - Hook para gestion centralizada de paginacion
 *
 * @example
 * const { page, handlePageChange, queryParams } = usePagination();
 * const { page, handlePageChange, queryParams } = usePagination({
 *   limit: 10,
 *   resetOnChange: [busqueda, filtros.categoria],
 * });
 */
export function usePagination({
  initialPage = 1,
  limit = 20,
  scrollToTop = true,
  resetOnChange = [],
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const isFirstRender = useRef(true);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      if (scrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [scrollToTop]
  );

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (resetOnChange.length > 0) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetOnChange);

  const queryParams = {
    page,
    limit,
  };

  return {
    page,
    limit,
    setPage,
    handlePageChange,
    resetPage,
    goToPage,
    queryParams,
  };
}

/**
 * Input del backend que puede venir en varios formatos
 */
interface BackendPagination {
  // Formato nuevo estandar
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  // Formato legacy espanol
  pagina?: number;
  limite?: number;
  total_elementos?: number;
  totalPaginas?: number;
  total_paginas?: number;
  tiene_siguiente?: boolean;
  tiene_anterior?: boolean;
  // Formato ServicioModel
  pagina_actual?: number;
  elementos_por_pagina?: number;
  pages?: number;
}

/**
 * Normaliza la paginacion del backend a formato estandar
 *
 * @example
 * const paginationProps = normalizePagination(data?.paginacion);
 * <Pagination pagination={paginationProps} onPageChange={handlePageChange} />
 */
export function normalizePagination(backendPagination?: BackendPagination | null): PaginationInfo {
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
