/**
 * ====================================================================
 * HOOKS CRUD CLIENTES
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reducción de ~220 líneas a ~160 líneas
 * Migrado a TypeScript - Feb 2026
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { clientesApi, citasApi } from '@/services/api/endpoints';
import { createCRUDHooks, createSearchHook } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { Cliente, ClienteEstadisticas } from '@/types/entities/cliente';

// ====================================================================
// TIPOS
// ====================================================================

interface ClientesListResponse {
  clientes: Cliente[];
  paginacion?: {
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

interface ClienteEstadisticasDetalle {
  total_citas: number;
  citas_completadas: number;
  citas_canceladas: number;
  citas_no_show: number;
  total_gastado: number;
  ticket_promedio: number;
  ultima_cita?: string;
  proxima_cita?: string;
  servicios_favoritos: Array<{
    id: number;
    nombre: string;
    veces_usado: number;
  }>;
  profesionales_frecuentes: Array<{
    id: number;
    nombre: string;
    veces_visitado: number;
  }>;
}

interface DisponibilidadInmediata {
  disponible: boolean;
  profesional_id?: number;
  profesional_nombre?: string;
  hora_disponible?: string;
  siguiente_disponible?: string;
}

interface ImportCSVResult {
  importados: number;
  errores: number;
  detalles?: Array<{
    fila: number;
    error: string;
  }>;
}

interface WalkInData {
  cliente_id?: number;
  nombre?: string;
  telefono?: string;
  email?: string;
  servicio_id: number;
  profesional_id?: number;
  sucursal_id?: number;
  notas?: string;
}

interface WalkInResponse {
  cita_id: number;
  cliente_id: number;
  hora_inicio: string;
  hora_fin: string;
}

// ====================================================================
// HOOKS CRUD
// ====================================================================

const hooks = createCRUDHooks<Cliente>({
  name: 'cliente',
  namePlural: 'clientes',
  api: clientesApi,
  baseKey: 'clientes',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  invalidateOnCreate: queryKeys.personas.clientes.all,
  invalidateOnUpdate: queryKeys.personas.clientes.all,
  invalidateOnDelete: queryKeys.personas.clientes.all,
  errorMessages: {
    create: { 409: 'Ya existe un cliente con ese email o teléfono' },
    update: { 409: 'Ya existe un cliente con ese email o teléfono' },
    delete: { 400: 'No se puede eliminar el cliente (puede tener citas asociadas)' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true, // Evita flash de loading durante paginación
  responseKey: 'clientes',
  transformList: (data, pagination) => ({
    clientes: Array.isArray(data) ? data : (data.clientes || []),
    paginacion: pagination,
  }),
});

// Exportar hooks CRUD
export const useClientes = hooks.useList as (params?: Record<string, unknown>) => UseQueryResult<ClientesListResponse>;
export const useCliente = hooks.useDetail as (id: string | number | null | undefined) => UseQueryResult<Cliente>;
export const useCrearCliente = hooks.useCreate as () => UseMutationResult<Cliente, Error, Partial<Cliente>>;
export const useActualizarCliente = hooks.useUpdate as () => UseMutationResult<Cliente, Error, { id: string | number; data: Partial<Cliente> }>;
export const useEliminarCliente = hooks.useDelete;

// ====================================================================
// HOOKS ESPECIALIZADOS
// ====================================================================

/**
 * Hook para buscar clientes (búsqueda rápida)
 * Refactorizado con createSearchHook - Ene 2026
 */
export const useBuscarClientes = createSearchHook<Cliente>({
  key: 'clientes',
  searchFn: clientesApi.buscar,
});

/**
 * Hook para buscar cliente por teléfono (útil para walk-in)
 */
export function useBuscarPorTelefono(telefono: string, enabled = false): UseQueryResult<Cliente | null> {
  return useQuery({
    queryKey: ['cliente-telefono', telefono],
    queryFn: async () => {
      const response = await clientesApi.buscarPorTelefono({ telefono });
      return response.data.data;
    },
    enabled: enabled && telefono.length >= 10,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para crear cita walk-in
 */
export function useCrearWalkIn(): UseMutationResult<WalkInResponse, Error, WalkInData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WalkInData) => {
      const response = await citasApi.crearWalkIn(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.citas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.citasDelDia, refetchType: 'active' });
    },
  });
}

/**
 * Hook para consultar disponibilidad inmediata
 */
export function useDisponibilidadInmediata(
  servicioId: number | null,
  profesionalId: number | null = null
): UseQueryResult<DisponibilidadInmediata> {
  return useQuery({
    queryKey: ['disponibilidad-inmediata', servicioId, profesionalId],
    queryFn: async () => {
      const response = await citasApi.disponibilidadInmediata({
        servicio_id: servicioId,
        profesional_id: profesionalId,
      });
      return response.data.data;
    },
    enabled: !!servicioId,
    staleTime: STALE_TIMES.FREQUENT,
    refetchInterval: 1000 * 60,
  });
}

/**
 * Hook para obtener estadísticas generales de clientes
 */
export function useEstadisticasClientes(): UseQueryResult<ClienteEstadisticas> {
  return useQuery({
    queryKey: queryKeys.estadisticas.clientes,
    queryFn: async () => {
      const response = await clientesApi.obtenerEstadisticas();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener estadísticas de un cliente específico (Vista 360°)
 */
export function useEstadisticasCliente(clienteId: string | number | null): UseQueryResult<ClienteEstadisticasDetalle> {
  return useQuery({
    queryKey: queryKeys.estadisticas.clienteDetail(clienteId),
    queryFn: async () => {
      const response = await clientesApi.obtenerEstadisticasCliente(clienteId);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para importar clientes desde CSV
 */
export function useImportarClientesCSV(): UseMutationResult<ImportCSVResult, Error, FormData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await clientesApi.importarCSV(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.estadisticas.clientes, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Clientes') as (error: Error) => void,
  });
}
