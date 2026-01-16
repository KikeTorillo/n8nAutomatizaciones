/**
 * useVacaciones - Hook de React Query para vacaciones
 * Fase 3 del Plan de Empleados Competitivo - Enero 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vacacionesApi } from '@/services/api/endpoints';
import { toast } from 'sonner';

// === Constantes ===

export const ESTADOS_SOLICITUD = {
  pendiente: { value: 'pendiente', label: 'Pendiente', color: 'yellow', icon: '⏳' },
  aprobada: { value: 'aprobada', label: 'Aprobada', color: 'green', icon: '✅' },
  rechazada: { value: 'rechazada', label: 'Rechazada', color: 'red', icon: '❌' },
  cancelada: { value: 'cancelada', label: 'Cancelada', color: 'gray', icon: '🚫' },
};

export const TIPOS_APROBADOR = {
  supervisor: { value: 'supervisor', label: 'Supervisor directo' },
  rrhh: { value: 'rrhh', label: 'Responsable de RRHH' },
  rol_especifico: { value: 'rol_especifico', label: 'Rol específico' },
};

export const TURNOS_MEDIO_DIA = {
  manana: { value: 'manana', label: 'Mañana (hasta 14:00)' },
  tarde: { value: 'tarde', label: 'Tarde (desde 14:00)' },
};

// Query Keys
const QUERY_KEYS = {
  politica: ['vacaciones', 'politica'],
  niveles: (filtros) => ['vacaciones', 'niveles', filtros],
  miSaldo: (anio) => ['vacaciones', 'mi-saldo', anio],
  saldos: (filtros) => ['vacaciones', 'saldos', filtros],
  misSolicitudes: (filtros) => ['vacaciones', 'mis-solicitudes', filtros],
  solicitudes: (filtros) => ['vacaciones', 'solicitudes', filtros],
  pendientes: (filtros) => ['vacaciones', 'pendientes', filtros],
  solicitud: (id) => ['vacaciones', 'solicitud', id],
  dashboard: (anio) => ['vacaciones', 'dashboard', anio],
  estadisticas: (filtros) => ['vacaciones', 'estadisticas', filtros],
};

// ==================== POLÍTICA ====================

/**
 * Obtener política de vacaciones
 */
export function usePoliticaVacaciones() {
  return useQuery({
    queryKey: QUERY_KEYS.politica,
    queryFn: async () => {
      const response = await vacacionesApi.obtenerPolitica();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Actualizar política de vacaciones
 */
export function useActualizarPoliticaVacaciones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.actualizarPolitica(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.politica });
      toast.success('Política de vacaciones actualizada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al actualizar política');
    },
  });
}

// ==================== NIVELES ====================

/**
 * Lista niveles de vacaciones
 */
export function useNivelesVacaciones(filtros = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.niveles(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarNiveles(filtros);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Crear nivel de vacaciones
 */
export function useCrearNivelVacaciones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.crearNivel(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'niveles'] });
      toast.success('Nivel creado correctamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al crear nivel');
    },
  });
}

/**
 * Actualizar nivel
 */
export function useActualizarNivelVacaciones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await vacacionesApi.actualizarNivel(id, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'niveles'] });
      toast.success('Nivel actualizado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al actualizar nivel');
    },
  });
}

/**
 * Eliminar nivel
 */
export function useEliminarNivelVacaciones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await vacacionesApi.eliminarNivel(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'niveles'] });
      toast.success('Nivel eliminado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al eliminar nivel');
    },
  });
}

/**
 * Crear niveles preset (México LFT o Colombia)
 */
export function useCrearNivelesPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.crearNivelesPreset(data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'niveles'] });
      const pais = variables.pais === 'mexico' ? 'México (LFT)' : 'Colombia';
      toast.success(`Niveles de ${pais} creados correctamente`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al crear niveles preset');
    },
  });
}

// ==================== SALDOS ====================

/**
 * Obtener mi saldo de vacaciones
 */
export function useMiSaldoVacaciones(anio = null) {
  return useQuery({
    queryKey: QUERY_KEYS.miSaldo(anio),
    queryFn: async () => {
      const response = await vacacionesApi.obtenerMiSaldo({ anio });
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Listar saldos de vacaciones (admin)
 */
export function useSaldosVacaciones(filtros = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.saldos(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarSaldos(filtros);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Ajustar saldo manualmente
 */
export function useAjustarSaldo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dias_ajuste, motivo }) => {
      const response = await vacacionesApi.ajustarSaldo(id, { dias_ajuste, motivo });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'saldos'] });
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'mi-saldo'] });
      toast.success('Saldo ajustado correctamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al ajustar saldo');
    },
  });
}

/**
 * Generar saldos para un año
 */
export function useGenerarSaldosAnio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.generarSaldosAnio(data);
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'saldos'] });
      toast.success(`Saldos generados: ${result.creados} nuevos, ${result.actualizados} actualizados`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al generar saldos');
    },
  });
}

// ==================== SOLICITUDES ====================

/**
 * Crear solicitud de vacaciones
 */
export function useCrearSolicitudVacaciones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.crearSolicitud(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'mis-solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'mi-saldo'] });
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'dashboard'] });
      toast.success('Solicitud de vacaciones enviada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al crear solicitud');
    },
  });
}

/**
 * Listar mis solicitudes
 */
export function useMisSolicitudesVacaciones(filtros = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.misSolicitudes(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarMisSolicitudes(filtros);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Listar todas las solicitudes (admin)
 */
export function useSolicitudesVacaciones(filtros = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.solicitudes(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarSolicitudes(filtros);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para obtener solicitudes para el calendario de equipo
 * Ene 2026: Soporta filtros de fecha_inicio, fecha_fin, estado, departamento_id
 * @param {Object} filtros - { fecha_inicio, fecha_fin, estado, departamento_id }
 */
export function useSolicitudesCalendario(filtros = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.solicitudes({ ...filtros, tipo: 'calendario' }),
    queryFn: async () => {
      const params = {
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
        estado: filtros.estado || undefined,
        departamento_id: filtros.departamento_id || undefined,
        limit: 100, // Máximo permitido por el backend
      };
      const response = await vacacionesApi.listarSolicitudes(params);
      return response.data.data || [];
    },
    enabled: !!filtros.fecha_inicio && !!filtros.fecha_fin,
    staleTime: 30 * 1000,
    keepPreviousData: true, // Suaviza transiciones al cambiar mes
  });
}

/**
 * Listar solicitudes pendientes
 */
export function useSolicitudesPendientes(filtros = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.pendientes(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.listarPendientes(filtros);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Obtener solicitud por ID
 */
export function useSolicitudVacaciones(id) {
  return useQuery({
    queryKey: QUERY_KEYS.solicitud(id),
    queryFn: async () => {
      const response = await vacacionesApi.obtenerSolicitud(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Aprobar solicitud
 */
export function useAprobarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notas_internas }) => {
      const response = await vacacionesApi.aprobarSolicitud(id, { notas_internas });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones'] });
      toast.success('Solicitud aprobada. Se ha creado el bloqueo en el calendario.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al aprobar solicitud');
    },
  });
}

/**
 * Rechazar solicitud
 */
export function useRechazarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo_rechazo, notas_internas }) => {
      const response = await vacacionesApi.rechazarSolicitud(id, { motivo_rechazo, notas_internas });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones'] });
      toast.success('Solicitud rechazada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al rechazar solicitud');
    },
  });
}

/**
 * Cancelar solicitud
 */
export function useCancelarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }) => {
      const response = await vacacionesApi.cancelarSolicitud(id, { motivo });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones'] });
      toast.success('Solicitud cancelada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al cancelar solicitud');
    },
  });
}

// ==================== DASHBOARD ====================

/**
 * Obtener dashboard de vacaciones del usuario
 */
export function useDashboardVacaciones(anio = null) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard(anio),
    queryFn: async () => {
      const response = await vacacionesApi.obtenerDashboard({ anio });
      return response.data.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Obtener estadísticas generales (admin)
 */
export function useEstadisticasVacaciones(filtros = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.estadisticas(filtros),
    queryFn: async () => {
      const response = await vacacionesApi.obtenerEstadisticas(filtros);
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minuto
  });
}

// ==================== UTILIDADES ====================

/**
 * Obtiene la configuración visual de un estado
 */
export function getEstadoSolicitud(estado) {
  return ESTADOS_SOLICITUD[estado] || ESTADOS_SOLICITUD.pendiente;
}

/**
 * Formatea días de vacaciones
 */
export function formatDias(dias) {
  if (dias === null || dias === undefined) return '-';
  const num = parseFloat(dias);
  if (num === 1) return '1 día';
  if (num === 0.5) return '½ día';
  return `${num} días`;
}

/**
 * Calcula progreso hacia siguiente nivel
 */
export function calcularProgresoNivel(nivelInfo) {
  if (!nivelInfo || !nivelInfo.anios_para_siguiente) return null;

  const aniosEnNivel = nivelInfo.anios_antiguedad;
  const aniosParaSiguiente = parseFloat(nivelInfo.anios_para_siguiente);
  const total = aniosEnNivel + aniosParaSiguiente;

  return {
    porcentaje: Math.min(100, (aniosEnNivel / total) * 100),
    aniosFaltantes: aniosParaSiguiente,
    diasSiguienteNivel: nivelInfo.dias_siguiente_nivel,
  };
}

export default {
  // Política
  usePoliticaVacaciones,
  useActualizarPoliticaVacaciones,

  // Niveles
  useNivelesVacaciones,
  useCrearNivelVacaciones,
  useActualizarNivelVacaciones,
  useEliminarNivelVacaciones,
  useCrearNivelesPreset,

  // Saldos
  useMiSaldoVacaciones,
  useSaldosVacaciones,
  useAjustarSaldo,
  useGenerarSaldosAnio,

  // Solicitudes
  useCrearSolicitudVacaciones,
  useMisSolicitudesVacaciones,
  useSolicitudesVacaciones,
  useSolicitudesCalendario,
  useSolicitudesPendientes,
  useSolicitudVacaciones,
  useAprobarSolicitud,
  useRechazarSolicitud,
  useCancelarSolicitud,

  // Dashboard
  useDashboardVacaciones,
  useEstadisticasVacaciones,

  // Constantes
  ESTADOS_SOLICITUD,
  TIPOS_APROBADOR,
  TURNOS_MEDIO_DIA,

  // Utilidades
  getEstadoSolicitud,
  formatDias,
  calcularProgresoNivel,
};
