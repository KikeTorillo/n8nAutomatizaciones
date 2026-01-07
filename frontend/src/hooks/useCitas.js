import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { citasApi } from '@/services/api/endpoints';
import { useToast } from './useToast';
import { aFormatoISO } from '@/utils/dateHelpers';
import useSucursalStore from '@/store/sucursalStore';

/**
 * Hooks personalizados para gestión de citas
 * Sigue el patrón de useServicios.js y useProfesionales.js
 * ✅ FEATURE: Multi-sucursal - Los hooks inyectan sucursal_id automáticamente
 */

// ==================== QUERY HOOKS ====================

/**
 * Hook para listar citas con filtros
 * @param {Object} params - Filtros: { fecha_desde, fecha_hasta, profesional_id, estado, cliente_id, servicio_id }
 * @returns {Object} { data, isLoading, error, refetch }
 *
 * @example
 * const { data: citas, isLoading } = useCitas({
 *   fecha_desde: '2025-10-01',
 *   fecha_hasta: '2025-10-31',
 *   estado: 'pendiente'
 * });
 */
export function useCitas(params = {}) {
  return useQuery({
    queryKey: ['citas', params],
    queryFn: async () => {
      // Sanitizar parámetros: eliminar valores vacíos (backend Joi los rechaza)
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        // Solo incluir valores que no sean undefined, null, o string vacío
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await citasApi.listar(sanitizedParams);
      // Backend usa ResponseHelper: { success, data: { citas: [...], meta: {...} } }
      return response.data?.data?.citas || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (las citas cambian frecuentemente)
    enabled: true,
  });
}

/**
 * Hook para obtener una cita específica por ID
 * @param {number} id - ID de la cita
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: cita, isLoading } = useCita(123);
 */
export function useCita(id) {
  return useQuery({
    queryKey: ['citas', id],
    queryFn: async () => {
      const response = await citasApi.obtener(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener citas del día actual
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: citasHoy, isLoading } = useCitasDelDia();
 */
export function useCitasDelDia() {
  // ✅ FIX: Usar fecha LOCAL en vez de UTC para evitar problemas de zona horaria
  // ANTES (BUG): new Date().toISOString().split('T')[0] → convierte a UTC
  // AHORA: aFormatoISO() usa date-fns format() que respeta zona horaria local
  const hoy = aFormatoISO(new Date());

  return useQuery({
    queryKey: ['citas', 'hoy', hoy],
    queryFn: async () => {
      const response = await citasApi.listar({
        fecha_desde: hoy,
        fecha_hasta: hoy,
      });
      // Backend usa ResponseHelper: { success, data: { citas: [...], meta: {...} } }
      return response.data?.data?.citas || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minuto (muy dinámica)
    refetchInterval: 2 * 60 * 1000, // Refetch cada 2 minutos
  });
}

/**
 * Hook para obtener citas pendientes
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: citasPendientes } = useCitasPendientes();
 */
export function useCitasPendientes() {
  return useQuery({
    queryKey: ['citas', 'pendientes'],
    queryFn: async () => {
      const response = await citasApi.listar({ estado: 'pendiente' });
      // Backend usa ResponseHelper: { success, data: { citas: [...], meta: {...} } }
      return response.data?.data?.citas || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Hook para crear una nueva cita
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const createMutation = useCrearCita();
 *
 * const handleCrear = () => {
 *   createMutation.mutate({
 *     cliente_id: 1,
 *     profesional_id: 2,
 *     servicio_id: 3,
 *     fecha_cita: '2025-10-17',
 *     hora_inicio: '10:00:00',
 *     hora_fin: '10:30:00',
 *   });
 * };
 */
export function useCrearCita() {
  const queryClient = useQueryClient();
  // ✅ Multi-sucursal: Obtener sucursal activa del store
  const { getSucursalId } = useSucursalStore();

  return useMutation({
    mutationFn: async (citaData) => {
      // Sanitizar campos opcionales (convertir string vacío a undefined)
      const sanitizedData = {
        ...citaData,
        notas_cliente: citaData.notas_cliente?.trim() || undefined,
        notas_internas: citaData.notas_internas?.trim() || undefined,
        descuento: citaData.descuento || 0,
        // ✅ Multi-sucursal: Inyectar sucursal_id automáticamente si hay una activa
        sucursal_id: citaData.sucursal_id || getSucursalId() || undefined,
      };

      const response = await citasApi.crear(sanitizedData);
      return response.data;
    },
    onSuccess: () => {
      // Solo invalidar queries - El componente maneja el feedback al usuario
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
    // No onError - El componente maneja errores de manera contextual
  });
}

/**
 * Hook para actualizar una cita existente
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const updateMutation = useActualizarCita();
 *
 * const handleActualizar = () => {
 *   updateMutation.mutate({
 *     id: 123,
 *     notas_cliente: 'Cliente prefiere corte más corto',
 *   });
 * };
 */
export function useActualizarCita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...citaData }) => {
      // Sanitizar campos opcionales
      const sanitizedData = {
        ...citaData,
        notas_cliente: citaData.notas_cliente?.trim() || undefined,
        notas_profesional: citaData.notas_profesional?.trim() || undefined,
        notas_internas: citaData.notas_internas?.trim() || undefined,
      };

      const response = await citasApi.actualizar(id, sanitizedData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Solo invalidar queries - El componente maneja el feedback al usuario
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });
    },
    // No onError - El componente maneja errores de manera contextual
  });
}

/**
 * Hook para cancelar una cita
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const cancelMutation = useCancelarCita();
 *
 * const handleCancelar = () => {
 *   cancelMutation.mutate({
 *     id: 123,
 *     motivo_cancelacion: 'Cliente solicitó reprogramar',
 *   });
 * };
 */
export function useCancelarCita() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo_cancelacion }) => {
      const response = await citasApi.cancelar(id, { motivo_cancelacion });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });

      success('Cita cancelada exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al cancelar la cita';
      showError(mensaje);
    },
  });
}

/**
 * Hook para confirmar una cita
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const confirmMutation = useConfirmarCita();
 *
 * const handleConfirmar = () => {
 *   confirmMutation.mutate({ id: 123 });
 * };
 */
export function useConfirmarCita() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id }) => {
      const response = await citasApi.confirmar(id);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });

      success('Cita confirmada exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al confirmar la cita';
      showError(mensaje);
    },
  });
}

/**
 * Hook para iniciar una cita (cambiar a estado en_curso)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const iniciarMutation = useIniciarCita();
 *
 * const handleIniciar = () => {
 *   iniciarMutation.mutate({ id: 123 });
 * };
 */
export function useIniciarCita() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id }) => {
      const response = await citasApi.iniciar(id);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });

      success('Cita iniciada');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al iniciar la cita';
      showError(mensaje);
    },
  });
}

/**
 * Hook para completar una cita
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const completarMutation = useCompletarCita();
 *
 * const handleCompletar = () => {
 *   completarMutation.mutate({
 *     id: 123,
 *     notas_profesional: 'Servicio completado sin novedades',
 *   });
 * };
 */
export function useCompletarCita() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const sanitizedData = {
        ...data,
        notas_profesional: data.notas_profesional?.trim() || undefined,
        comentario_profesional: data.comentario_profesional?.trim() || undefined,
      };

      const response = await citasApi.completar(id, sanitizedData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });

      success('Cita completada exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al completar la cita';
      showError(mensaje);
    },
  });
}

/**
 * Hook para marcar una cita como no show (cliente no llegó)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const noShowMutation = useNoShowCita();
 *
 * const handleNoShow = () => {
 *   noShowMutation.mutate({
 *     id: 123,
 *     motivo: 'Cliente no llegó y no avisó',
 *   });
 * };
 */
export function useNoShowCita() {
  const queryClient = useQueryClient();
  const { warning, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo }) => {
      const response = await citasApi.noShow(id, { motivo });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });

      warning('Cita marcada como No Show');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al marcar como No Show';
      showError(mensaje);
    },
  });
}

// ==================== HOOKS ADICIONALES ====================

/**
 * Hook para crear una cita walk-in (cliente sin cita previa)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const walkInMutation = useCrearCitaWalkIn();
 *
 * const handleWalkIn = () => {
 *   walkInMutation.mutate({
 *     cliente_id: 1,
 *     profesional_id: 2,
 *     servicio_id: 3,
 *     tiempo_espera_aceptado: true,
 *     notas_walk_in: 'Cliente llegó sin cita',
 *   });
 * };
 */
export function useCrearCitaWalkIn() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  // ✅ Multi-sucursal: Obtener sucursal activa del store
  const { getSucursalId } = useSucursalStore();

  return useMutation({
    mutationFn: async (citaData) => {
      // ✅ Multi-sucursal: Inyectar sucursal_id automáticamente
      const dataConSucursal = {
        ...citaData,
        sucursal_id: citaData.sucursal_id || getSucursalId() || undefined,
      };
      const response = await citasApi.crearWalkIn(dataConSucursal);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      success('Cita walk-in creada exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al crear cita walk-in';
      showError(mensaje);
    },
  });
}

/**
 * Hook para consultar disponibilidad inmediata para walk-in
 * @param {Object} params - { servicio_id, profesional_id }
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: disponibilidad } = useDisponibilidadInmediata({
 *   servicio_id: 3,
 *   profesional_id: 2,
 * });
 */
export function useDisponibilidadInmediata(params) {
  return useQuery({
    queryKey: ['disponibilidad-inmediata', params],
    queryFn: async () => {
      const response = await citasApi.disponibilidadInmediata(params);
      return response.data;
    },
    enabled: !!(params?.servicio_id && params?.profesional_id),
    staleTime: 30 * 1000, // 30 segundos (muy dinámica)
  });
}

/**
 * Hook para enviar recordatorio de cita
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const recordatorioMutation = useEnviarRecordatorio();
 *
 * const handleEnviarRecordatorio = () => {
 *   recordatorioMutation.mutate({ id: 123 });
 * };
 */
export function useEnviarRecordatorio() {
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id }) => {
      const response = await citasApi.enviarRecordatorio(id);
      return response.data;
    },
    onSuccess: () => {
      success('Recordatorio enviado por WhatsApp');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al enviar recordatorio';
      showError(mensaje);
    },
  });
}

/**
 * Hook para obtener historial de recordatorios de una cita
 * @param {number} citaId - ID de la cita
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: recordatorios } = useRecordatorios(123);
 */
export function useRecordatorios(citaId) {
  return useQuery({
    queryKey: ['citas', citaId, 'recordatorios'],
    queryFn: async () => {
      const response = await citasApi.obtenerRecordatorios(citaId);
      return response.data;
    },
    enabled: !!citaId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ==================== CITAS RECURRENTES ====================

/**
 * Hook para crear una serie de citas recurrentes
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const crearRecurrenteMutation = useCrearCitaRecurrente();
 *
 * crearRecurrenteMutation.mutate({
 *   cliente_id: 1,
 *   profesional_id: 2,
 *   servicios_ids: [3],
 *   fecha_cita: '2026-01-15',
 *   hora_inicio: '10:00:00',
 *   hora_fin: '10:30:00',
 *   es_recurrente: true,
 *   patron_recurrencia: {
 *     frecuencia: 'semanal',
 *     dias_semana: [3],
 *     intervalo: 1,
 *     termina_en: 'cantidad',
 *     cantidad_citas: 12
 *   }
 * });
 */
export function useCrearCitaRecurrente() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const { getSucursalId } = useSucursalStore();

  return useMutation({
    mutationFn: async (citaData) => {
      const sanitizedData = {
        ...citaData,
        notas_cliente: citaData.notas_cliente?.trim() || undefined,
        notas_internas: citaData.notas_internas?.trim() || undefined,
        sucursal_id: citaData.sucursal_id || getSucursalId() || undefined,
      };

      const response = await citasApi.crearRecurrente(sanitizedData);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      success(`Serie creada: ${data.citas_creadas?.length || 0} citas`);
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al crear serie recurrente';
      showError(mensaje);
    },
  });
}

/**
 * Hook para obtener todas las citas de una serie recurrente
 * @param {string} serieId - UUID de la serie
 * @param {Object} options - { incluir_canceladas: boolean }
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: serie } = useSerieCitas('uuid-serie-id', { incluir_canceladas: false });
 */
export function useSerieCitas(serieId, options = {}) {
  return useQuery({
    queryKey: ['citas', 'serie', serieId, options],
    queryFn: async () => {
      const response = await citasApi.obtenerSerie(serieId, options);
      return response.data?.data || response.data;
    },
    enabled: !!serieId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para cancelar todas las citas pendientes de una serie
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const cancelarSerieMutation = useCancelarSerie();
 *
 * cancelarSerieMutation.mutate({
 *   serieId: 'uuid-serie-id',
 *   motivo_cancelacion: 'Cliente solicitó cancelar tratamiento',
 *   cancelar_solo_pendientes: true
 * });
 */
export function useCancelarSerie() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ serieId, ...opciones }) => {
      const response = await citasApi.cancelarSerie(serieId, opciones);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      success(`${data.citas_canceladas || 0} citas canceladas`);
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al cancelar serie';
      showError(mensaje);
    },
  });
}

/**
 * Hook para obtener preview de fechas disponibles para serie recurrente
 * @returns {Object} { mutate, mutateAsync, isLoading, error, data }
 *
 * @example
 * const previewMutation = usePreviewRecurrencia();
 *
 * previewMutation.mutate({
 *   fecha_inicio: '2026-01-15',
 *   hora_inicio: '10:00:00',
 *   duracion_minutos: 30,
 *   profesional_id: 2,
 *   patron_recurrencia: {
 *     frecuencia: 'semanal',
 *     intervalo: 1,
 *     termina_en: 'cantidad',
 *     cantidad_citas: 12
 *   }
 * });
 */
export function usePreviewRecurrencia() {
  return useMutation({
    mutationFn: async (datos) => {
      const response = await citasApi.previewRecurrencia(datos);
      return response.data?.data || response.data;
    },
  });
}

// ==================== HOOKS DE BÚSQUEDA Y FILTRADO ====================

/**
 * Hook para buscar citas por código o cliente
 * @param {string} termino - Término de búsqueda
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: resultados } = useBuscarCitas('Juan');
 */
export function useBuscarCitas(termino) {
  return useQuery({
    queryKey: ['citas', 'buscar', termino],
    queryFn: async () => {
      const response = await citasApi.listar({ busqueda: termino });
      // Backend usa ResponseHelper: { success, data: { citas: [...], meta: {...} } }
      return response.data?.data?.citas || [];
    },
    enabled: termino && termino.length >= 2,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para obtener citas de un profesional en un rango de fechas
 * @param {Object} params - { profesional_id, fecha_desde, fecha_hasta }
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: citasProfesional } = useCitasPorProfesional({
 *   profesional_id: 2,
 *   fecha_desde: '2025-10-01',
 *   fecha_hasta: '2025-10-31',
 * });
 */
export function useCitasPorProfesional(params) {
  return useQuery({
    queryKey: ['citas', 'profesional', params],
    queryFn: async () => {
      const response = await citasApi.listar(params);
      // Backend usa ResponseHelper: { success, data: { citas: [...], meta: {...} } }
      return response.data?.data?.citas || [];
    },
    enabled: !!params?.profesional_id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener citas de un cliente
 * @param {number} clienteId - ID del cliente
 * @returns {Object} { data, isLoading, error }
 *
 * @example
 * const { data: citasCliente } = useCitasPorCliente(1);
 */
export function useCitasPorCliente(clienteId) {
  return useQuery({
    queryKey: ['citas', 'cliente', clienteId],
    queryFn: async () => {
      const response = await citasApi.listar({ cliente_id: clienteId });
      // Backend usa ResponseHelper: { success, data: { citas: [...], meta: {...} } }
      return response.data?.data?.citas || [];
    },
    enabled: !!clienteId,
    staleTime: 2 * 60 * 1000,
  });
}

export default {
  // Query hooks
  useCitas,
  useCita,
  useCitasDelDia,
  useCitasPendientes,

  // Mutation hooks - CRUD
  useCrearCita,
  useActualizarCita,
  useCancelarCita,

  // Mutation hooks - Estados
  useConfirmarCita,
  useIniciarCita,
  useCompletarCita,
  useNoShowCita,

  // Mutation hooks - Adicionales
  useCrearCitaWalkIn,
  useEnviarRecordatorio,

  // Query hooks - Adicionales
  useDisponibilidadInmediata,
  useRecordatorios,
  useBuscarCitas,
  useCitasPorProfesional,
  useCitasPorCliente,

  // Citas Recurrentes
  useCrearCitaRecurrente,
  useSerieCitas,
  useCancelarSerie,
  usePreviewRecurrencia,
};
