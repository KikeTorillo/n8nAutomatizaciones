/**
 * useIncapacidades - Hooks para gestión de incapacidades médicas
 * Enero 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incapacidadesApi } from '@/services/api/endpoints';
import { useToast } from '../utils/useToast';

// ==================== CONSTANTES ====================

export const TIPOS_INCAPACIDAD = {
  ENFERMEDAD_GENERAL: 'enfermedad_general',
  MATERNIDAD: 'maternidad',
  RIESGO_TRABAJO: 'riesgo_trabajo',
};

export const TIPOS_INCAPACIDAD_CONFIG = {
  enfermedad_general: {
    codigo: 'enfermedad_general',
    label: 'Enfermedad General',
    maxSemanas: 52,
    porcentajePago: 60,
    diaInicioPago: 4,
    descripcion: 'Enfermedades no relacionadas al trabajo',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
  },
  maternidad: {
    codigo: 'maternidad',
    label: 'Maternidad',
    diasFijos: 84,
    porcentajePago: 100,
    diaInicioPago: 1,
    descripcion: '42 días antes y 42 días después del parto',
    color: 'pink',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    textColor: 'text-pink-700 dark:text-pink-300',
  },
  riesgo_trabajo: {
    codigo: 'riesgo_trabajo',
    label: 'Riesgo de Trabajo',
    maxSemanas: null,
    porcentajePago: 100,
    diaInicioPago: 1,
    descripcion: 'Accidentes o enfermedades laborales',
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-300',
  },
};

export const ESTADOS_INCAPACIDAD = {
  ACTIVA: 'activa',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
};

export const ESTADOS_INCAPACIDAD_CONFIG = {
  activa: {
    label: 'Activa',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
  },
  finalizada: {
    label: 'Finalizada',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
  },
  cancelada: {
    label: 'Cancelada',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
  },
};

// ==================== UTILIDADES ====================

/**
 * Obtiene la configuración de un tipo de incapacidad
 */
export function getTipoIncapacidadConfig(tipo) {
  return TIPOS_INCAPACIDAD_CONFIG[tipo] || {
    label: tipo,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  };
}

/**
 * Obtiene la configuración de un estado de incapacidad
 */
export function getEstadoIncapacidadConfig(estado) {
  return ESTADOS_INCAPACIDAD_CONFIG[estado] || {
    label: estado,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  };
}

/**
 * Formatea días de incapacidad
 */
export function formatDiasIncapacidad(dias) {
  if (dias === 1) return '1 día';
  return `${dias} días`;
}

// ==================== HOOKS DE CONSULTA ====================

/**
 * Lista incapacidades (admin)
 */
export function useIncapacidades(filtros = {}, opciones = {}) {
  return useQuery({
    queryKey: ['incapacidades', filtros],
    queryFn: async () => {
      const response = await incapacidadesApi.listar(filtros);
      return response.data;
    },
    ...opciones,
  });
}

/**
 * Lista mis incapacidades (empleado)
 */
export function useMisIncapacidades(filtros = {}, opciones = {}) {
  return useQuery({
    queryKey: ['incapacidades', 'mis', filtros],
    queryFn: async () => {
      const response = await incapacidadesApi.listarMis(filtros);
      return response.data;
    },
    ...opciones,
  });
}

/**
 * Obtiene una incapacidad por ID
 */
export function useIncapacidad(id, opciones = {}) {
  return useQuery({
    queryKey: ['incapacidades', id],
    queryFn: async () => {
      const response = await incapacidadesApi.obtener(id);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    ...opciones,
  });
}

/**
 * Obtiene incapacidades activas de un profesional
 */
export function useIncapacidadesActivasProfesional(profesionalId, opciones = {}) {
  return useQuery({
    queryKey: ['incapacidades', 'activas', profesionalId],
    queryFn: async () => {
      const response = await incapacidadesApi.obtenerActivasPorProfesional(profesionalId);
      return response.data?.data || response.data || [];
    },
    enabled: !!profesionalId,
    ...opciones,
  });
}

/**
 * Obtiene estadísticas de incapacidades
 */
export function useEstadisticasIncapacidades(filtros = {}, opciones = {}) {
  return useQuery({
    queryKey: ['incapacidades', 'estadisticas', filtros],
    queryFn: async () => {
      const response = await incapacidadesApi.obtenerEstadisticas(filtros);
      return response.data?.data || response.data;
    },
    ...opciones,
  });
}

// ==================== HOOKS DE MUTACIÓN ====================

/**
 * Crear nueva incapacidad
 */
export function useCrearIncapacidad() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await incapacidadesApi.crear(data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incapacidades'] });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] });
      success('Incapacidad registrada correctamente');
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al registrar incapacidad');
    },
  });
}

/**
 * Actualizar incapacidad
 */
export function useActualizarIncapacidad() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await incapacidadesApi.actualizar(id, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incapacidades'] });
      queryClient.invalidateQueries({ queryKey: ['incapacidades', variables.id] });
      success('Incapacidad actualizada correctamente');
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al actualizar incapacidad');
    },
  });
}

/**
 * Finalizar incapacidad anticipadamente
 */
export function useFinalizarIncapacidad() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data = {} }) => {
      const response = await incapacidadesApi.finalizar(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incapacidades'] });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      success('Incapacidad finalizada correctamente');
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al finalizar incapacidad');
    },
  });
}

/**
 * Cancelar incapacidad
 */
export function useCancelarIncapacidad() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo_cancelacion }) => {
      const response = await incapacidadesApi.cancelar(id, { motivo_cancelacion });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incapacidades'] });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] });
      success('Incapacidad cancelada correctamente');
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al cancelar incapacidad');
    },
  });
}

/**
 * Crear prórroga de incapacidad
 */
export function useCrearProrroga() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await incapacidadesApi.crearProrroga(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incapacidades'] });
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] });
      success('Prórroga creada correctamente');
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al crear prórroga');
    },
  });
}

// ==================== EXPORT DEFAULT ====================

export default {
  // Constantes
  TIPOS_INCAPACIDAD,
  TIPOS_INCAPACIDAD_CONFIG,
  ESTADOS_INCAPACIDAD,
  ESTADOS_INCAPACIDAD_CONFIG,
  // Utilidades
  getTipoIncapacidadConfig,
  getEstadoIncapacidadConfig,
  formatDiasIncapacidad,
  // Hooks de consulta
  useIncapacidades,
  useMisIncapacidades,
  useIncapacidad,
  useIncapacidadesActivasProfesional,
  useEstadisticasIncapacidades,
  // Hooks de mutación
  useCrearIncapacidad,
  useActualizarIncapacidad,
  useFinalizarIncapacidad,
  useCancelarIncapacidad,
  useCrearProrroga,
};
