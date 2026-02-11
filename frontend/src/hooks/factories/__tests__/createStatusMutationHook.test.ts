import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { createStatusMutationHook } from '../createStatusMutationHook';

// Mock dependencies
vi.mock('@/hooks/utils/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/hooks/config/errorHandlerFactory', () => ({
  createCRUDErrorHandler: () => (error: Error) => {
    throw error;
  },
}));

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

describe('createStatusMutationHook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('crea un hook de mutación funcional', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { success: true } });
    const useHook = createStatusMutationHook({
      mutationFn: mockFn,
      queryKey: 'citas',
    });

    const { result } = renderHook(() => useHook(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ id: 1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFn).toHaveBeenCalledWith({ id: 1 });
  });

  it('aplica sanitize a las variables', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { success: true } });
    const sanitize = vi.fn((v) => ({ ...v, sanitized: true }));
    const useHook = createStatusMutationHook({
      mutationFn: mockFn,
      queryKey: 'citas',
      sanitize,
    });

    const { result } = renderHook(() => useHook(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ id: 1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(sanitize).toHaveBeenCalledWith({ id: 1 });
    expect(mockFn).toHaveBeenCalledWith({ id: 1, sanitized: true });
  });

  it('invalida queries principales en éxito', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    const useHook = createStatusMutationHook({
      mutationFn: mockFn,
      queryKey: 'citas',
    });

    const { result } = renderHook(() => useHook(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ id: 1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['citas'] })
    );
  });

  it('invalida related keys en éxito', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    const useHook = createStatusMutationHook({
      mutationFn: mockFn,
      queryKey: 'citas',
      relatedKeys: ['agenda', 'calendario'],
    });

    const { result } = renderHook(() => useHook(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ id: 1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['agenda'] })
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['calendario'] })
    );
  });

  it('invalida query de detalle con getEntityId', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    const useHook = createStatusMutationHook({
      mutationFn: mockFn,
      queryKey: 'citas',
      getEntityId: (v: { id: number }) => v.id,
    });

    const { result } = renderHook(() => useHook(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ id: 42 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['citas', 42] })
    );
  });

  it('maneja errores de mutación', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Server error'));
    const useHook = createStatusMutationHook({
      mutationFn: mockFn,
      queryKey: 'citas',
      entityName: 'Cita',
    });

    const { result } = renderHook(() => useHook(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ id: 1 });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('usa valores por defecto correctos', () => {
    const mockFn = vi.fn().mockResolvedValue({ data: {} });
    const useHook = createStatusMutationHook({
      mutationFn: mockFn,
      queryKey: 'test',
    });

    expect(useHook).toBeTypeOf('function');
  });

  it('acepta tipos genéricos personalizados', async () => {
    interface CustomVars {
      id: number;
      motivo: string;
    }
    const mockFn = vi.fn().mockResolvedValue({ data: { ok: true } });

    const useHook = createStatusMutationHook<CustomVars>({
      mutationFn: mockFn,
      queryKey: 'citas',
    });

    const { result } = renderHook(() => useHook(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ id: 1, motivo: 'test' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFn).toHaveBeenCalledWith({ id: 1, motivo: 'test' });
  });
});
