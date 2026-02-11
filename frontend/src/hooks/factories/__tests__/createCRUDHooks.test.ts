import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  createCRUDHooks,
  createSanitizer,
  createInvalidator,
} from '../createCRUDHooks';

// Mock dependencies
vi.mock('@/app/queryClient', () => ({
  STALE_TIMES: { SEMI_STATIC: 300000, DYNAMIC: 120000 },
}));

vi.mock('@/lib/params', () => ({
  sanitizeParams: (params: Record<string, unknown>) => params,
}));

vi.mock('@/lib/sanitize', () => ({
  sanitizeFields: (
    data: Record<string, unknown>,
    _config: Record<string, string>
  ) => data,
}));

vi.mock('@/hooks/config/errorHandlerFactory', () => ({
  createCRUDErrorHandler: () => (error: Error) => {
    throw error;
  },
}));

// Test helpers
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// Mock API
function createMockApi() {
  return {
    listar: vi.fn().mockResolvedValue({
      data: { data: [{ id: 1, nombre: 'Test' }], pagination: { total: 1 } },
    }),
    obtener: vi.fn().mockResolvedValue({
      data: { data: { id: 1, nombre: 'Test' } },
    }),
    crear: vi.fn().mockResolvedValue({
      data: { data: { id: 2, nombre: 'New' } },
    }),
    actualizar: vi.fn().mockResolvedValue({
      data: { data: { id: 1, nombre: 'Updated' } },
    }),
    eliminar: vi.fn().mockResolvedValue({
      data: { data: { id: 1 } },
    }),
  };
}

describe('createCRUDHooks', () => {
  let queryClient: QueryClient;
  let mockApi: ReturnType<typeof createMockApi>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockApi = createMockApi();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const createHooks = (overrides = {}) =>
    createCRUDHooks({
      name: 'producto',
      namePlural: 'productos',
      api: mockApi,
      baseKey: 'productos',
      apiMethods: {
        list: 'listar',
        get: 'obtener',
        create: 'crear',
        update: 'actualizar',
        delete: 'eliminar',
      },
      ...overrides,
    });

  describe('useList', () => {
    it('devuelve datos de la lista', async () => {
      const hooks = createHooks();
      const { result } = renderHook(() => hooks.useList(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.listar).toHaveBeenCalledWith({});
      expect(result.current.data).toEqual([{ id: 1, nombre: 'Test' }]);
    });

    it('pasa parámetros a la API', async () => {
      const hooks = createHooks();
      renderHook(() => hooks.useList({ activo: true, page: 1 }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() =>
        expect(mockApi.listar).toHaveBeenCalledWith({ activo: true, page: 1 })
      );
    });

    it('soporta opción enabled', async () => {
      const hooks = createHooks();
      const { result } = renderHook(
        () => hooks.useList({}, { enabled: false }),
        {
          wrapper: createWrapper(queryClient),
        }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApi.listar).not.toHaveBeenCalled();
    });

    it('aplica transformList cuando se proporciona', async () => {
      const hooks = createHooks({
        transformList: (data: unknown[], pagination: { total: number }) => ({
          items: data,
          total: pagination?.total ?? 0,
        }),
      });

      const { result } = renderHook(() => hooks.useList(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({
        items: [{ id: 1, nombre: 'Test' }],
        total: 1,
      });
    });

    it('extrae responseKey cuando se proporciona', async () => {
      mockApi.listar.mockResolvedValue({
        data: {
          data: { productos: [{ id: 1 }], total: 1 },
          pagination: { total: 1 },
        },
      });

      const hooks = createHooks({ responseKey: 'productos' });
      const { result } = renderHook(() => hooks.useList(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({
        productos: [{ id: 1 }],
        total: 1,
        paginacion: { total: 1 },
      });
    });
  });

  describe('useDetail', () => {
    it('obtiene detalle por ID', async () => {
      const hooks = createHooks();
      const { result } = renderHook(() => hooks.useDetail(1), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.obtener).toHaveBeenCalledWith(1);
      expect(result.current.data).toEqual({ id: 1, nombre: 'Test' });
    });

    it('no ejecuta si id es null', () => {
      const hooks = createHooks();
      const { result } = renderHook(() => hooks.useDetail(null), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApi.obtener).not.toHaveBeenCalled();
    });

    it('aplica transformDetail cuando se proporciona', async () => {
      const hooks = createHooks({
        transformDetail: (data: { id: number; nombre: string }) => ({
          ...data,
          transformed: true,
        }),
      });

      const { result } = renderHook(() => hooks.useDetail(1), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({
        id: 1,
        nombre: 'Test',
        transformed: true,
      });
    });
  });

  describe('useCreate', () => {
    it('crea una entidad y devuelve datos', async () => {
      const hooks = createHooks();
      const { result } = renderHook(() => hooks.useCreate(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ nombre: 'New' } as never);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.crear).toHaveBeenCalled();
    });

    it('aplica sanitize antes de crear', async () => {
      const sanitize = vi.fn((data) => ({ ...data, sanitized: true }));
      const hooks = createHooks({ sanitize });

      const { result } = renderHook(() => hooks.useCreate(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ nombre: 'New' } as never);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(sanitize).toHaveBeenCalledWith({ nombre: 'New' });
    });
  });

  describe('useUpdate', () => {
    it('actualiza una entidad', async () => {
      const hooks = createHooks();
      const { result } = renderHook(() => hooks.useUpdate(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ id: 1, data: { nombre: 'Updated' } } as never);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.actualizar).toHaveBeenCalledWith(1, { nombre: 'Updated' });
    });
  });

  describe('useDelete', () => {
    it('elimina una entidad', async () => {
      const hooks = createHooks();
      const { result } = renderHook(() => hooks.useDelete(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate(1 as never);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.eliminar).toHaveBeenCalledWith(1);
    });
  });

  describe('useListActive', () => {
    it('pasa activo: true como parámetro', async () => {
      const hooks = createHooks();
      renderHook(() => hooks.useListActive(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() =>
        expect(mockApi.listar).toHaveBeenCalledWith({ activo: true })
      );
    });
  });

  describe('alias en español', () => {
    it('genera alias dinámicos', () => {
      const hooks = createHooks();
      expect(hooks.useProductos).toBeDefined();
      expect(hooks.useProducto).toBeDefined();
      expect(hooks.useCrearProducto).toBeDefined();
      expect(hooks.useActualizarProducto).toBeDefined();
      expect(hooks.useEliminarProducto).toBeDefined();
      expect(hooks.useProductosActivos).toBeDefined();
    });
  });
});

describe('createSanitizer', () => {
  it('crea un sanitizer con campos string', () => {
    const sanitize = createSanitizer(['nombre', 'descripcion']);
    const result = sanitize({
      nombre: 'test',
      descripcion: 'desc',
      extra: true,
    });
    expect(result).toBeDefined();
  });

  it('soporta campos con tipo específico', () => {
    const sanitize = createSanitizer([
      'nombre',
      { name: 'categoria_id', type: 'id' },
      { name: 'precio', type: 'number' },
    ]);
    const result = sanitize({ nombre: 'test', categoria_id: 1, precio: 99.99 });
    expect(result).toBeDefined();
  });
});

describe('createInvalidator', () => {
  it('combina base keys con additional keys', () => {
    const keys = createInvalidator(['productos'], ['categorias', 'inventario']);
    expect(keys).toEqual(['productos', 'categorias', 'inventario']);
  });

  it('funciona solo con base keys', () => {
    const keys = createInvalidator(['productos']);
    expect(keys).toEqual(['productos']);
  });
});
