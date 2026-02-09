import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { useSucursalContext } from '@/hooks/factories';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { TipoMovimientoCaja } from '@/types/entities';

// ========================================================================
// INTERFACES LOCALES
// ========================================================================

interface SesionCajaActivaParams {
  sucursal_id?: number;
}

interface AbrirSesionData {
  sucursal_id?: number;
  monto_inicial?: number;
  nota_apertura?: string;
}

interface CerrarSesionData {
  sesion_id: number;
  monto_contado: number;
  nota_cierre?: string;
  desglose?: Record<string, unknown>;
}

interface RegistrarMovimientoData {
  sesionId: number;
  data: {
    tipo: TipoMovimientoCaja;
    monto: number;
    motivo?: string;
  };
}

/**
 * Hook para obtener sesion de caja activa del usuario
 */
export function useSesionCajaActiva(params: SesionCajaActivaParams = {}) {
  const sucursalId = useSucursalContext(params.sucursal_id);

  return useQuery({
    queryKey: queryKeys.pos.sesionCaja.activa(params),
    queryFn: async () => {
      const response = await posApi.obtenerSesionActiva({ sucursal_id: sucursalId || undefined });
      return (response as any).data.data || { activa: false, sesion: null, totales: null };
    },
    staleTime: STALE_TIMES.MEDIUM,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para obtener sesion de caja por ID
 */
export function useSesionCaja(id: number | undefined | null) {
  return useQuery({
    queryKey: queryKeys.pos.sesionCaja.detail(id),
    queryFn: async () => {
      const response = await posApi.obtenerSesionCaja(id!);
      return (response as any).data.data || null;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener resumen de sesion para cierre
 */
export function useResumenSesionCaja(id: number | undefined | null) {
  return useQuery({
    queryKey: queryKeys.pos.sesionCaja.resumen(id),
    queryFn: async () => {
      const response = await posApi.obtenerResumenSesion(id!);
      return (response as any).data.data || null;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para listar sesiones de caja con filtros
 */
export function useSesionesCaja(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.pos.sesionCaja.historial(params),
    queryFn: async () => {
      const response = await posApi.listarSesionesCaja(sanitizeParams(params));
      return (response as any).data.data || { sesiones: [], total: 0 };
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para listar movimientos de una sesion
 */
export function useMovimientosCaja(sesionId: number | undefined | null) {
  return useQuery({
    queryKey: queryKeys.pos.sesionCaja.movimientos(sesionId),
    queryFn: async () => {
      const response = await posApi.listarMovimientosCaja(sesionId!);
      return (response as any).data.data || [];
    },
    enabled: !!sesionId,
    staleTime: STALE_TIMES.SEMI_STATIC,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para abrir sesion de caja
 */
export function useAbrirSesionCaja() {
  const queryClient = useQueryClient();
  const defaultSucursalId = useSucursalContext();

  return useMutation({
    mutationFn: async (data: AbrirSesionData) => {
      const sanitized = {
        sucursal_id: data.sucursal_id || defaultSucursalId || undefined,
        monto_inicial: data.monto_inicial || 0,
        nota_apertura: data.nota_apertura?.trim() || undefined,
      };

      const response = await posApi.abrirSesionCaja(sanitized as any);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.sesionCaja.activaBase, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.sesionCaja.historialBase, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Sesion de caja', {
      409: 'Ya existe una sesion de caja abierta',
    }),
  });
}

/**
 * Hook para cerrar sesion de caja
 */
export function useCerrarSesionCaja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CerrarSesionData) => {
      const sanitized = {
        sesion_id: data.sesion_id,
        monto_contado: data.monto_contado,
        nota_cierre: data.nota_cierre?.trim() || undefined,
        desglose: data.desglose || undefined,
      };

      const response = await posApi.cerrarSesionCaja(sanitized);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.sesionCaja.activaBase, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.sesionCaja.historialBase, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.sesionCaja.resumenBase, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Sesion de caja'),
  });
}

/**
 * Hook para registrar movimiento de efectivo (entrada/salida)
 */
export function useRegistrarMovimientoCaja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sesionId, data }: RegistrarMovimientoData) => {
      const sanitized = {
        tipo: data.tipo,
        monto: data.monto,
        motivo: data.motivo?.trim() || undefined,
      };

      const response = await posApi.registrarMovimientoCaja(sesionId, sanitized as any);
      return (response as any).data.data;
    },
    onSuccess: (_: unknown, variables: RegistrarMovimientoData) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.sesionCaja.activaBase, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.sesionCaja.movimientos(variables.sesionId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.sesionCaja.resumen(variables.sesionId), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Movimiento de caja', {
      404: 'Sesion de caja no encontrada o ya esta cerrada',
    }),
  });
}
