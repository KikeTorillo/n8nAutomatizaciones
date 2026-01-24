/**
 * ====================================================================
 * HOOKS: CUPONES DE DESCUENTO
 * ====================================================================
 * Hooks CRUD para gestión de cupones usando factory + hooks adicionales.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories/createCRUDHooks';
import { useToast } from '@/hooks/utils/useToast';
import { QUERY_KEYS } from './constants';

// Sanitizador para cupones
const sanitizeCupon = createSanitizer([
  'codigo',
  'descripcion',
  { name: 'valor_descuento', type: 'number' },
  { name: 'max_usos', type: 'number' },
  { name: 'activo', type: 'boolean' },
]);

// Hooks CRUD base
const cuponesHooks = createCRUDHooks({
  name: 'cupon',
  namePlural: 'cupones',
  api: suscripcionesNegocioApi,
  baseKey: QUERY_KEYS.CUPONES,
  apiMethods: {
    list: 'listarCupones',
    get: 'obtenerCupon',
    create: 'crearCupon',
    update: 'actualizarCupon',
    delete: 'eliminarCupon',
  },
  sanitize: sanitizeCupon,
  staleTime: STALE_TIMES.SEMI_STATIC,
  responseKey: 'cupones',
  usePreviousData: true,
  transformList: (data, pagination) => ({
    items: data?.items || data?.cupones || [],
    total: data?.paginacion?.total || pagination?.total || 0,
    paginacion: data?.paginacion || pagination,
  }),
  errorMessages: {
    create: { 409: 'Ya existe un cupón con ese código' },
    delete: { 409: 'No se puede eliminar: el cupón tiene usos registrados' },
  },
});

// Re-exportar hooks base
export const useCupones = cuponesHooks.useList;
export const useCupon = cuponesHooks.useDetail;
export const useCrearCupon = cuponesHooks.useCreate;
export const useActualizarCupon = cuponesHooks.useUpdate;
export const useEliminarCupon = cuponesHooks.useDelete;

/**
 * Hook para listar cupones activos y vigentes (sin paginación)
 */
export function useCuponesActivos() {
  return useQuery({
    queryKey: [QUERY_KEYS.CUPONES, 'activos'],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.listarCuponesActivos();
      return response.data?.data?.cupones || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para buscar cupón por código
 * @param {string} codigo - Código del cupón
 */
export function useCuponPorCodigo(codigo) {
  return useQuery({
    queryKey: [QUERY_KEYS.CUPON, 'codigo', codigo],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.buscarCuponPorCodigo(codigo);
      return response.data?.data;
    },
    enabled: !!codigo && codigo.length >= 3,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para validar cupón
 * @returns {Object} Mutation con validación
 */
export function useValidarCupon() {
  return useMutation({
    mutationFn: async ({ codigo, plan_id }) => {
      const response = await suscripcionesNegocioApi.validarCupon({ codigo, plan_id });
      return response.data?.data;
    },
  });
}

/**
 * Hook para desactivar cupón
 * @returns {Object} Mutation
 */
export function useDesactivarCupon() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await suscripcionesNegocioApi.desactivarCupon(id);
      return response.data?.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CUPONES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CUPON, id] });
      success('Cupón desactivado');
    },
  });
}

export default {
  useCupones,
  useCupon,
  useCrearCupon,
  useActualizarCupon,
  useEliminarCupon,
  useCuponesActivos,
  useCuponPorCodigo,
  useValidarCupon,
  useDesactivarCupon,
};
