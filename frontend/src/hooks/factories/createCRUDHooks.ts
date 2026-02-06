/**
 * ====================================================================
 * FACTORY PARA HOOKS CRUD
 * ====================================================================
 *
 * Genera hooks CRUD estandarizados para reducir duplicación de código.
 *
 * Ene 2026 - Refactorización Frontend
 * Feb 2026 - Migración TypeScript con generics
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { sanitizeParams } from '@/lib/params';
import { sanitizeFields } from '@/lib/sanitize';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiModule = Record<string, (...args: any[]) => Promise<any>>;

interface ApiMethods {
  list: string;
  get: string;
  create: string;
  update: string;
  delete: string;
}

interface ErrorMessages {
  create?: Record<number, string>;
  update?: Record<number, string>;
  delete?: Record<number, string>;
}

export interface CRUDHooksConfig<TEntity = unknown, TCreate = unknown, TUpdate = unknown> {
  name: string;
  namePlural: string;
  api: ApiModule;
  baseKey: string;
  apiMethods: ApiMethods;
  sanitize?: (data: TCreate | TUpdate) => TCreate | TUpdate;
  invalidateOnCreate?: string[];
  invalidateOnUpdate?: string[];
  invalidateOnDelete?: string[];
  errorMessages?: ErrorMessages;
  staleTime?: number;
  responseKey?: string;
  usePreviousData?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformList?: (data: any, pagination: any) => any;
  transformDetail?: (data: unknown) => TEntity;
}

export interface CRUDHooksReturn<TEntity = unknown, TCreate = unknown, TUpdate = unknown> {
  useList: (params?: Record<string, unknown>) => ReturnType<typeof useQuery>;
  useDetail: (id: string | number | null | undefined) => ReturnType<typeof useQuery>;
  useCreate: () => ReturnType<typeof useMutation>;
  useUpdate: () => ReturnType<typeof useMutation>;
  useDelete: () => ReturnType<typeof useMutation>;
  useListActive: (extraParams?: Record<string, unknown>) => ReturnType<typeof useQuery>;
  [key: string]: unknown;
}

export function createCRUDHooks<
  TEntity = unknown,
  TCreate = unknown,
  TUpdate = unknown,
>(config: CRUDHooksConfig<TEntity, TCreate, TUpdate>): CRUDHooksReturn<TEntity, TCreate, TUpdate> {
  const {
    name,
    namePlural,
    api,
    baseKey,
    apiMethods,
    sanitize = (data: TCreate | TUpdate) => data,
    invalidateOnCreate = [baseKey],
    invalidateOnUpdate = [baseKey],
    invalidateOnDelete = [baseKey],
    errorMessages = {},
    staleTime = STALE_TIMES.SEMI_STATIC,
    responseKey,
    usePreviousData = true,
    transformList,
    transformDetail,
  } = config;

  const entityName = name.charAt(0).toUpperCase() + name.slice(1);

  function useList(params: Record<string, unknown> = {}) {
    return useQuery({
      queryKey: [baseKey, params],
      queryFn: async () => {
        const response = await api[apiMethods.list](sanitizeParams(params));
        const data = response.data.data;
        const pagination = response.data.pagination || response.data.meta || data?.paginacion || data?.pagination;

        if (transformList) {
          return transformList(data, pagination);
        }

        if (responseKey) {
          return {
            [responseKey]: data[responseKey] || data,
            total: data.total || pagination?.total || (data[responseKey]?.length ?? 0),
            paginacion: pagination,
          };
        }

        return data;
      },
      staleTime,
      placeholderData: usePreviousData ? keepPreviousData : undefined,
    });
  }

  function useDetail(id: string | number | null | undefined) {
    return useQuery({
      queryKey: [name, id],
      queryFn: async () => {
        const response = await api[apiMethods.get](id);
        const data = response.data.data;
        return transformDetail ? transformDetail(data) : data;
      },
      enabled: !!id,
      staleTime,
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: TCreate) => {
        const sanitized = sanitize(data);
        const response = await api[apiMethods.create](sanitized);
        return response.data.data;
      },
      onSuccess: () => {
        invalidateOnCreate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
        });
      },
      onError: createCRUDErrorHandler('create', entityName, errorMessages.create || {}),
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }: { id: string | number; data: TUpdate }) => {
        const sanitized = sanitize(data);
        const response = await api[apiMethods.update](id, sanitized);
        return response.data.data;
      },
      onSuccess: (_: unknown, variables: { id: string | number; data: TUpdate }) => {
        invalidateOnUpdate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
        });
        queryClient.invalidateQueries({ queryKey: [name, variables.id], refetchType: 'active' });
      },
      onError: createCRUDErrorHandler('update', entityName, errorMessages.update || {}),
    });
  }

  function useDelete() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string | number) => {
        const response = await api[apiMethods.delete](id);
        return response?.data?.data ?? id;
      },
      onSuccess: () => {
        invalidateOnDelete.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
        });
      },
      onError: createCRUDErrorHandler('delete', entityName, errorMessages.delete || {}),
    });
  }

  function useListActive(extraParams: Record<string, unknown> = {}) {
    return useList({ activo: true, ...extraParams });
  }

  return {
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
    useListActive,
    [`use${namePlural.charAt(0).toUpperCase() + namePlural.slice(1)}`]: useList,
    [`use${entityName}`]: useDetail,
    [`useCrear${entityName}`]: useCreate,
    [`useActualizar${entityName}`]: useUpdate,
    [`useEliminar${entityName}`]: useDelete,
    [`use${namePlural.charAt(0).toUpperCase() + namePlural.slice(1)}Activos`]: useListActive,
  };
}

type SanitizerFieldType = 'string' | 'number' | 'boolean';

export function createSanitizer(fields: (string | { name: string; type: SanitizerFieldType })[]) {
  const config: Record<string, SanitizerFieldType> = {};

  fields.forEach((field) => {
    if (typeof field === 'string') {
      config[field] = 'string';
    } else if (typeof field === 'object') {
      config[field.name] = field.type;
    }
  });

  return <T extends Record<string, unknown>>(data: T) => sanitizeFields(data, config);
}

export function createInvalidator(baseKeys: string[], additionalKeys: string[] = []): string[] {
  return [...baseKeys, ...additionalKeys];
}

export default createCRUDHooks;
