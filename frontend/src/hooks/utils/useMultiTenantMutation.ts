import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import useSucursalStore, { selectSucursalActiva } from '@/store/sucursalStore';
import { useCallback } from 'react';

interface MultiTenantMutationOptions<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>> {
  mutationFn: (data: TVariables & { sucursal_id?: number }) => Promise<TData>;
  invalidateKeys?: string[];
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => void;
  onError?: (error: Error, variables: TVariables, context: unknown) => void;
  [key: string]: unknown;
}

/**
 * Hook que envuelve useMutation para inyectar sucursal_id automáticamente
 */
export function useMultiTenantMutation<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>({
  mutationFn,
  invalidateKeys = [],
  ...rest
}: MultiTenantMutationOptions<TData, TVariables>): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();
  const sucursalActiva = useSucursalStore(selectSucursalActiva);

  const wrappedMutationFn = useCallback(async (data: TVariables) => {
    const dataConSucursal = {
      ...data,
      sucursal_id: (data as Record<string, unknown>).sucursal_id || sucursalActiva?.id,
    };
    return mutationFn(dataConSucursal as TVariables & { sucursal_id?: number });
  }, [mutationFn, sucursalActiva?.id]);

  const mutation = useMutation<TData, Error, TVariables>({
    mutationFn: wrappedMutationFn,
    onSuccess: (data: TData, variables: TVariables, context: unknown) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
      });
      (rest as MultiTenantMutationOptions<TData, TVariables>).onSuccess?.(data, variables, context);
    },
    ...rest,
  } as Parameters<typeof useMutation<TData, Error, TVariables>>[0]);

  return mutation;
}

/**
 * Hook que crea un mutationFn que inyecta sucursal_id
 */
export function useWithSucursalId<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  originalFn: (data: TVariables) => Promise<TData>
): (data: TVariables) => Promise<TData> {
  const sucursalActiva = useSucursalStore(selectSucursalActiva);

  return useCallback(async (data: TVariables) => {
    const dataConSucursal = {
      ...data,
      sucursal_id: (data as Record<string, unknown>).sucursal_id || sucursalActiva?.id,
    };
    return originalFn(dataConSucursal as TVariables);
  }, [originalFn, sucursalActiva?.id]);
}

/**
 * Getter para obtener sucursal_id actual (para usar fuera de hooks)
 */
export function getSucursalIdActiva(): number | null {
  return useSucursalStore.getState().sucursalActiva?.id || null;
}

export default useMultiTenantMutation;
