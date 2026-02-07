/**
 * ====================================================================
 * HOOKS SUCURSALES
 * ====================================================================
 *
 * Migrado parcialmente a factory - Ene 2026
 * - CRUD sucursales básico: via createCRUDHooks
 * - Queries especiales, relaciones, métricas: manuales
 * - CRUD transferencias: manual
 *
 * Reducción: 375 → ~250 LOC
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { sucursalesApi } from '@/services/api/endpoints';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== CRUD SUCURSALES (via factory) ====================

const sanitizeSucursal = createSanitizer([
  'nombre',
  'codigo',
  'direccion',
  'codigo_postal',
  'telefono',
  'email',
  'whatsapp',
  { name: 'pais_id', type: 'id' },
  { name: 'estado_id', type: 'id' },
  { name: 'ciudad_id', type: 'id' },
]);

const hooks = createCRUDHooks({
  name: 'sucursal',
  namePlural: 'sucursales',
  api: sucursalesApi,
  baseKey: 'sucursales',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  sanitize: sanitizeSucursal,
  invalidateOnCreate: [queryKeys.sistema.sucursales.all[0], 'sucursal-matriz'],
  invalidateOnUpdate: [queryKeys.sistema.sucursales.all[0]],
  invalidateOnDelete: [queryKeys.sistema.sucursales.all[0]],
  errorMessages: {
    delete: { 400: 'No se puede eliminar la sucursal matriz' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true, // Evita flash de loading durante paginación
});

export const useSucursales = hooks.useList;
export const useSucursal = hooks.useDetail;
export const useCrearSucursal = hooks.useCreate;
export const useActualizarSucursal = hooks.useUpdate;
export const useEliminarSucursal = hooks.useDelete;

// ==================== QUERIES ESPECIALES ====================

/**
 * Hook para obtener sucursal matriz de la organización
 */
export function useSucursalMatriz() {
  return useQuery({
    queryKey: ['sucursal-matriz'],
    queryFn: async () => {
      const response = await sucursalesApi.obtenerMatriz();
      return response.data.data;
    },
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

/**
 * Hook para obtener sucursales del usuario
 */
export function useSucursalesUsuario(usuarioId) {
  return useQuery({
    queryKey: ['sucursales-usuario', usuarioId],
    queryFn: async () => {
      const response = await sucursalesApi.obtenerPorUsuario(usuarioId);
      return response.data.data || [];
    },
    enabled: !!usuarioId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// ==================== USUARIOS DE SUCURSAL ====================

/**
 * Hook para obtener usuarios de una sucursal
 */
export function useUsuariosSucursal(sucursalId) {
  return useQuery({
    queryKey: ['sucursal-usuarios', sucursalId],
    queryFn: async () => {
      const response = await sucursalesApi.obtenerUsuarios(sucursalId);
      return response.data.data || [];
    },
    enabled: !!sucursalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para asignar usuario a sucursal
 */
export function useAsignarUsuarioSucursal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sucursalId, data }) => {
      const response = await sucursalesApi.asignarUsuario(sucursalId, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sucursal-usuarios', variables.sucursalId], exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['sucursales-usuario'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Usuario'),
  });
}

// ==================== PROFESIONALES DE SUCURSAL ====================

/**
 * Hook para obtener profesionales de una sucursal
 */
export function useProfesionalesSucursal(sucursalId) {
  return useQuery({
    queryKey: ['sucursal-profesionales', sucursalId],
    queryFn: async () => {
      const response = await sucursalesApi.obtenerProfesionales(sucursalId);
      return response.data.data || [];
    },
    enabled: !!sucursalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para asignar profesional a sucursal
 */
export function useAsignarProfesionalSucursal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sucursalId, data }) => {
      const response = await sucursalesApi.asignarProfesional(sucursalId, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sucursal-profesionales', variables.sucursalId], exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Profesional'),
  });
}

// ==================== MÉTRICAS DASHBOARD ====================

/**
 * Hook para obtener métricas consolidadas del dashboard multi-sucursal
 *
 * @param {Object} params - Parámetros de filtrado
 * @param {Object} options - Opciones del hook
 * @param {boolean} options.enabled - Si debe ejecutar la query (default: true)
 */
export function useMetricasSucursales(params = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['metricas-sucursales', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await sucursalesApi.obtenerMetricas(sanitizedParams);
      return response.data.data;
    },
    enabled, // FIX RBAC Ene 2026: Solo ejecutar si está habilitado
    staleTime: STALE_TIMES.DYNAMIC,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ==================== TRANSFERENCIAS DE STOCK ====================

/**
 * Hook para listar transferencias de stock
 */
export function useTransferencias(params = {}) {
  return useQuery({
    queryKey: queryKeys.inventario.transferencias.list(params),
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await sucursalesApi.listarTransferencias(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
    keepPreviousData: true,
  });
}

/**
 * Hook para obtener transferencia por ID
 */
export function useTransferencia(id) {
  return useQuery({
    queryKey: ['transferencia', id],
    queryFn: async () => {
      const response = await sucursalesApi.obtenerTransferencia(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para crear transferencia
 */
export function useCrearTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        notas: data.notas?.trim() || undefined,
      };
      const response = await sucursalesApi.crearTransferencia(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Transferencia'),
  });
}

/**
 * Hook para enviar transferencia (borrador -> enviado)
 */
export function useEnviarTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await sucursalesApi.enviarTransferencia(id);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transferencia', data.id], exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Transferencia'),
  });
}

/**
 * Hook para recibir transferencia (enviado -> recibido)
 */
export function useRecibirTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data = {} }) => {
      const response = await sucursalesApi.recibirTransferencia(id, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transferencia', data.id], exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Transferencia'),
  });
}

/**
 * Hook para cancelar transferencia
 */
export function useCancelarTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await sucursalesApi.cancelarTransferencia(id);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transferencia', data.id], exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Transferencia'),
  });
}

/**
 * Hook para agregar item a transferencia (solo en estado borrador)
 */
export function useAgregarItemTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferenciaId, data }) => {
      const response = await sucursalesApi.agregarItemTransferencia(transferenciaId, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transferencia', variables.transferenciaId], exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Item'),
  });
}

/**
 * Hook para eliminar item de transferencia (solo en estado borrador)
 */
export function useEliminarItemTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferenciaId, itemId }) => {
      const response = await sucursalesApi.eliminarItemTransferencia(transferenciaId, itemId);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transferencia', variables.transferenciaId], exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Item'),
  });
}
