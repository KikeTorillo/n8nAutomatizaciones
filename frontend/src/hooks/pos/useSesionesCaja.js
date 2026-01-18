import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { useSucursalContext } from '@/hooks/factories';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para obtener sesión de caja activa del usuario
 * @param {Object} params - { sucursal_id? }
 */
export function useSesionCajaActiva(params = {}) {
  const sucursalId = useSucursalContext(params.sucursal_id);

  return useQuery({
    queryKey: ['sesion-caja-activa', params],
    queryFn: async () => {
      const response = await posApi.obtenerSesionActiva({ sucursal_id: sucursalId });
      return response.data.data || { activa: false, sesion: null, totales: null };
    },
    staleTime: STALE_TIMES.MEDIUM,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para obtener sesión de caja por ID
 */
export function useSesionCaja(id) {
  return useQuery({
    queryKey: ['sesion-caja', id],
    queryFn: async () => {
      const response = await posApi.obtenerSesionCaja(id);
      return response.data.data || null;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener resumen de sesión para cierre
 */
export function useResumenSesionCaja(id) {
  return useQuery({
    queryKey: ['resumen-sesion-caja', id],
    queryFn: async () => {
      const response = await posApi.obtenerResumenSesion(id);
      return response.data.data || null;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para listar sesiones de caja con filtros
 * @param {Object} params - { sucursal_id?, usuario_id?, estado?, fecha_desde?, fecha_hasta?, limit?, offset? }
 */
export function useSesionesCaja(params = {}) {
  return useQuery({
    queryKey: ['sesiones-caja', params],
    queryFn: async () => {
      const response = await posApi.listarSesionesCaja(sanitizeParams(params));
      return response.data.data || { sesiones: [], total: 0 };
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para listar movimientos de una sesión
 */
export function useMovimientosCaja(sesionId) {
  return useQuery({
    queryKey: ['movimientos-caja', sesionId],
    queryFn: async () => {
      const response = await posApi.listarMovimientosCaja(sesionId);
      return response.data.data || [];
    },
    enabled: !!sesionId,
    staleTime: STALE_TIMES.SEMI_STATIC,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para abrir sesión de caja
 */
export function useAbrirSesionCaja() {
  const queryClient = useQueryClient();
  const defaultSucursalId = useSucursalContext();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        sucursal_id: data.sucursal_id || defaultSucursalId,
        monto_inicial: data.monto_inicial || 0,
        nota_apertura: data.nota_apertura?.trim() || undefined,
      };

      const response = await posApi.abrirSesionCaja(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesion-caja-activa'] });
      queryClient.invalidateQueries({ queryKey: ['sesiones-caja'] });
    },
    onError: createCRUDErrorHandler('create', 'Sesión de caja', {
      409: 'Ya existe una sesión de caja abierta',
    }),
  });
}

/**
 * Hook para cerrar sesión de caja
 */
export function useCerrarSesionCaja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        sesion_id: data.sesion_id,
        monto_contado: data.monto_contado,
        nota_cierre: data.nota_cierre?.trim() || undefined,
        desglose: data.desglose || undefined,
      };

      const response = await posApi.cerrarSesionCaja(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesion-caja-activa'] });
      queryClient.invalidateQueries({ queryKey: ['sesiones-caja'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-sesion-caja'] });
    },
    onError: createCRUDErrorHandler('update', 'Sesión de caja'),
  });
}

/**
 * Hook para registrar movimiento de efectivo (entrada/salida)
 */
export function useRegistrarMovimientoCaja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sesionId, data }) => {
      const sanitized = {
        tipo: data.tipo,
        monto: data.monto,
        motivo: data.motivo?.trim(),
      };

      const response = await posApi.registrarMovimientoCaja(sesionId, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sesion-caja-activa'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos-caja', variables.sesionId] });
      queryClient.invalidateQueries({ queryKey: ['resumen-sesion-caja', variables.sesionId] });
    },
    onError: createCRUDErrorHandler('create', 'Movimiento de caja', {
      404: 'Sesión de caja no encontrada o ya está cerrada',
    }),
  });
}
