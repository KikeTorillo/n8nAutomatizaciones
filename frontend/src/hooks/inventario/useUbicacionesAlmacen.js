/**
 * ====================================================================
 * HOOKS: Ubicaciones de Almacén (WMS)
 * ====================================================================
 * React Query hooks para gestión de ubicaciones jerárquicas de almacén
 * Fase 3 - Gaps Arquitectónicos Inventario (Dic 2025)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordenesCompraApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * QUERY KEYS para ubicaciones de almacén
 */
export const UBICACIONES_ALMACEN_KEYS = {
  all: ['ubicaciones-almacen'],
  list: (params) => [...UBICACIONES_ALMACEN_KEYS.all, 'list', params],
  arbol: (sucursalId) => [...UBICACIONES_ALMACEN_KEYS.all, 'arbol', sucursalId],
  detail: (id) => [...UBICACIONES_ALMACEN_KEYS.all, 'detail', id],
  stock: (id) => [...UBICACIONES_ALMACEN_KEYS.all, 'stock', id],
  disponibles: (sucursalId, cantidad) => [...UBICACIONES_ALMACEN_KEYS.all, 'disponibles', sucursalId, cantidad],
  estadisticas: (sucursalId) => [...UBICACIONES_ALMACEN_KEYS.all, 'estadisticas', sucursalId],
  productoUbicaciones: (productoId) => [...UBICACIONES_ALMACEN_KEYS.all, 'producto', productoId],
};

// ==================== QUERIES ====================

/**
 * Hook para listar ubicaciones con filtros
 * @param {Object} params - { sucursal_id?, tipo?, parent_id?, es_picking?, es_recepcion?, activo?, bloqueada?, busqueda?, limit?, offset? }
 */
export function useUbicacionesAlmacen(params = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useQuery({
    queryKey: UBICACIONES_ALMACEN_KEYS.list(params),
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

      const response = await ordenesCompraApi.listarUbicaciones(sanitizedParams);
      return response.data.data || { ubicaciones: [], total: 0 };
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener árbol jerárquico de ubicaciones
 * @param {number} sucursalId - ID de la sucursal
 */
export function useArbolUbicaciones(sucursalId) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: UBICACIONES_ALMACEN_KEYS.arbol(efectiveSucursalId),
    queryFn: async () => {
      const response = await ordenesCompraApi.obtenerArbolUbicaciones(efectiveSucursalId);
      return response.data.data || [];
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener ubicación por ID
 * @param {number} id - ID de la ubicación
 */
export function useUbicacionAlmacen(id) {
  return useQuery({
    queryKey: UBICACIONES_ALMACEN_KEYS.detail(id),
    queryFn: async () => {
      const response = await ordenesCompraApi.obtenerUbicacion(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener stock de una ubicación
 * @param {number} ubicacionId - ID de la ubicación
 */
export function useStockUbicacion(ubicacionId) {
  return useQuery({
    queryKey: UBICACIONES_ALMACEN_KEYS.stock(ubicacionId),
    queryFn: async () => {
      const response = await ordenesCompraApi.obtenerStockUbicacion(ubicacionId);
      return response.data.data || [];
    },
    enabled: !!ubicacionId,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos (stock más volátil)
  });
}

/**
 * Hook para obtener ubicaciones disponibles para almacenar
 * @param {number} sucursalId - ID de la sucursal
 * @param {number} cantidad - Cantidad a almacenar
 */
export function useUbicacionesDisponibles(sucursalId, cantidad = 1) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: UBICACIONES_ALMACEN_KEYS.disponibles(efectiveSucursalId, cantidad),
    queryFn: async () => {
      const response = await ordenesCompraApi.obtenerUbicacionesDisponibles(efectiveSucursalId, { cantidad });
      return response.data.data || [];
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener estadísticas de ubicaciones
 * @param {number} sucursalId - ID de la sucursal
 */
export function useEstadisticasUbicaciones(sucursalId) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: UBICACIONES_ALMACEN_KEYS.estadisticas(efectiveSucursalId),
    queryFn: async () => {
      const response = await ordenesCompraApi.obtenerEstadisticasUbicaciones(efectiveSucursalId);
      return response.data.data || {};
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener ubicaciones donde está un producto
 * @param {number} productoId - ID del producto
 */
export function useUbicacionesProducto(productoId) {
  return useQuery({
    queryKey: UBICACIONES_ALMACEN_KEYS.productoUbicaciones(productoId),
    queryFn: async () => {
      const response = await ordenesCompraApi.obtenerUbicacionesProducto(productoId);
      return response.data.data || [];
    },
    enabled: !!productoId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para crear ubicación
 */
export function useCrearUbicacion() {
  const queryClient = useQueryClient();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        sucursal_id: data.sucursal_id || getSucursalId(),
        nombre: data.nombre?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
        parent_id: data.parent_id || undefined,
        capacidad_maxima: data.capacidad_maxima || undefined,
      };

      const response = await ordenesCompraApi.crearUbicacion(sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      const sucursalId = variables.sucursal_id || getSucursalId();
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.arbol(sucursalId));
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.estadisticas(sucursalId));
    },
    onError: createCRUDErrorHandler('create', 'Ubicación'),
  });
}

/**
 * Hook para actualizar ubicación
 */
export function useActualizarUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        ...data,
        nombre: data.nombre?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
        parent_id: data.parent_id || undefined,
        capacidad_maxima: data.capacidad_maxima || undefined,
      };

      const response = await ordenesCompraApi.actualizarUbicacion(id, sanitized);
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.detail(result.id));
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.arbol(result.sucursal_id));
    },
    onError: createCRUDErrorHandler('update', 'Ubicación'),
  });
}

/**
 * Hook para eliminar ubicación
 */
export function useEliminarUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await ordenesCompraApi.eliminarUbicacion(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.all);
    },
    onError: createCRUDErrorHandler('delete', 'Ubicación'),
  });
}

/**
 * Hook para bloquear/desbloquear ubicación
 */
export function useToggleBloqueoUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bloqueada, motivo_bloqueo }) => {
      const response = await ordenesCompraApi.toggleBloqueoUbicacion(id, {
        bloqueada,
        motivo_bloqueo: bloqueada ? motivo_bloqueo : undefined,
      });
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.detail(result.id));
    },
    onError: createCRUDErrorHandler('update', 'Bloqueo ubicación'),
  });
}

/**
 * Hook para agregar stock a una ubicación
 */
export function useAgregarStockUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ubicacionId, data }) => {
      const sanitized = {
        ...data,
        lote: data.lote?.trim() || undefined,
        fecha_vencimiento: data.fecha_vencimiento || undefined,
      };

      const response = await ordenesCompraApi.agregarStockUbicacion(ubicacionId, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.stock(variables.ubicacionId));
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: createCRUDErrorHandler('create', 'Stock en ubicación'),
  });
}

/**
 * Hook para mover stock entre ubicaciones
 */
export function useMoverStockUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        lote: data.lote?.trim() || undefined,
      };

      const response = await ordenesCompraApi.moverStockUbicacion(sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.stock(variables.ubicacion_origen_id));
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.stock(variables.ubicacion_destino_id));
      queryClient.invalidateQueries(UBICACIONES_ALMACEN_KEYS.all);
    },
    onError: createCRUDErrorHandler('update', 'Movimiento de stock'),
  });
}

// ==================== HOOK COMBINADO ====================

/**
 * Hook combinado para gestión de ubicaciones de almacén
 * @param {Object} options - { sucursalId }
 */
export function useUbicacionesAlmacenManager({ sucursalId } = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  // Queries
  const {
    data: arbol = [],
    isLoading: loadingArbol,
    error: errorArbol,
  } = useArbolUbicaciones(efectiveSucursalId);

  const {
    data: estadisticas = {},
    isLoading: loadingEstadisticas,
  } = useEstadisticasUbicaciones(efectiveSucursalId);

  // Mutations
  const crearMutation = useCrearUbicacion();
  const actualizarMutation = useActualizarUbicacion();
  const eliminarMutation = useEliminarUbicacion();
  const toggleBloqueoMutation = useToggleBloqueoUbicacion();
  const agregarStockMutation = useAgregarStockUbicacion();
  const moverStockMutation = useMoverStockUbicacion();

  return {
    // Data
    arbol,
    estadisticas,
    sucursalId: efectiveSucursalId,

    // Loading
    loadingArbol,
    loadingEstadisticas,
    isLoading: loadingArbol || loadingEstadisticas,

    // Errors
    errorArbol,
    hasError: !!errorArbol,

    // Mutations
    crear: crearMutation.mutateAsync,
    actualizar: actualizarMutation.mutateAsync,
    eliminar: eliminarMutation.mutateAsync,
    toggleBloqueo: toggleBloqueoMutation.mutateAsync,
    agregarStock: agregarStockMutation.mutateAsync,
    moverStock: moverStockMutation.mutateAsync,

    // Mutation states
    isCreating: crearMutation.isPending,
    isUpdating: actualizarMutation.isPending,
    isDeleting: eliminarMutation.isPending,
    isMovingStock: moverStockMutation.isPending,
  };
}

export default {
  useUbicacionesAlmacen,
  useArbolUbicaciones,
  useUbicacionAlmacen,
  useStockUbicacion,
  useUbicacionesDisponibles,
  useEstadisticasUbicaciones,
  useUbicacionesProducto,
  useCrearUbicacion,
  useActualizarUbicacion,
  useEliminarUbicacion,
  useToggleBloqueoUbicacion,
  useAgregarStockUbicacion,
  useMoverStockUbicacion,
  useUbicacionesAlmacenManager,
};
