import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { citasApi, inventarioApi, posApi, workflowsApi } from '@/services/api/endpoints';
import { useModulos } from './useModulos';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';

/**
 * Hook para obtener notificaciones/badges por aplicación
 * Usado en el App Home para mostrar indicadores visuales
 */
export function useAppNotifications() {
  const {
    tieneAgendamiento,
    tieneInventario,
    tienePOS,
  } = useModulos();

  // Obtener sucursalId para queries que lo requieren
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const sucursalId = getSucursalId();

  // Citas del día (solo pendientes/programadas)
  const { data: citasData } = useQuery({
    queryKey: ['app-notifications', 'citas-hoy'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await citasApi.obtenerPorFecha(today);
      // Ene 2026: API devuelve { citas: [...], meta: {...} }
      return response.data.data?.citas || [];
    },
    enabled: tieneAgendamiento,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });

  // Alertas de inventario (stock bajo)
  const { data: alertasData } = useQuery({
    queryKey: ['app-notifications', 'alertas-inventario'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerAlertas({ estado: 'activa' });
      return response.data.data?.alertas || [];
    },
    enabled: tieneInventario,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Refetch cada 10 minutos
  });

  // Ventas del día
  const { data: ventasData } = useQuery({
    queryKey: ['app-notifications', 'ventas-hoy', sucursalId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await posApi.obtenerVentas({
        fecha_inicio: today,
        fecha_fin: today,
        sucursalId, // Requerido para verificar permisos
      });
      return response.data.data?.ventas || [];
    },
    enabled: tienePOS && !!sucursalId,
    staleTime: STALE_TIMES.DYNAMIC,
    refetchInterval: 5 * 60 * 1000,
  });

  // Aprobaciones pendientes (workflows)
  const { data: aprobacionesCount } = useQuery({
    queryKey: ['app-notifications', 'aprobaciones-pendientes'],
    queryFn: async () => {
      const response = await workflowsApi.contarPendientes();
      return response.data.data?.total || 0;
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch cada minuto
  });

  // Calcular badges
  const citasPendientes = citasData?.filter(
    (c) => c.estado === 'programada' || c.estado === 'confirmada'
  ).length || 0;

  const alertasActivas = alertasData?.length || 0;

  const ventasHoy = ventasData?.length || 0;

  const aprobacionesPendientes = aprobacionesCount || 0;

  return {
    // Badges por app
    agendamiento: citasPendientes,
    inventario: alertasActivas,
    pos: ventasHoy,
    aprobaciones: aprobacionesPendientes,
    comisiones: 0, // Por ahora sin notificaciones
    chatbots: 0,
    marketplace: 0,

    // Datos raw por si se necesitan
    citasData,
    alertasData,
    ventasData,

    // Total de notificaciones
    total: citasPendientes + alertasActivas + aprobacionesPendientes,
  };
}

export default useAppNotifications;
