/**
 * ====================================================================
 * HOOKS - ACTIVIDADES DE CLIENTES (Timeline)
 * ====================================================================
 *
 * Fase 4A - Timeline de Actividad (Ene 2026)
 * Hooks TanStack Query para gestión de notas, llamadas, tareas y timeline
 *
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { clientesApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ====================================================================
// CONSTANTES
// ====================================================================

export const TIPOS_ACTIVIDAD = [
  { value: 'nota', label: 'Nota', icon: 'FileText', color: 'text-primary-500' },
  { value: 'llamada', label: 'Llamada', icon: 'Phone', color: 'text-green-500' },
  { value: 'email', label: 'Email', icon: 'Mail', color: 'text-secondary-500' },
  { value: 'tarea', label: 'Tarea', icon: 'CheckSquare', color: 'text-orange-500' },
  { value: 'sistema', label: 'Sistema', icon: 'Settings', color: 'text-gray-500' },
];

export const TIPOS_TIMELINE = [
  ...TIPOS_ACTIVIDAD,
  { value: 'cita', label: 'Cita', icon: 'Calendar', color: 'text-primary-500' },
  { value: 'venta', label: 'Venta', icon: 'ShoppingCart', color: 'text-emerald-500' },
];

export const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  { value: 'normal', label: 'Normal', color: 'text-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900' },
  { value: 'alta', label: 'Alta', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900' },
  { value: 'urgente', label: 'Urgente', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900' },
];

export const ESTADOS_TAREA = [
  { value: 'pendiente', label: 'Pendiente', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900' },
  { value: 'completada', label: 'Completada', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900' },
  { value: 'cancelada', label: 'Cancelada', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
];

// ====================================================================
// QUERIES
// ====================================================================

/**
 * Hook para listar actividades de un cliente
 */
export function useActividadesCliente(clienteId, params = {}) {
  return useQuery({
    queryKey: [...queryKeys.personas.clientes.actividades(clienteId), params],
    queryFn: async () => {
      const response = await clientesApi.listarActividades(clienteId, params);
      return {
        actividades: response.data.data,
        paginacion: response.data.pagination,
      };
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener timeline unificado (actividades + citas + ventas)
 */
export function useTimelineCliente(clienteId, params = {}) {
  return useQuery({
    queryKey: ['cliente-timeline', clienteId, params],
    queryFn: async () => {
      const response = await clientesApi.obtenerTimeline(clienteId, params);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Hook para obtener una actividad por ID
 */
export function useActividad(clienteId, actividadId) {
  return useQuery({
    queryKey: ['cliente-actividad', clienteId, actividadId],
    queryFn: async () => {
      const response = await clientesApi.obtenerActividad(clienteId, actividadId);
      return response.data.data;
    },
    enabled: !!clienteId && !!actividadId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para contar actividades de un cliente
 */
export function useConteoActividades(clienteId) {
  return useQuery({
    queryKey: ['cliente-actividades-conteo', clienteId],
    queryFn: async () => {
      const response = await clientesApi.contarActividades(clienteId);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ====================================================================
// MUTATIONS
// ====================================================================

/**
 * Hook para crear actividad (nota, llamada, tarea, email)
 */
export function useCrearActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, data }) => {
      const response = await clientesApi.crearActividad(clienteId, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar lista de actividades y timeline
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.actividades(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-timeline', variables.clienteId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-actividades-conteo', variables.clienteId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Actividad'),
  });
}

/**
 * Hook para actualizar actividad
 */
export function useActualizarActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, actividadId, data }) => {
      const response = await clientesApi.actualizarActividad(clienteId, actividadId, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-actividad', variables.clienteId, variables.actividadId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.actividades(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-timeline', variables.clienteId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-actividades-conteo', variables.clienteId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Actividad'),
  });
}

/**
 * Hook para eliminar actividad
 */
export function useEliminarActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, actividadId }) => {
      await clientesApi.eliminarActividad(clienteId, actividadId);
      return { clienteId, actividadId };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.actividades(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-timeline', variables.clienteId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-actividades-conteo', variables.clienteId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Actividad'),
  });
}

/**
 * Hook para marcar tarea como completada
 */
export function useCompletarTarea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, actividadId }) => {
      const response = await clientesApi.completarTarea(clienteId, actividadId);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-actividad', variables.clienteId, variables.actividadId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.actividades(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-timeline', variables.clienteId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-actividades-conteo', variables.clienteId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Tarea'),
  });
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Obtener configuración de un tipo de actividad
 */
export function getTipoActividad(tipo) {
  return TIPOS_TIMELINE.find(t => t.value === tipo) || TIPOS_ACTIVIDAD[0];
}

/**
 * Obtener configuración de prioridad
 */
export function getPrioridad(prioridad) {
  return PRIORIDADES.find(p => p.value === prioridad) || PRIORIDADES[1]; // Default: normal
}

/**
 * Obtener configuración de estado
 */
export function getEstadoTarea(estado) {
  return ESTADOS_TAREA.find(e => e.value === estado) || ESTADOS_TAREA[0];
}

/**
 * Formatear fecha relativa (hace X tiempo)
 */
export function formatRelativeDate(date) {
  if (!date) return '';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

  return then.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
}
