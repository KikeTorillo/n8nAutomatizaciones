/**
 * ====================================================================
 * HOOKS: Operaciones de Almacén
 * ====================================================================
 * React Query hooks para gestión de operaciones multi-paso
 * Pick → Pack → Ship / Recepción → QC → Almacenamiento
 * Fecha: 31 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionesAlmacenApi } from '@/services/api/endpoints';
import useSucursalStore from '@/store/sucursalStore';

/**
 * QUERY KEYS para operaciones de almacén
 */
export const OPERACIONES_ALMACEN_KEYS = {
  all: ['operaciones-almacen'],
  list: (params) => [...OPERACIONES_ALMACEN_KEYS.all, 'list', params],
  detail: (id) => [...OPERACIONES_ALMACEN_KEYS.all, 'detail', id],
  cadena: (id) => [...OPERACIONES_ALMACEN_KEYS.all, 'cadena', id],
  pendientes: (sucursalId) => [...OPERACIONES_ALMACEN_KEYS.all, 'pendientes', sucursalId],
  estadisticas: (sucursalId) => [...OPERACIONES_ALMACEN_KEYS.all, 'estadisticas', sucursalId],
  kanban: (sucursalId) => [...OPERACIONES_ALMACEN_KEYS.all, 'kanban', sucursalId],
};

// ==================== QUERIES ====================

/**
 * Hook para listar operaciones con filtros
 * @param {Object} params - { sucursal_id?, tipo_operacion?, estado?, estados?, asignado_a?, origen_tipo?, limit? }
 */
export function useOperacionesAlmacen(params = {}) {
  const { getSucursalId } = useSucursalStore();

  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.list(params),
    queryFn: async () => {
      const sanitizedParams = {
        ...params,
        sucursal_id: params.sucursal_id || getSucursalId() || undefined,
      };

      // Limpiar valores vacíos
      Object.keys(sanitizedParams).forEach(key => {
        if (sanitizedParams[key] === '' || sanitizedParams[key] === null || sanitizedParams[key] === undefined) {
          delete sanitizedParams[key];
        }
      });

      const response = await operacionesAlmacenApi.listar(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener operacion por ID con items
 * @param {number} id - ID de la operacion
 */
export function useOperacionAlmacen(id) {
  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.detail(id),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerPorId(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener cadena completa de operaciones
 * @param {number} id - ID de cualquier operacion de la cadena
 */
export function useCadenaOperaciones(id) {
  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.cadena(id),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerCadena(id);
      return response.data.data || [];
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener operaciones pendientes por sucursal
 * @param {number} sucursalId - ID de la sucursal
 */
export function useOperacionesPendientes(sucursalId) {
  const { getSucursalId } = useSucursalStore();
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.pendientes(efectiveSucursalId),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerPendientes(efectiveSucursalId);
      return response.data.data || { por_tipo: [], total: 0 };
    },
    enabled: !!efectiveSucursalId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener estadísticas de operaciones
 * @param {number} sucursalId - ID de la sucursal
 */
export function useEstadisticasOperaciones(sucursalId) {
  const { getSucursalId } = useSucursalStore();
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.estadisticas(efectiveSucursalId),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerEstadisticas(efectiveSucursalId);
      return response.data.data || {};
    },
    enabled: !!efectiveSucursalId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener resumen Kanban de operaciones
 * @param {number} sucursalId - ID de la sucursal
 */
export function useOperacionesKanban(sucursalId) {
  const { getSucursalId } = useSucursalStore();
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: OPERACIONES_ALMACEN_KEYS.kanban(efectiveSucursalId),
    queryFn: async () => {
      const response = await operacionesAlmacenApi.obtenerResumenKanban(efectiveSucursalId);
      return response.data.data || {};
    },
    enabled: !!efectiveSucursalId,
    staleTime: 1000 * 60 * 2,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para crear operación manual
 */
export function useCrearOperacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await operacionesAlmacenApi.crear(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al crear operación');
    },
  });
}

/**
 * Hook para actualizar operación
 */
export function useActualizarOperacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await operacionesAlmacenApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.id));
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al actualizar operación');
    },
  });
}

/**
 * Hook para asignar operación a usuario
 */
export function useAsignarOperacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, usuarioId }) => {
      const response = await operacionesAlmacenApi.asignar(id, { usuario_id: usuarioId });
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.id));
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al asignar operación');
    },
  });
}

/**
 * Hook para iniciar operación
 */
export function useIniciarOperacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await operacionesAlmacenApi.iniciar(id);
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.id));
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al iniciar operación');
    },
  });
}

/**
 * Hook para completar operación
 */
export function useCompletarOperacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items }) => {
      const response = await operacionesAlmacenApi.completar(id, { items });
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      if (result.operacion_siguiente_id) {
        queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.operacion_siguiente_id));
      }
      // Invalidar inventario ya que puede haber movimientos de stock
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['movimientos-inventario']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al completar operación');
    },
  });
}

/**
 * Hook para cancelar operación
 */
export function useCancelarOperacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }) => {
      const response = await operacionesAlmacenApi.cancelar(id, { motivo });
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.id));
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al cancelar operación');
    },
  });
}

/**
 * Hook para procesar item individual
 */
export function useProcesarItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, cantidadProcesada, ubicacionDestinoId }) => {
      const response = await operacionesAlmacenApi.procesarItem(itemId, {
        cantidad_procesada: cantidadProcesada,
        ubicacion_destino_id: ubicacionDestinoId,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al procesar item');
    },
  });
}

/**
 * Hook para cancelar item
 */
export function useCancelarItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId) => {
      const response = await operacionesAlmacenApi.cancelarItem(itemId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al cancelar item');
    },
  });
}

// ==================== HOOK COMBINADO ====================

/**
 * Hook combinado para gestión de operaciones de almacén
 * @param {Object} options - { sucursalId, tipoOperacion }
 */
export function useOperacionesAlmacenManager({ sucursalId, tipoOperacion } = {}) {
  const { getSucursalId } = useSucursalStore();
  const efectiveSucursalId = sucursalId || getSucursalId();

  // Filtros base
  const filtros = {
    sucursal_id: efectiveSucursalId,
    ...(tipoOperacion && { tipo_operacion: tipoOperacion }),
  };

  // Queries
  const {
    data: operaciones = [],
    isLoading: loadingOperaciones,
    error: errorOperaciones,
    refetch: refetchOperaciones,
  } = useOperacionesAlmacen(filtros);

  const {
    data: kanban = {},
    isLoading: loadingKanban,
  } = useOperacionesKanban(efectiveSucursalId);

  const {
    data: estadisticas = {},
    isLoading: loadingEstadisticas,
  } = useEstadisticasOperaciones(efectiveSucursalId);

  // Mutations
  const crearMutation = useCrearOperacion();
  const actualizarMutation = useActualizarOperacion();
  const asignarMutation = useAsignarOperacion();
  const iniciarMutation = useIniciarOperacion();
  const completarMutation = useCompletarOperacion();
  const cancelarMutation = useCancelarOperacion();
  const procesarItemMutation = useProcesarItem();
  const cancelarItemMutation = useCancelarItem();

  return {
    // Data
    operaciones,
    kanban,
    estadisticas,
    sucursalId: efectiveSucursalId,

    // Loading
    loadingOperaciones,
    loadingKanban,
    loadingEstadisticas,
    isLoading: loadingOperaciones || loadingKanban,

    // Errors
    errorOperaciones,
    hasError: !!errorOperaciones,

    // Actions
    refetch: refetchOperaciones,
    crear: crearMutation.mutateAsync,
    actualizar: actualizarMutation.mutateAsync,
    asignar: asignarMutation.mutateAsync,
    iniciar: iniciarMutation.mutateAsync,
    completar: completarMutation.mutateAsync,
    cancelar: cancelarMutation.mutateAsync,
    procesarItem: procesarItemMutation.mutateAsync,
    cancelarItem: cancelarItemMutation.mutateAsync,

    // Mutation states
    isCreating: crearMutation.isPending,
    isUpdating: actualizarMutation.isPending,
    isAssigning: asignarMutation.isPending,
    isStarting: iniciarMutation.isPending,
    isCompleting: completarMutation.isPending,
    isCanceling: cancelarMutation.isPending,
    isProcessingItem: procesarItemMutation.isPending,
  };
}

// ==================== TIPOS DE OPERACION ====================

export const TIPOS_OPERACION = {
  RECEPCION: 'recepcion',
  CONTROL_CALIDAD: 'control_calidad',
  ALMACENAMIENTO: 'almacenamiento',
  PICKING: 'picking',
  EMPAQUE: 'empaque',
  ENVIO: 'envio',
  TRANSFERENCIA_INTERNA: 'transferencia_interna',
};

export const ESTADOS_OPERACION = {
  BORRADOR: 'borrador',
  ASIGNADA: 'asignada',
  EN_PROCESO: 'en_proceso',
  PARCIAL: 'parcial',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
};

export const LABELS_TIPO_OPERACION = {
  [TIPOS_OPERACION.RECEPCION]: 'Recepción',
  [TIPOS_OPERACION.CONTROL_CALIDAD]: 'Control de Calidad',
  [TIPOS_OPERACION.ALMACENAMIENTO]: 'Almacenamiento',
  [TIPOS_OPERACION.PICKING]: 'Picking',
  [TIPOS_OPERACION.EMPAQUE]: 'Empaque',
  [TIPOS_OPERACION.ENVIO]: 'Envío',
  [TIPOS_OPERACION.TRANSFERENCIA_INTERNA]: 'Transferencia Interna',
};

export const LABELS_ESTADO_OPERACION = {
  [ESTADOS_OPERACION.BORRADOR]: 'Borrador',
  [ESTADOS_OPERACION.ASIGNADA]: 'Asignada',
  [ESTADOS_OPERACION.EN_PROCESO]: 'En Proceso',
  [ESTADOS_OPERACION.PARCIAL]: 'Parcial',
  [ESTADOS_OPERACION.COMPLETADA]: 'Completada',
  [ESTADOS_OPERACION.CANCELADA]: 'Cancelada',
};

export const COLORES_ESTADO_OPERACION = {
  [ESTADOS_OPERACION.BORRADOR]: 'gray',
  [ESTADOS_OPERACION.ASIGNADA]: 'blue',
  [ESTADOS_OPERACION.EN_PROCESO]: 'yellow',
  [ESTADOS_OPERACION.PARCIAL]: 'orange',
  [ESTADOS_OPERACION.COMPLETADA]: 'green',
  [ESTADOS_OPERACION.CANCELADA]: 'red',
};

export default {
  useOperacionesAlmacen,
  useOperacionAlmacen,
  useCadenaOperaciones,
  useOperacionesPendientes,
  useEstadisticasOperaciones,
  useOperacionesKanban,
  useCrearOperacion,
  useActualizarOperacion,
  useAsignarOperacion,
  useIniciarOperacion,
  useCompletarOperacion,
  useCancelarOperacion,
  useProcesarItem,
  useCancelarItem,
  useOperacionesAlmacenManager,
  TIPOS_OPERACION,
  ESTADOS_OPERACION,
  LABELS_TIPO_OPERACION,
  LABELS_ESTADO_OPERACION,
  COLORES_ESTADO_OPERACION,
};
