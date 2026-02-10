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
 * Migrado a TypeScript - Feb 2026
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { sucursalesApi } from '@/services/api/endpoints';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type {
  Sucursal,
  CrearSucursalData,
  ActualizarSucursalData,
  Transferencia,
  TransferenciaItem,
  Usuario,
  Profesional,
} from '@/types/entities';

// ==================== Tipos locales ====================

interface CrearTransferenciaData {
  sucursal_origen_id: number;
  sucursal_destino_id: number;
  notas?: string;
  items?: Array<{ producto_id: number; cantidad: number }>;
}

interface RecibirTransferenciaData {
  items?: Array<{ id: number; cantidad_recibida: number }>;
  notas?: string;
}

interface AgregarItemData {
  producto_id: number;
  cantidad: number;
}

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

const hooks = createCRUDHooks<Sucursal, CrearSucursalData, ActualizarSucursalData>({
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
  invalidateOnCreate: [queryKeys.sistema.sucursales.all[0], queryKeys.sistema.sucursales.matriz[0]],
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

export function useSucursalMatriz(): UseQueryResult<Sucursal> {
  return useQuery({
    queryKey: queryKeys.sistema.sucursales.matriz,
    queryFn: async () => {
      const response = await sucursalesApi.obtenerMatriz();
      return (response as any).data.data;
    },
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

export function useSucursalesUsuario(usuarioId: number | string | null | undefined): UseQueryResult<Sucursal[]> {
  return useQuery({
    queryKey: queryKeys.sistema.sucursales.porUsuario(usuarioId),
    queryFn: async () => {
      const response = await sucursalesApi.obtenerPorUsuario(usuarioId as number);
      return (response as any).data.data || [];
    },
    enabled: !!usuarioId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// ==================== USUARIOS DE SUCURSAL ====================

export function useUsuariosSucursal(sucursalId: number | string | null | undefined): UseQueryResult<Usuario[]> {
  return useQuery({
    queryKey: queryKeys.sistema.sucursales.usuarios(sucursalId),
    queryFn: async () => {
      const response = await sucursalesApi.obtenerUsuarios(sucursalId as number);
      return (response as any).data.data || [];
    },
    enabled: !!sucursalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useAsignarUsuarioSucursal(): UseMutationResult<unknown, Error, { sucursalId: number; data: { usuario_id: number } }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sucursalId, data }: { sucursalId: number; data: { usuario_id: number } }) => {
      const response = await sucursalesApi.asignarUsuario(sucursalId, data);
      return (response as any).data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.usuarios(variables.sucursalId), exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['sucursales-usuario'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Usuario'),
  });
}

// ==================== PROFESIONALES DE SUCURSAL ====================

export function useProfesionalesSucursal(sucursalId: number | string | null | undefined): UseQueryResult<Profesional[]> {
  return useQuery({
    queryKey: queryKeys.sistema.sucursales.profesionales(sucursalId),
    queryFn: async () => {
      const response = await sucursalesApi.obtenerProfesionales(sucursalId as number);
      return (response as any).data.data || [];
    },
    enabled: !!sucursalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useAsignarProfesionalSucursal(): UseMutationResult<unknown, Error, { sucursalId: number; data: { profesional_id: number } }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sucursalId, data }: { sucursalId: number; data: { profesional_id: number } }) => {
      const response = await sucursalesApi.asignarProfesional(sucursalId, data);
      return (response as any).data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.profesionales(variables.sucursalId), exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Profesional'),
  });
}

// ==================== MÉTRICAS DASHBOARD ====================

export function useMetricasSucursales(
  params: Record<string, unknown> = {},
  { enabled = true }: { enabled?: boolean } = {},
): UseQueryResult<unknown> {
  return useQuery({
    queryKey: queryKeys.sistema.sucursales.metricas(params),
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await sucursalesApi.obtenerMetricas(sanitizedParams);
      return (response as any).data.data;
    },
    enabled, // FIX RBAC Ene 2026: Solo ejecutar si está habilitado
    staleTime: STALE_TIMES.DYNAMIC,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ==================== TRANSFERENCIAS DE STOCK ====================

export function useTransferencias(params: Record<string, unknown> = {}): UseQueryResult<Transferencia[]> {
  return useQuery({
    queryKey: queryKeys.inventario.transferencias.list(params),
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await sucursalesApi.listarTransferencias(sanitizedParams);
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
    placeholderData: keepPreviousData,
  });
}

export function useTransferencia(id: number | string | null | undefined): UseQueryResult<Transferencia> {
  return useQuery({
    queryKey: queryKeys.sistema.sucursales.transferencia(id),
    queryFn: async () => {
      const response = await sucursalesApi.obtenerTransferencia(id as number);
      return (response as any).data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export function useCrearTransferencia(): UseMutationResult<Transferencia, Error, CrearTransferenciaData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CrearTransferenciaData) => {
      const sanitized = {
        ...data,
        notas: data.notas?.trim() || undefined,
      };
      const response = await sucursalesApi.crearTransferencia(sanitized);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Transferencia'),
  });
}

export function useEnviarTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await sucursalesApi.enviarTransferencia(id);
      return (response as any).data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.transferencia(data.id), exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Transferencia'),
  });
}

export function useRecibirTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data = {} }: { id: number; data?: RecibirTransferenciaData }) => {
      const response = await sucursalesApi.recibirTransferencia(id, data);
      return (response as any).data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.transferencia(data.id), exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Transferencia'),
  });
}

export function useCancelarTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await sucursalesApi.cancelarTransferencia(id);
      return (response as any).data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.transferencia(data.id), exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Transferencia'),
  });
}

export function useAgregarItemTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferenciaId, data }: { transferenciaId: number; data: AgregarItemData }) => {
      const response = await sucursalesApi.agregarItemTransferencia(transferenciaId, data);
      return (response as any).data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.transferencia(variables.transferenciaId), exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Item'),
  });
}

export function useEliminarItemTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferenciaId, itemId }: { transferenciaId: number; itemId: number }) => {
      const response = await sucursalesApi.eliminarItemTransferencia(transferenciaId, itemId);
      return (response as any).data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.sucursales.transferencia(variables.transferenciaId), exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.transferencias.all, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Item'),
  });
}
