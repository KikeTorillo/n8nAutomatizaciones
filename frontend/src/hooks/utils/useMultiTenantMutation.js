/**
 * Hook wrapper para mutaciones que requieren sucursal_id
 *
 * Ene 2026: Centraliza la inyección de sucursal_id en mutaciones
 * para evitar errores 400 por falta de contexto de sucursal.
 *
 * El middleware de permisos del backend requiere sucursal_id en el body
 * para endpoints protegidos con verificarPermiso.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSucursalStore, { selectSucursalActiva } from '@/store/sucursalStore';
import { useCallback } from 'react';

/**
 * Hook que envuelve useMutation para inyectar sucursal_id automáticamente
 *
 * @param {Object} options - Opciones de useMutation
 * @param {Function} options.mutationFn - Función de mutación (recibe data con sucursal_id)
 * @param {Array<string>} options.invalidateKeys - Keys de query a invalidar on success
 * @param {Object} options.rest - Otras opciones de useMutation (onSuccess, onError, etc.)
 * @returns {Object} Mutation object con mutate modificado
 *
 * @example
 * const crearProducto = useMultiTenantMutation({
 *   mutationFn: (data) => productosApi.crear(data),
 *   invalidateKeys: ['productos'],
 * });
 *
 * // La mutación inyecta sucursal_id automáticamente
 * crearProducto.mutate({ nombre: 'Producto', precio: 100 });
 * // Se envía: { nombre: 'Producto', precio: 100, sucursal_id: 1 }
 */
export function useMultiTenantMutation({
  mutationFn,
  invalidateKeys = [],
  ...rest
}) {
  const queryClient = useQueryClient();
  const sucursalActiva = useSucursalStore(selectSucursalActiva);

  // Wrapper que inyecta sucursal_id
  const wrappedMutationFn = useCallback(async (data) => {
    const dataConSucursal = {
      ...data,
      sucursal_id: data.sucursal_id || sucursalActiva?.id,
    };
    return mutationFn(dataConSucursal);
  }, [mutationFn, sucursalActiva?.id]);

  const mutation = useMutation({
    mutationFn: wrappedMutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidar queries especificadas
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
      });

      // Ejecutar onSuccess original si existe
      rest.onSuccess?.(data, variables, context);
    },
    ...rest,
  });

  return mutation;
}

/**
 * Hook que crea un mutationFn que inyecta sucursal_id
 * Para usar con useMutation directamente
 *
 * @param {Function} originalFn - Función de API original
 * @returns {Function} Función wrapeada que inyecta sucursal_id
 *
 * @example
 * const mutationFn = useWithSucursalId((data) => api.crear(data));
 * const { mutate } = useMutation({ mutationFn });
 */
export function useWithSucursalId(originalFn) {
  const sucursalActiva = useSucursalStore(selectSucursalActiva);

  return useCallback(async (data) => {
    const dataConSucursal = {
      ...data,
      sucursal_id: data.sucursal_id || sucursalActiva?.id,
    };
    return originalFn(dataConSucursal);
  }, [originalFn, sucursalActiva?.id]);
}

/**
 * Getter para obtener sucursal_id actual (para usar fuera de hooks)
 * NOTA: Preferir usar el hook cuando sea posible
 *
 * @returns {number|null} ID de la sucursal activa
 */
export function getSucursalIdActiva() {
  return useSucursalStore.getState().sucursalActiva?.id || null;
}

export default useMultiTenantMutation;
