import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificacionesApi } from '@/services/api/endpoints';

// ==================== FEED DE NOTIFICACIONES ====================

/**
 * Hook para listar notificaciones del usuario
 * @param {Object} params - { solo_no_leidas?, categoria?, limit?, offset? }
 */
export function useNotificaciones(params = {}) {
  return useQuery({
    queryKey: ['notificaciones', params],
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
    staleTime: 1000 * 30, // 30 segundos - notificaciones cambian frecuentemente
  });
}

/**
 * Hook para contar notificaciones no leidas (para badge)
 * Se actualiza automaticamente cada 30 segundos
 */
export function useNotificacionesCount() {
  return useQuery({
    queryKey: ['notificaciones-count'],
    queryFn: async () => {
      const response = await notificacionesApi.contarNoLeidas();
      return response.data.data?.no_leidas || 0;
    },
    staleTime: 1000 * 30, // 30 segundos
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
      queryClient.invalidateQueries(['notificaciones']);
      queryClient.invalidateQueries(['notificaciones-count']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(backendMessage || 'Error al marcar notificacion como leida');
    },
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
      queryClient.invalidateQueries(['notificaciones']);
      queryClient.invalidateQueries(['notificaciones-count']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(backendMessage || 'Error al marcar notificaciones como leidas');
    },
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
      queryClient.invalidateQueries(['notificaciones']);
      queryClient.invalidateQueries(['notificaciones-count']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(backendMessage || 'Error al archivar notificacion');
    },
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
      queryClient.invalidateQueries(['notificaciones']);
      queryClient.invalidateQueries(['notificaciones-count']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(backendMessage || 'Error al eliminar notificacion');
    },
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
      queryClient.invalidateQueries(['notificaciones']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(backendMessage || 'Error al crear notificacion');
    },
  });
}

// ==================== PREFERENCIAS ====================

/**
 * Hook para obtener preferencias de notificacion del usuario
 */
export function useNotificacionesPreferencias() {
  return useQuery({
    queryKey: ['notificaciones-preferencias'],
    queryFn: async () => {
      const response = await notificacionesApi.obtenerPreferencias();
      return response.data.data || {};
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
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
      queryClient.invalidateQueries(['notificaciones-preferencias']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(backendMessage || 'Error al actualizar preferencias');
    },
  });
}

/**
 * Hook para obtener tipos de notificacion disponibles
 */
export function useNotificacionesTipos() {
  return useQuery({
    queryKey: ['notificaciones-tipos'],
    queryFn: async () => {
      const response = await notificacionesApi.obtenerTipos();
      return response.data.data || {};
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// ==================== PLANTILLAS (ADMIN) ====================

/**
 * Hook para listar plantillas de notificacion
 */
export function useNotificacionesPlantillas() {
  return useQuery({
    queryKey: ['notificaciones-plantillas'],
    queryFn: async () => {
      const response = await notificacionesApi.listarPlantillas();
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
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
      queryClient.invalidateQueries(['notificaciones-plantillas']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(backendMessage || 'Error al crear plantilla');
    },
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
      queryClient.invalidateQueries(['notificaciones-plantillas']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(backendMessage || 'Error al actualizar plantilla');
    },
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
      queryClient.invalidateQueries(['notificaciones-plantillas']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      throw new Error(backendMessage || 'Error al eliminar plantilla');
    },
  });
}

// ==================== CONSTANTES ====================

/**
 * Niveles de notificacion con sus colores
 */
export const NOTIFICACION_NIVELES = {
  info: { label: 'Informacion', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
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
