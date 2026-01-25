import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { notificacionesApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== FEED DE NOTIFICACIONES ====================

/**
 * Hook para listar notificaciones del usuario
 * @param {Object} params - { solo_no_leidas?, categoria?, limit?, offset? }
 */
export function useNotificaciones(params = {}) {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.list(params),
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await notificacionesApi.listar(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos - notificaciones cambian frecuentemente
  });
}

/**
 * Hook para contar notificaciones no leidas (para badge)
 * Se actualiza automaticamente cada 30 segundos
 */
export function useNotificacionesCount() {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.count,
    queryFn: async () => {
      const response = await notificacionesApi.contarNoLeidas();
      return response.data.data?.no_leidas || 0;
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
    refetchInterval: 1000 * 60, // Refetch cada minuto
  });
}

/**
 * Hook para marcar una notificacion como leida
 */
export function useMarcarNotificacionLeida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await notificacionesApi.marcarLeida(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.count });
    },
    onError: createCRUDErrorHandler('update', 'Notificacion'),
  });
}

/**
 * Hook para marcar todas las notificaciones como leidas
 */
export function useMarcarTodasNotificacionesLeidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await notificacionesApi.marcarTodasLeidas();
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.count });
    },
    onError: createCRUDErrorHandler('update', 'Notificaciones'),
  });
}

/**
 * Hook para archivar una notificacion
 */
export function useArchivarNotificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await notificacionesApi.archivar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.count });
    },
    onError: createCRUDErrorHandler('update', 'Notificacion'),
  });
}

/**
 * Hook para eliminar una notificacion
 */
export function useEliminarNotificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await notificacionesApi.eliminar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.count });
    },
    onError: createCRUDErrorHandler('delete', 'Notificacion'),
  });
}

/**
 * Hook para crear una notificacion (admin/sistema)
 */
export function useCrearNotificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await notificacionesApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.all });
    },
    onError: createCRUDErrorHandler('create', 'Notificacion'),
  });
}

// ==================== PREFERENCIAS ====================

/**
 * Hook para obtener preferencias de notificacion del usuario
 */
export function useNotificacionesPreferencias() {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.preferencias,
    queryFn: async () => {
      const response = await notificacionesApi.obtenerPreferencias();
      return response.data.data || {};
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para actualizar preferencias de notificacion
 */
export function useActualizarNotificacionesPreferencias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferencias) => {
      const response = await notificacionesApi.actualizarPreferencias({ preferencias });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.preferencias });
    },
    onError: createCRUDErrorHandler('update', 'Preferencias'),
  });
}

/**
 * Hook para obtener tipos de notificacion disponibles
 */
export function useNotificacionesTipos() {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.tipos,
    queryFn: async () => {
      const response = await notificacionesApi.obtenerTipos();
      return response.data.data || {};
    },
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos
  });
}

// ==================== PLANTILLAS (ADMIN) ====================

/**
 * Hook para listar plantillas de notificacion
 */
export function useNotificacionesPlantillas() {
  return useQuery({
    queryKey: queryKeys.sistema.notificaciones.plantillas,
    queryFn: async () => {
      const response = await notificacionesApi.listarPlantillas();
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para crear plantilla de notificacion
 */
export function useCrearNotificacionPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await notificacionesApi.crearPlantilla(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.plantillas });
    },
    onError: createCRUDErrorHandler('create', 'Plantilla'),
  });
}

/**
 * Hook para actualizar plantilla de notificacion
 */
export function useActualizarNotificacionPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value === '' ? null : value;
        }
        return acc;
      }, {});

      const response = await notificacionesApi.actualizarPlantilla(id, sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.plantillas });
    },
    onError: createCRUDErrorHandler('update', 'Plantilla'),
  });
}

/**
 * Hook para eliminar plantilla de notificacion
 */
export function useEliminarNotificacionPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await notificacionesApi.eliminarPlantilla(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.notificaciones.plantillas });
    },
    onError: createCRUDErrorHandler('delete', 'Plantilla'),
  });
}

// ==================== CONSTANTES ====================

/**
 * Niveles de notificacion con sus colores
 */
export const NOTIFICACION_NIVELES = {
  info: { label: 'Informacion', color: 'text-primary-500 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/30' },
  success: { label: 'Exito', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
  warning: { label: 'Advertencia', color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
  error: { label: 'Error', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
};

/**
 * Categorias de notificacion
 */
export const NOTIFICACION_CATEGORIAS = [
  { value: 'citas', label: 'Citas' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'profesionales', label: 'Profesionales' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'sistema', label: 'Sistema' },
  { value: 'eventos', label: 'Eventos digitales' },
  { value: 'comisiones', label: 'Comisiones' },
  { value: 'suscripcion', label: 'Suscripcion' },
];
