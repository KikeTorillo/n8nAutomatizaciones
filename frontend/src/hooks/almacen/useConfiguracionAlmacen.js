/**
 * ====================================================================
 * HOOKS: Configuración de Almacén
 * ====================================================================
 * React Query hooks para configuración de rutas multietapa por sucursal
 * Pasos de recepción y envío, ubicaciones por defecto
 * Fecha: 31 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configuracionAlmacenApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { useToast } from '@/hooks/utils';

/**
 * QUERY KEYS para configuración de almacén
 */
export const CONFIGURACION_ALMACEN_KEYS = {
  all: ['configuracion-almacen'],
  list: () => [...CONFIGURACION_ALMACEN_KEYS.all, 'list'],
  detail: (sucursalId) => [...CONFIGURACION_ALMACEN_KEYS.all, 'detail', sucursalId],
  multietapa: (sucursalId, tipo) => [...CONFIGURACION_ALMACEN_KEYS.all, 'multietapa', sucursalId, tipo],
  descripciones: () => [...CONFIGURACION_ALMACEN_KEYS.all, 'descripciones'],
};

// ==================== QUERIES ====================

/**
 * Hook para listar configuraciones de todas las sucursales
 */
export function useConfiguracionesAlmacen() {
  return useQuery({
    queryKey: CONFIGURACION_ALMACEN_KEYS.list(),
    queryFn: async () => {
      const response = await configuracionAlmacenApi.listar();
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener configuración por sucursal
 * @param {number} sucursalId - ID de la sucursal
 */
export function useConfiguracionAlmacen(sucursalId) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: CONFIGURACION_ALMACEN_KEYS.detail(efectiveSucursalId),
    queryFn: async () => {
      const response = await configuracionAlmacenApi.obtenerPorSucursal(efectiveSucursalId);
      return response.data.data;
    },
    enabled: !!efectiveSucursalId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para verificar si la sucursal usa rutas multietapa
 * @param {number} sucursalId - ID de la sucursal
 * @param {string} tipo - 'recepcion' | 'envio' | undefined (ambos)
 */
export function useMultietapa(sucursalId, tipo) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: CONFIGURACION_ALMACEN_KEYS.multietapa(efectiveSucursalId, tipo),
    queryFn: async () => {
      const params = tipo ? { tipo } : {};
      const response = await configuracionAlmacenApi.verificarMultietapa(efectiveSucursalId, params);
      return response.data.data?.usa_multietapa;
    },
    enabled: !!efectiveSucursalId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener descripciones de los pasos disponibles
 */
export function useDescripcionesPasos() {
  return useQuery({
    queryKey: CONFIGURACION_ALMACEN_KEYS.descripciones(),
    queryFn: async () => {
      const response = await configuracionAlmacenApi.obtenerDescripcionesPasos();
      return response.data.data || { recepcion: {}, envio: {} };
    },
    staleTime: 1000 * 60 * 60, // 1 hora (no cambia)
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para actualizar configuración de sucursal
 */
export function useActualizarConfiguracion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ sucursalId, data }) => {
      // Limpiar valores vacíos
      const sanitized = { ...data };
      Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === '' || sanitized[key] === null) {
          sanitized[key] = undefined;
        }
      });

      const response = await configuracionAlmacenApi.actualizar(sucursalId, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(CONFIGURACION_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(CONFIGURACION_ALMACEN_KEYS.detail(variables.sucursalId));
      toast.success('Configuración de almacén actualizada');
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || 'Error al actualizar configuración';
      toast.error(backendMessage);
    },
  });
}

/**
 * Hook para crear ubicaciones por defecto
 * Automáticamente actualiza el cache con los IDs de ubicaciones creadas
 */
export function useCrearUbicacionesDefault() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (sucursalId) => {
      const response = await configuracionAlmacenApi.crearUbicacionesDefault(sucursalId);
      return response.data.data;
    },
    onSuccess: (data, sucursalId) => {
      // Invalidar lista de ubicaciones para que aparezcan en selectores
      queryClient.invalidateQueries(['ubicaciones-almacen']);

      // Actualizar cache de configuración con los nuevos IDs de ubicaciones
      if (data?.ubicaciones) {
        queryClient.setQueryData(
          CONFIGURACION_ALMACEN_KEYS.detail(sucursalId),
          (old) => old ? {
            ...old,
            ubicacion_recepcion_id: data.ubicaciones.recepcion || old.ubicacion_recepcion_id,
            ubicacion_qc_id: data.ubicaciones.qc || old.ubicacion_qc_id,
            ubicacion_stock_id: data.ubicaciones.stock || old.ubicacion_stock_id,
            ubicacion_picking_id: data.ubicaciones.picking || old.ubicacion_picking_id,
            ubicacion_empaque_id: data.ubicaciones.empaque || old.ubicacion_empaque_id,
            ubicacion_envio_id: data.ubicaciones.envio || old.ubicacion_envio_id,
          } : old
        );
      }

      // También invalidar para asegurar coherencia
      queryClient.invalidateQueries(CONFIGURACION_ALMACEN_KEYS.detail(sucursalId));
      toast.success('Ubicaciones por defecto creadas');
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message || 'Error al crear ubicaciones por defecto';
      toast.error(backendMessage);
    },
  });
}

// ==================== HOOK COMBINADO ====================

/**
 * Hook combinado para gestión de configuración de almacén
 * @param {Object} options - { sucursalId }
 */
export function useConfiguracionAlmacenManager({ sucursalId } = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  // Queries
  const {
    data: configuracion,
    isLoading: loadingConfiguracion,
    error: errorConfiguracion,
    refetch: refetchConfiguracion,
  } = useConfiguracionAlmacen(efectiveSucursalId);

  const {
    data: descripciones = { recepcion: {}, envio: {} },
    isLoading: loadingDescripciones,
  } = useDescripcionesPasos();

  const {
    data: multietapa,
    isLoading: loadingMultietapa,
  } = useMultietapa(efectiveSucursalId);

  // Mutations
  const actualizarMutation = useActualizarConfiguracion();
  const crearUbicacionesMutation = useCrearUbicacionesDefault();

  // Helpers
  const usaRecepcionMultietapa = typeof multietapa === 'object'
    ? multietapa?.recepcion
    : configuracion?.pasos_recepcion > 1;

  const usaEnvioMultietapa = typeof multietapa === 'object'
    ? multietapa?.envio
    : configuracion?.pasos_envio > 1;

  return {
    // Data
    configuracion,
    descripciones,
    sucursalId: efectiveSucursalId,

    // Helpers
    usaRecepcionMultietapa,
    usaEnvioMultietapa,
    usaAlgunaMultietapa: usaRecepcionMultietapa || usaEnvioMultietapa,

    // Loading
    loadingConfiguracion,
    loadingDescripciones,
    loadingMultietapa,
    isLoading: loadingConfiguracion || loadingDescripciones,

    // Errors
    errorConfiguracion,
    hasError: !!errorConfiguracion,

    // Actions
    refetch: refetchConfiguracion,
    actualizar: actualizarMutation.mutateAsync,
    crearUbicacionesDefault: crearUbicacionesMutation.mutateAsync,

    // Mutation states
    isUpdating: actualizarMutation.isPending,
    isCreatingUbicaciones: crearUbicacionesMutation.isPending,
  };
}

// ==================== CONSTANTES DE PASOS ====================

export const PASOS_RECEPCION = {
  DIRECTO: 1,
  DOS_PASOS: 2,
  TRES_PASOS: 3,
};

export const PASOS_ENVIO = {
  DIRECTO: 1,
  DOS_PASOS: 2,
  TRES_PASOS: 3,
};

export const LABELS_PASOS_RECEPCION = {
  [PASOS_RECEPCION.DIRECTO]: 'Directo a stock',
  [PASOS_RECEPCION.DOS_PASOS]: 'Recepción → Almacenamiento',
  [PASOS_RECEPCION.TRES_PASOS]: 'Recepción → Control Calidad → Almacenamiento',
};

export const LABELS_PASOS_ENVIO = {
  [PASOS_ENVIO.DIRECTO]: 'Directo desde stock',
  [PASOS_ENVIO.DOS_PASOS]: 'Picking → Envío',
  [PASOS_ENVIO.TRES_PASOS]: 'Picking → Empaque → Envío',
};

export const DESCRIPCIONES_PASOS_RECEPCION = {
  [PASOS_RECEPCION.DIRECTO]: 'La mercancía va directamente a la ubicación de stock',
  [PASOS_RECEPCION.DOS_PASOS]: 'La mercancía pasa por zona de recepción antes de almacenarse',
  [PASOS_RECEPCION.TRES_PASOS]: 'Incluye inspección de calidad antes del almacenamiento',
};

export const DESCRIPCIONES_PASOS_ENVIO = {
  [PASOS_ENVIO.DIRECTO]: 'El producto sale directamente de la ubicación de stock',
  [PASOS_ENVIO.DOS_PASOS]: 'Se realiza picking antes del envío',
  [PASOS_ENVIO.TRES_PASOS]: 'Incluye etapa de empaque antes del envío',
};

