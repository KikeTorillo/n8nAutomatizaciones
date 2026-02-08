/**
 * ====================================================================
 * HOOKS: Acuerdos de Consigna
 * ====================================================================
 * Queries y mutations para acuerdos y productos de consignacion
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { consignaApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { CONSIGNA_KEYS } from './consignaKeys';

// ==================== QUERIES ====================

/**
 * Hook para listar acuerdos de consignacion
 * @param {Object} filtros - { proveedor_id?, estado?, busqueda?, limit?, offset? }
 */
export function useAcuerdosConsigna(filtros = {}) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.acuerdosList(filtros),
    queryFn: async () => {
      const response = await consignaApi.listarAcuerdos(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener acuerdo por ID
 * @param {number} id - ID del acuerdo
 */
export function useAcuerdoConsigna(id) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.acuerdoDetail(id),
    queryFn: async () => {
      const response = await consignaApi.obtenerAcuerdo(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para listar productos de un acuerdo
 * @param {number} acuerdoId - ID del acuerdo
 */
export function useProductosAcuerdo(acuerdoId) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.acuerdoProductos(acuerdoId),
    queryFn: async () => {
      const response = await consignaApi.listarProductos(acuerdoId);
      return response.data.data || [];
    },
    enabled: !!acuerdoId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ==================== MUTATIONS - ACUERDOS ====================

/**
 * Hook para crear acuerdo de consignacion
 */
export function useCrearAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data) => consignaApi.crearAcuerdo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos(), refetchType: 'active' });
      toast.success('Acuerdo de consignacion creado');
    },
    onError: createCRUDErrorHandler('create', 'Acuerdo'),
  });
}

/**
 * Hook para actualizar acuerdo
 */
export function useActualizarAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => consignaApi.actualizarAcuerdo(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos(), refetchType: 'active' });
      toast.success('Acuerdo actualizado');
    },
    onError: createCRUDErrorHandler('update', 'Acuerdo'),
  });
}

/**
 * Hook para activar acuerdo
 */
export function useActivarAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.activarAcuerdo(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos(), refetchType: 'active' });
      toast.success('Acuerdo activado');
    },
    onError: createCRUDErrorHandler('update', 'Acuerdo'),
  });
}

/**
 * Hook para pausar acuerdo
 */
export function usePausarAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.pausarAcuerdo(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos(), refetchType: 'active' });
      toast.success('Acuerdo pausado');
    },
    onError: createCRUDErrorHandler('update', 'Acuerdo'),
  });
}

/**
 * Hook para terminar acuerdo
 */
export function useTerminarAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.terminarAcuerdo(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos(), refetchType: 'active' });
      toast.success('Acuerdo terminado');
    },
    onError: createCRUDErrorHandler('update', 'Acuerdo'),
  });
}

// ==================== MUTATIONS - PRODUCTOS ====================

/**
 * Hook para agregar producto al acuerdo
 */
export function useAgregarProductoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, data }) => consignaApi.agregarProducto(acuerdoId, data),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoProductos(acuerdoId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(acuerdoId), refetchType: 'active' });
      toast.success('Producto agregado al acuerdo');
    },
    onError: createCRUDErrorHandler('create', 'Producto'),
  });
}

/**
 * Hook para actualizar producto del acuerdo
 */
export function useActualizarProductoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, productoId, data, varianteId }) =>
      consignaApi.actualizarProducto(acuerdoId, productoId, data, varianteId),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoProductos(acuerdoId), refetchType: 'active' });
      toast.success('Producto actualizado');
    },
    onError: createCRUDErrorHandler('update', 'Producto'),
  });
}

/**
 * Hook para remover producto del acuerdo
 */
export function useRemoverProductoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, productoId, varianteId }) =>
      consignaApi.removerProducto(acuerdoId, productoId, varianteId),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoProductos(acuerdoId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(acuerdoId), refetchType: 'active' });
      toast.success('Producto removido del acuerdo');
    },
    onError: createCRUDErrorHandler('delete', 'Producto'),
  });
}
