/**
 * useEducacionFormal - Hooks para Educación Formal
 * Fase 4 del Plan de Empleados Competitivo
 * Enero 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profesionalesApi } from '@/services/api/endpoints';
import { toast } from 'sonner';

// ==================== CONSTANTES ====================

// IMPORTANTE: Debe coincidir con ENUM nivel_educacion en PostgreSQL (07-curriculum.sql)
export const NIVELES_EDUCACION = [
  { value: 'basica', label: 'Educación Básica', orden: 1 },
  { value: 'intermedia', label: 'Secundaria', orden: 2 },
  { value: 'preparatoria', label: 'Preparatoria / Bachillerato', orden: 3 },
  { value: 'tecnica', label: 'Carrera Técnica / Tecnólogo', orden: 4 },
  { value: 'licenciatura', label: 'Licenciatura / Ingeniería', orden: 5 },
  { value: 'especialidad', label: 'Especialidad', orden: 6 },
  { value: 'maestria', label: 'Maestría', orden: 7 },
  { value: 'doctorado', label: 'Doctorado', orden: 8 },
];

// ==================== QUERY KEYS ====================

export const educacionKeys = {
  all: ['educacion-formal'],
  lists: () => [...educacionKeys.all, 'list'],
  list: (profesionalId, filters) => [...educacionKeys.lists(), profesionalId, filters],
  details: () => [...educacionKeys.all, 'detail'],
  detail: (profesionalId, educacionId) => [...educacionKeys.details(), profesionalId, educacionId],
  enCurso: (profesionalId) => [...educacionKeys.all, 'en-curso', profesionalId],
};

// ==================== HOOKS DE QUERY ====================

/**
 * Lista educación formal de un profesional
 * @param {number} profesionalId - ID del profesional
 * @param {Object} options - Opciones del hook
 * @param {Object} options.filtros - { nivel, limit, offset }
 * @param {boolean} options.enabled - Si el query está habilitado
 */
export function useEducacionFormal(profesionalId, options = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: educacionKeys.list(profesionalId, filtros),
    queryFn: async () => {
      const response = await profesionalesApi.listarEducacion(profesionalId, filtros);
      return response.data?.data || response.data;
    },
    enabled: enabled && !!profesionalId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Obtiene una educación específica
 * @param {number} profesionalId - ID del profesional
 * @param {number} educacionId - ID de la educación
 */
export function useEducacionFormalDetalle(profesionalId, educacionId) {
  return useQuery({
    queryKey: educacionKeys.detail(profesionalId, educacionId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerEducacion(profesionalId, educacionId);
      return response.data?.data || response.data;
    },
    enabled: !!profesionalId && !!educacionId,
  });
}

/**
 * Obtiene estudios en curso del profesional
 * @param {number} profesionalId - ID del profesional
 */
export function useEducacionEnCurso(profesionalId) {
  return useQuery({
    queryKey: educacionKeys.enCurso(profesionalId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerEducacionEnCurso(profesionalId);
      return response.data?.data || response.data;
    },
    enabled: !!profesionalId,
    staleTime: 60 * 1000, // 1 minuto
  });
}

// ==================== HOOKS DE MUTACIÓN ====================

/**
 * Crea un nuevo registro de educación
 * @returns {Object} Mutation object con mutate, isLoading, etc.
 */
export function useCrearEducacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, data }) => {
      const response = await profesionalesApi.crearEducacion(profesionalId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: educacionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: educacionKeys.enCurso(variables.profesionalId) });
      toast.success('Educación agregada');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.error || 'Error al agregar educación';
      toast.error(mensaje);
    },
  });
}

/**
 * Actualiza un registro de educación
 */
export function useActualizarEducacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, educacionId, data }) => {
      const response = await profesionalesApi.actualizarEducacion(profesionalId, educacionId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: educacionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: educacionKeys.detail(variables.profesionalId, variables.educacionId)
      });
      queryClient.invalidateQueries({ queryKey: educacionKeys.enCurso(variables.profesionalId) });
      toast.success('Educación actualizada');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.error || 'Error al actualizar educación';
      toast.error(mensaje);
    },
  });
}

/**
 * Elimina un registro de educación (soft delete)
 */
export function useEliminarEducacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, educacionId }) => {
      const response = await profesionalesApi.eliminarEducacion(profesionalId, educacionId);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: educacionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: educacionKeys.enCurso(variables.profesionalId) });
      toast.success('Educación eliminada');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.error || 'Error al eliminar educación';
      toast.error(mensaje);
    },
  });
}

/**
 * Reordena registros de educación
 */
export function useReordenarEducacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, orden }) => {
      const response = await profesionalesApi.reordenarEducacion(profesionalId, { orden });
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: educacionKeys.lists() });
      toast.success('Orden actualizado');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.error || 'Error al reordenar';
      toast.error(mensaje);
    },
  });
}

// ==================== UTILIDADES ====================

/**
 * Obtiene el label de un nivel de educación
 * @param {string} nivel - Nivel de educación
 * @returns {string} Label del nivel
 */
export function getNivelEducacionLabel(nivel) {
  return NIVELES_EDUCACION.find(n => n.value === nivel)?.label || nivel;
}

/**
 * Ordena niveles de educación por jerarquía
 * @param {Array} educaciones - Array de educaciones
 * @returns {Array} Educaciones ordenadas por nivel (mayor a menor)
 */
export function ordenarPorNivel(educaciones) {
  const ordenNiveles = NIVELES_EDUCACION.reduce((acc, n) => {
    acc[n.value] = n.orden;
    return acc;
  }, {});

  return [...educaciones].sort((a, b) => {
    const ordenA = ordenNiveles[a.nivel] || 0;
    const ordenB = ordenNiveles[b.nivel] || 0;
    return ordenB - ordenA; // Mayor nivel primero
  });
}

/**
 * Formatea estado del estudio
 * @param {boolean} enCurso - Si está en curso
 * @param {string|null} fechaFin - Fecha de finalización
 * @returns {Object} { label, color }
 */
export function getEstadoEstudio(enCurso, fechaFin) {
  if (enCurso) {
    return { label: 'En curso', color: 'blue' };
  }
  if (fechaFin) {
    return { label: 'Completado', color: 'green' };
  }
  return { label: 'Incompleto', color: 'gray' };
}

/**
 * Formatea rango de años para educación
 * @param {string} fechaInicio - Fecha de inicio
 * @param {string|null} fechaFin - Fecha de fin
 * @param {boolean} enCurso - Si está en curso
 * @returns {string} Rango formateado
 */
export function formatearRangoAnios(fechaInicio, fechaFin, enCurso) {
  const anioInicio = fechaInicio ? new Date(fechaInicio).getFullYear() : '';
  if (enCurso) {
    return `${anioInicio} - Presente`;
  }
  const anioFin = fechaFin ? new Date(fechaFin).getFullYear() : '';
  return anioFin ? `${anioInicio} - ${anioFin}` : anioInicio;
}
