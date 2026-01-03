/**
 * useExperienciaLaboral - Hooks para Experiencia Laboral
 * Fase 4 del Plan de Empleados Competitivo
 * Enero 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profesionalesApi } from '../services/api/endpoints';
import { toast } from 'sonner';

// ==================== QUERY KEYS ====================

export const experienciaKeys = {
  all: ['experiencia-laboral'],
  lists: () => [...experienciaKeys.all, 'list'],
  list: (profesionalId, filters) => [...experienciaKeys.lists(), profesionalId, filters],
  details: () => [...experienciaKeys.all, 'detail'],
  detail: (profesionalId, experienciaId) => [...experienciaKeys.details(), profesionalId, experienciaId],
  actual: (profesionalId) => [...experienciaKeys.all, 'actual', profesionalId],
};

// ==================== HOOKS DE QUERY ====================

/**
 * Lista experiencia laboral de un profesional
 * @param {number} profesionalId - ID del profesional
 * @param {Object} options - Opciones del hook
 * @param {Object} options.filtros - { limit, offset }
 * @param {boolean} options.enabled - Si el query está habilitado
 */
export function useExperienciaLaboral(profesionalId, options = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: experienciaKeys.list(profesionalId, filtros),
    queryFn: async () => {
      const response = await profesionalesApi.listarExperiencia(profesionalId, filtros);
      return response.data?.data || response.data;
    },
    enabled: enabled && !!profesionalId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Obtiene una experiencia laboral específica
 * @param {number} profesionalId - ID del profesional
 * @param {number} experienciaId - ID de la experiencia
 */
export function useExperienciaLaboralDetalle(profesionalId, experienciaId) {
  return useQuery({
    queryKey: experienciaKeys.detail(profesionalId, experienciaId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerExperiencia(profesionalId, experienciaId);
      return response.data?.data || response.data;
    },
    enabled: !!profesionalId && !!experienciaId,
  });
}

/**
 * Obtiene el empleo actual del profesional
 * @param {number} profesionalId - ID del profesional
 */
export function useEmpleoActual(profesionalId) {
  return useQuery({
    queryKey: experienciaKeys.actual(profesionalId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerEmpleoActual(profesionalId);
      return response.data?.data || response.data;
    },
    enabled: !!profesionalId,
    staleTime: 60 * 1000, // 1 minuto
  });
}

// ==================== HOOKS DE MUTACIÓN ====================

/**
 * Crea una nueva experiencia laboral
 * @returns {Object} Mutation object con mutate, isLoading, etc.
 */
export function useCrearExperiencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, data }) => {
      const response = await profesionalesApi.crearExperiencia(profesionalId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experienciaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: experienciaKeys.actual(variables.profesionalId) });
      toast.success('Experiencia laboral agregada');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.error || 'Error al agregar experiencia';
      toast.error(mensaje);
    },
  });
}

/**
 * Actualiza una experiencia laboral
 */
export function useActualizarExperiencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, experienciaId, data }) => {
      const response = await profesionalesApi.actualizarExperiencia(profesionalId, experienciaId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experienciaKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: experienciaKeys.detail(variables.profesionalId, variables.experienciaId)
      });
      queryClient.invalidateQueries({ queryKey: experienciaKeys.actual(variables.profesionalId) });
      toast.success('Experiencia actualizada');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.error || 'Error al actualizar experiencia';
      toast.error(mensaje);
    },
  });
}

/**
 * Elimina una experiencia laboral (soft delete)
 */
export function useEliminarExperiencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, experienciaId }) => {
      const response = await profesionalesApi.eliminarExperiencia(profesionalId, experienciaId);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experienciaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: experienciaKeys.actual(variables.profesionalId) });
      toast.success('Experiencia eliminada');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.error || 'Error al eliminar experiencia';
      toast.error(mensaje);
    },
  });
}

/**
 * Reordena experiencias laborales
 */
export function useReordenarExperiencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, orden }) => {
      const response = await profesionalesApi.reordenarExperiencia(profesionalId, { orden });
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experienciaKeys.lists() });
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
 * Calcula años de experiencia desde fecha inicio hasta fecha fin (o ahora)
 * @param {string} fechaInicio - Fecha de inicio
 * @param {string|null} fechaFin - Fecha de fin (null = empleo actual)
 * @returns {string} Años y meses formateados
 */
export function calcularDuracion(fechaInicio, fechaFin) {
  if (!fechaInicio) return '';

  const inicio = new Date(fechaInicio);
  const fin = fechaFin ? new Date(fechaFin) : new Date();

  let meses = (fin.getFullYear() - inicio.getFullYear()) * 12;
  meses += fin.getMonth() - inicio.getMonth();

  if (meses < 0) return '';

  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;

  if (anios === 0) {
    return `${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`;
  }

  if (mesesRestantes === 0) {
    return `${anios} ${anios === 1 ? 'año' : 'años'}`;
  }

  return `${anios} ${anios === 1 ? 'año' : 'años'}, ${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`;
}

/**
 * Formatea fecha para visualización
 * @param {string} fecha - Fecha ISO
 * @returns {string} Fecha formateada (ej: "Ene 2020")
 */
export function formatearFechaMes(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formatea rango de fechas para experiencia
 * @param {string} fechaInicio - Fecha de inicio
 * @param {string|null} fechaFin - Fecha de fin
 * @returns {string} Rango formateado
 */
export function formatearRangoFechas(fechaInicio, fechaFin) {
  const inicio = formatearFechaMes(fechaInicio);
  const fin = fechaFin ? formatearFechaMes(fechaFin) : 'Presente';
  return `${inicio} - ${fin}`;
}
