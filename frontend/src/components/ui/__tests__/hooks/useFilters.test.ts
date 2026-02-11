import { renderHook, act } from '@testing-library/react';
import { useFilters } from '../../hooks/useFilters';
import type { FilterPersistence } from '../../hooks/useFilters';

interface TestFilters {
  busqueda: string;
  categoria: string;
  activo: boolean;
}

const defaultFilters: TestFilters = {
  busqueda: '',
  categoria: '',
  activo: false,
};

describe('useFilters', () => {
  it('initializes with the provided initial state', () => {
    const { result } = renderHook(() => useFilters(defaultFilters));

    expect(result.current.filtros).toEqual(defaultFilters);
  });

  it('returns filtrosQuery matching initial filtros', () => {
    const { result } = renderHook(() => useFilters(defaultFilters));

    expect(result.current.filtrosQuery).toEqual(defaultFilters);
  });

  describe('setFiltro', () => {
    it('updates a single filter field', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltro('categoria', 'electronica');
      });

      expect(result.current.filtros.categoria).toBe('electronica');
      // Los demas campos no cambian
      expect(result.current.filtros.busqueda).toBe('');
      expect(result.current.filtros.activo).toBe(false);
    });

    it('updates boolean filter field', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltro('activo', true);
      });

      expect(result.current.filtros.activo).toBe(true);
    });
  });

  describe('setFiltros', () => {
    it('updates multiple filters at once with partial object', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltros({ categoria: 'ropa', activo: true });
      });

      expect(result.current.filtros.categoria).toBe('ropa');
      expect(result.current.filtros.activo).toBe(true);
      expect(result.current.filtros.busqueda).toBe('');
    });

    it('accepts a function updater', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltros((prev) => ({
          ...prev,
          busqueda: 'test',
          activo: true,
        }));
      });

      expect(result.current.filtros.busqueda).toBe('test');
      expect(result.current.filtros.activo).toBe(true);
    });
  });

  describe('limpiarFiltros', () => {
    it('resets all filters to initial state', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltro('categoria', 'electronica');
        result.current.setFiltro('activo', true);
        result.current.setFiltro('busqueda', 'laptop');
      });

      expect(result.current.filtros.categoria).toBe('electronica');

      act(() => {
        result.current.limpiarFiltros();
      });

      expect(result.current.filtros).toEqual(defaultFilters);
    });

    it('calls persistAdapter.clear when persist is provided', () => {
      const mockPersist: FilterPersistence = {
        load: vi.fn().mockReturnValue(null),
        save: vi.fn(),
        clear: vi.fn(),
      };

      const { result } = renderHook(() =>
        useFilters(defaultFilters, {
          moduloId: 'test-module',
          persist: mockPersist,
        })
      );

      act(() => {
        result.current.setFiltro('categoria', 'algo');
      });

      act(() => {
        result.current.limpiarFiltros();
      });

      expect(mockPersist.clear).toHaveBeenCalledWith('test-module');
    });
  });

  describe('filtrosActivos', () => {
    it('returns 0 when no filters differ from initial state', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      expect(result.current.filtrosActivos).toBe(0);
    });

    it('counts non-default, non-empty filter values', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltro('categoria', 'electronica');
      });

      expect(result.current.filtrosActivos).toBe(1);

      act(() => {
        result.current.setFiltro('activo', true);
      });

      expect(result.current.filtrosActivos).toBe(2);
    });

    it('does not count empty string values as active', () => {
      const initial = { nombre: 'default', busqueda: '' };
      const { result } = renderHook(() => useFilters(initial));

      act(() => {
        result.current.setFiltro('busqueda', '');
      });

      expect(result.current.filtrosActivos).toBe(0);
    });

    it('does not count null or undefined values as active', () => {
      const initial: Record<string, unknown> = { campo: null };
      const { result } = renderHook(() => useFilters(initial));

      act(() => {
        result.current.setFiltro('campo', undefined);
      });

      expect(result.current.filtrosActivos).toBe(0);
    });

    it('does not count false boolean as active', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltro('activo', false);
      });

      expect(result.current.filtrosActivos).toBe(0);
    });
  });

  describe('hasFiltrosActivos', () => {
    it('returns false when no active filters', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      expect(result.current.hasFiltrosActivos).toBe(false);
    });

    it('returns true when there are active filters', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltro('categoria', 'activa');
      });

      expect(result.current.hasFiltrosActivos).toBe(true);
    });
  });

  describe('filtrosActivosArray', () => {
    it('returns empty array when no active filters', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      expect(result.current.filtrosActivosArray).toEqual([]);
    });

    it('returns array of active filter key-value pairs', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltro('categoria', 'ropa');
        result.current.setFiltro('activo', true);
      });

      expect(result.current.filtrosActivosArray).toEqual(
        expect.arrayContaining([
          { key: 'categoria', value: 'ropa' },
          { key: 'activo', value: true },
        ])
      );
      expect(result.current.filtrosActivosArray).toHaveLength(2);
    });
  });

  describe('aplicarBusqueda', () => {
    it('applies saved filters merged with initial state', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltro('activo', true);
      });

      act(() => {
        result.current.aplicarBusqueda({
          filtros: { categoria: 'nuevaCategoria' },
        });
      });

      // aplicarBusqueda resets to initial + merges provided filtros
      expect(result.current.filtros.categoria).toBe('nuevaCategoria');
      expect(result.current.filtros.busqueda).toBe('');
      expect(result.current.filtros.activo).toBe(false);
    });

    it('does nothing when busqueda has no filtros', () => {
      const { result } = renderHook(() => useFilters(defaultFilters));

      act(() => {
        result.current.setFiltro('categoria', 'existente');
      });

      act(() => {
        result.current.aplicarBusqueda({});
      });

      // Filtros no cambian
      expect(result.current.filtros.categoria).toBe('existente');
    });
  });

  describe('persistence', () => {
    it('loads persisted filters on initialization', () => {
      const mockPersist: FilterPersistence = {
        load: vi.fn().mockReturnValue({ categoria: 'guardada' }),
        save: vi.fn(),
        clear: vi.fn(),
      };

      const { result } = renderHook(() =>
        useFilters(defaultFilters, {
          moduloId: 'productos',
          persist: mockPersist,
        })
      );

      expect(mockPersist.load).toHaveBeenCalledWith('productos');
      expect(result.current.filtros.categoria).toBe('guardada');
      // Campos no guardados mantienen su valor inicial
      expect(result.current.filtros.busqueda).toBe('');
    });

    it('does not use persistence when moduloId is not provided', () => {
      const mockPersist: FilterPersistence = {
        load: vi.fn(),
        save: vi.fn(),
        clear: vi.fn(),
      };

      renderHook(() =>
        useFilters(defaultFilters, {
          persist: mockPersist,
        })
      );

      expect(mockPersist.load).not.toHaveBeenCalled();
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces busqueda field updates to filtrosQuery', () => {
      const { result } = renderHook(() =>
        useFilters(defaultFilters, { debounceMs: 300 })
      );

      act(() => {
        result.current.setFiltro('busqueda', 'test');
      });

      // filtros se actualiza inmediatamente
      expect(result.current.filtros.busqueda).toBe('test');
      // filtrosQuery todavia no se actualiza (debounced)
      expect(result.current.filtrosQuery.busqueda).toBe('');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Despues del debounce, filtrosQuery se sincroniza
      expect(result.current.filtrosQuery.busqueda).toBe('test');
    });

    it('updates filtrosQuery immediately for non-debounced fields', () => {
      const { result } = renderHook(() =>
        useFilters(defaultFilters, { debounceMs: 300 })
      );

      act(() => {
        result.current.setFiltro('categoria', 'electronica');
      });

      // categoria no esta en debounceFields, se actualiza inmediato
      expect(result.current.filtrosQuery.categoria).toBe('electronica');
    });
  });
});
