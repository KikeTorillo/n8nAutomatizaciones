import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { createSearchHook } from '../createSearchHook';

// Mock dependencies
vi.mock('@/app/queryClient', () => ({
  STALE_TIMES: { DYNAMIC: 120000 },
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

describe('createSearchHook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('crea un hook de búsqueda funcional', async () => {
    const searchFn = vi.fn().mockResolvedValue({
      data: { data: [{ id: 1, nombre: 'Resultado' }] },
    });

    const useSearch = createSearchHook({ key: 'clientes', searchFn });
    const { result } = renderHook(() => useSearch('test'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(searchFn).toHaveBeenCalledWith({ q: 'test' });
    expect(result.current.data).toEqual([{ id: 1, nombre: 'Resultado' }]);
  });

  it('no busca con término menor a minLength', () => {
    const searchFn = vi.fn();
    const useSearch = createSearchHook({
      key: 'clientes',
      searchFn,
      minLength: 3,
    });

    const { result } = renderHook(() => useSearch('ab'), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(searchFn).not.toHaveBeenCalled();
  });

  it('usa searchParam personalizado', async () => {
    const searchFn = vi.fn().mockResolvedValue({ data: { data: [] } });
    const useSearch = createSearchHook({
      key: 'productos',
      searchFn,
      searchParam: 'buscar',
    });

    renderHook(() => useSearch('test'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() =>
      expect(searchFn).toHaveBeenCalledWith({ buscar: 'test' })
    );
  });

  it('extrae responseKey cuando se proporciona', async () => {
    const searchFn = vi.fn().mockResolvedValue({
      data: { data: { clientes: [{ id: 1 }] } },
    });

    const useSearch = createSearchHook({
      key: 'clientes',
      searchFn,
      responseKey: 'clientes',
    });
    const { result } = renderHook(() => useSearch('test'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('aplica transformResponse cuando se proporciona', async () => {
    const searchFn = vi.fn().mockResolvedValue({
      data: { data: [{ id: 1, nombre: 'raw' }] },
    });

    const useSearch = createSearchHook({
      key: 'clientes',
      searchFn,
      transformResponse: (data: Array<{ id: number; nombre: string }>) =>
        data.map((d) => ({ ...d, transformed: true })),
    });

    const { result } = renderHook(() => useSearch('test'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { id: 1, nombre: 'raw', transformed: true },
    ]);
  });

  it('respeta opción enabled', () => {
    const searchFn = vi.fn();
    const useSearch = createSearchHook({ key: 'clientes', searchFn });

    const { result } = renderHook(() => useSearch('test', { enabled: false }), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(searchFn).not.toHaveBeenCalled();
  });
});
