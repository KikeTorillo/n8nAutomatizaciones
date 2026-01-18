import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { sucursalesApi } from '@/services/api/endpoints';

// ==================== HOOKS CRUD SUCURSALES ====================

/**
 * Hook para listar sucursales con filtros
 * @param {Object} params - { activo, es_matriz, ciudad_id }
 */
export function useSucursales(params = {}) {
  return useQuery({
    queryKey: ['sucursales', params],
    queryFn: async () => {
      // Sanitizar params - eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await sucursalesApi.listar(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener sucursal por ID
 * @param {number} id
 */
export function useSucursal(id) {
  return useQuery({
    queryKey: ['sucursal', id],
    queryFn: async () => {
      const response = await sucursalesApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

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
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos (cambia poco)
  });
}

/**
 * Hook para obtener sucursales del usuario
 * @param {number} usuarioId
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

/**
 * Hook para crear sucursal
 */
export function useCrearSucursal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        codigo: data.codigo?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        codigo_postal: data.codigo_postal?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        email: data.email?.trim() || undefined,
        whatsapp: data.whatsapp?.trim() || undefined,
      };
      const response = await sucursalesApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
      queryClient.invalidateQueries({ queryKey: ['sucursal-matriz'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al crear sucursal');
    },
  });
}

/**
 * Hook para actualizar sucursal
 */
export function useActualizarSucursal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        codigo: data.codigo?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        codigo_postal: data.codigo_postal?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        email: data.email?.trim() || undefined,
        whatsapp: data.whatsapp?.trim() || undefined,
      };
      const response = await sucursalesApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sucursal', data.id] });
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al actualizar sucursal');
    },
  });
}

/**
 * Hook para eliminar sucursal (soft delete)
 */
export function useEliminarSucursal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await sucursalesApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      // Mensaje específico para error de matriz
      if (error.response?.data?.error?.includes('matriz')) {
        throw new Error('No se puede eliminar la sucursal matriz');
      }
      throw new Error('Error al eliminar sucursal');
    },
  });
}

// ==================== HOOKS USUARIOS DE SUCURSAL ====================

/**
 * Hook para obtener usuarios de una sucursal
 * @param {number} sucursalId
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
      queryClient.invalidateQueries({ queryKey: ['sucursal-usuarios', variables.sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
      queryClient.invalidateQueries({ queryKey: ['sucursales-usuario'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al asignar usuario');
    },
  });
}

// ==================== HOOKS PROFESIONALES DE SUCURSAL ====================

/**
 * Hook para obtener profesionales de una sucursal
 * @param {number} sucursalId
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
      queryClient.invalidateQueries({ queryKey: ['sucursal-profesionales', variables.sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al asignar profesional');
    },
  });
}

// ==================== HOOKS MÉTRICAS DASHBOARD ====================

/**
 * Hook para obtener métricas consolidadas del dashboard multi-sucursal
 * @param {Object} params - { sucursal_id?, fecha_desde?, fecha_hasta? }
 * - sucursal_id = null/undefined: Métricas consolidadas de todas las sucursales
 * - sucursal_id = number: Métricas de sucursal específica
 */
export function useMetricasSucursales(params = {}) {
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
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos - datos de dashboard
    refetchInterval: 1000 * 60 * 5, // Refetch cada 5 minutos
  });
}

// ==================== HOOKS TRANSFERENCIAS DE STOCK ====================

/**
 * Hook para listar transferencias de stock
 * @param {Object} params - { estado?, sucursal_origen_id?, sucursal_destino_id?, fecha_desde?, fecha_hasta? }
 */
export function useTransferencias(params = {}) {
  return useQuery({
    queryKey: ['transferencias', params],
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
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos (datos más dinámicos)
  });
}

/**
 * Hook para obtener transferencia por ID
 * @param {number} id
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
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al crear transferencia');
    },
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
      queryClient.invalidateQueries({ queryKey: ['transferencia', data.id] });
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al enviar transferencia');
    },
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
      queryClient.invalidateQueries({ queryKey: ['transferencia', data.id] });
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al recibir transferencia');
    },
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
      queryClient.invalidateQueries({ queryKey: ['transferencia', data.id] });
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al cancelar transferencia');
    },
  });
}
