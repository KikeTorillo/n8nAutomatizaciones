import { renderHook, act } from '@testing-library/react';
import { usePagination, normalizePagination } from '../../hooks/usePagination';

// Mock window.scrollTo para evitar errores en jsdom
const scrollToMock = vi.fn();
Object.defineProperty(window, 'scrollTo', {
  value: scrollToMock,
  writable: true,
});

describe('usePagination', () => {
  beforeEach(() => {
    scrollToMock.mockClear();
  });

  describe('initial state', () => {
    it('defaults to page 1 and limit 20', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(20);
    });

    it('accepts custom initialPage and limit', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, limit: 10 })
      );

      expect(result.current.page).toBe(3);
      expect(result.current.limit).toBe(10);
    });
  });

  describe('handlePageChange', () => {
    it('updates the current page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(5);
      });

      expect(result.current.page).toBe(5);
    });

    it('scrolls to top by default', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(scrollToMock).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });

    it('does not scroll to top when scrollToTop is false', () => {
      const { result } = renderHook(() =>
        usePagination({ scrollToTop: false })
      );

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(scrollToMock).not.toHaveBeenCalled();
    });
  });

  describe('resetPage', () => {
    it('resets the page to 1', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(5);
      });
      expect(result.current.page).toBe(5);

      act(() => {
        result.current.resetPage();
      });
      expect(result.current.page).toBe(1);
    });
  });

  describe('goToPage', () => {
    it('navigates to the specified page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.goToPage(7);
      });

      expect(result.current.page).toBe(7);
    });

    it('does not scroll to top (unlike handlePageChange)', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.goToPage(3);
      });

      expect(scrollToMock).not.toHaveBeenCalled();
    });
  });

  describe('queryParams', () => {
    it('returns page and limit in queryParams format', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.queryParams).toEqual({
        page: 1,
        limit: 20,
      });
    });

    it('reflects updated page in queryParams', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(3);
      });

      expect(result.current.queryParams).toEqual({
        page: 3,
        limit: 20,
      });
    });

    it('reflects custom limit in queryParams', () => {
      const { result } = renderHook(() => usePagination({ limit: 50 }));

      expect(result.current.queryParams).toEqual({
        page: 1,
        limit: 50,
      });
    });
  });

  describe('setPage', () => {
    it('sets the page directly', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setPage(10);
      });

      expect(result.current.page).toBe(10);
    });
  });

  describe('resetOnChange', () => {
    it('resets page to 1 when dependency changes', () => {
      let dep = 'a';
      const { result, rerender } = renderHook(() =>
        usePagination({ resetOnChange: [dep] })
      );

      act(() => {
        result.current.handlePageChange(5);
      });
      expect(result.current.page).toBe(5);

      dep = 'b';
      rerender();

      expect(result.current.page).toBe(1);
    });

    it('does not reset on first render', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, resetOnChange: ['initial'] })
      );

      expect(result.current.page).toBe(3);
    });
  });
});

describe('normalizePagination', () => {
  it('returns defaults when input is null/undefined', () => {
    expect(normalizePagination(null)).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });

    expect(normalizePagination(undefined)).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('normalizes standard English format', () => {
    const result = normalizePagination({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
      hasNext: true,
      hasPrev: true,
    });

    expect(result).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('normalizes legacy Spanish format', () => {
    const result = normalizePagination({
      pagina: 3,
      limite: 15,
      total_elementos: 45,
      totalPaginas: 3,
      tiene_siguiente: false,
      tiene_anterior: true,
    });

    expect(result).toEqual({
      page: 3,
      limit: 15,
      total: 45,
      totalPages: 3,
      hasNext: false,
      hasPrev: true,
    });
  });

  it('normalizes ServicioModel format', () => {
    const result = normalizePagination({
      pagina_actual: 1,
      elementos_por_pagina: 25,
      total: 100,
      pages: 4,
    });

    expect(result).toEqual({
      page: 1,
      limit: 25,
      total: 100,
      totalPages: 4,
      hasNext: true, // page 1 < 4 totalPages
      hasPrev: false,
    });
  });

  it('calculates totalPages from total/limit when not provided', () => {
    const result = normalizePagination({
      page: 1,
      limit: 10,
      total: 35,
    });

    expect(result.totalPages).toBe(4); // Math.ceil(35 / 10)
  });

  it('calculates hasNext/hasPrev when not explicitly provided', () => {
    const result = normalizePagination({
      page: 2,
      limit: 10,
      total: 30,
    });

    expect(result.hasNext).toBe(true); // page 2 < 3 totalPages
    expect(result.hasPrev).toBe(true); // page 2 > 1
  });
});
