/**
 * ====================================================================
 * HOOKS CRUD CLIENTES
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reducción de ~220 líneas a ~160 líneas
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { clientesApi, citasApi } from '@/services/api/endpoints';
import { createCRUDHooks, createSanitizer, createSearchHook } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// Crear hooks CRUD
const hooks = createCRUDHooks({
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
export const useClientes = hooks.useList;
export const useCliente = hooks.useDetail;
export const useCrearCliente = hooks.useCreate;
export const useActualizarCliente = hooks.useUpdate;
export const useEliminarCliente = hooks.useDelete;

// ====================================================================
// HOOKS ESPECIALIZADOS
// ====================================================================

/**
 * Hook para buscar clientes (búsqueda rápida)
 * Refactorizado con createSearchHook - Ene 2026
 */
export const useBuscarClientes = createSearchHook({
  key: 'clientes',
  searchFn: clientesApi.buscar,
});

/**
 * Hook para buscar cliente por teléfono (útil para walk-in)
 */
export function useBuscarPorTelefono(telefono, enabled = false) {
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
export function useCrearWalkIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
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
export function useDisponibilidadInmediata(servicioId, profesionalId = null) {
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
export function useEstadisticasClientes() {
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
 * @param {number|string} clienteId - ID del cliente
 */
export function useEstadisticasCliente(clienteId) {
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
export function useImportarClientesCSV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await clientesApi.importarCSV(data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.estadisticas.clientes, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Clientes'),
  });
}
