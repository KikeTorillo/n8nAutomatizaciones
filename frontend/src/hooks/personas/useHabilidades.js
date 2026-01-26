/**
 * useHabilidades - Hooks para Habilidades (Catálogo y Empleado)
 * Fase 4 del Plan de Empleados Competitivo
 * Enero 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi, habilidadesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// ==================== CONSTANTES ====================

export const CATEGORIAS_HABILIDAD = [
  { value: 'tecnica', label: 'Técnica', color: 'blue', icon: 'wrench' },
  { value: 'blanda', label: 'Blanda', color: 'purple', icon: 'users' },
  { value: 'idioma', label: 'Idioma', color: 'green', icon: 'globe' },
  { value: 'software', label: 'Software', color: 'orange', icon: 'laptop' },
  { value: 'certificacion', label: 'Certificación', color: 'red', icon: 'certificate' },
  { value: 'otro', label: 'Otra', color: 'gray', icon: 'tag' },
];

export const NIVELES_HABILIDAD = [
  { value: 'basico', label: 'Básico', porcentaje: 25, color: 'gray' },
  { value: 'intermedio', label: 'Intermedio', porcentaje: 50, color: 'blue' },
  { value: 'avanzado', label: 'Avanzado', porcentaje: 75, color: 'green' },
  { value: 'experto', label: 'Experto', porcentaje: 100, color: 'purple' },
];

// ==================== QUERY KEYS ====================

export const catalogoKeys = {
  all: ['catalogo-habilidades'],
  lists: () => [...catalogoKeys.all, 'list'],
  list: (filters) => [...catalogoKeys.lists(), filters],
  details: () => [...catalogoKeys.all, 'detail'],
  detail: (habilidadId) => [...catalogoKeys.details(), habilidadId],
  profesionales: (habilidadId) => [...catalogoKeys.all, 'profesionales', habilidadId],
};

export const habilidadesEmpleadoKeys = {
  all: ['habilidades-empleado'],
  lists: () => [...habilidadesEmpleadoKeys.all, 'list'],
  list: (profesionalId, filters) => [...habilidadesEmpleadoKeys.lists(), profesionalId, filters],
  details: () => [...habilidadesEmpleadoKeys.all, 'detail'],
  detail: (profesionalId, habilidadEmpleadoId) => [...habilidadesEmpleadoKeys.details(), profesionalId, habilidadEmpleadoId],
};

// ==================== HOOKS CATÁLOGO ====================

/**
 * Lista catálogo de habilidades de la organización
 * @param {Object} options - Opciones del hook
 * @param {Object} options.filtros - { categoria, q, limit, offset }
 * @param {boolean} options.enabled - Si el query está habilitado
 */
export function useCatalogoHabilidades(options = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: catalogoKeys.list(filtros),
    queryFn: async () => {
      const response = await habilidadesApi.listar(filtros);
      return response.data?.data || response.data;
    },
    enabled,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Obtiene una habilidad del catálogo
 * @param {number} habilidadId - ID de la habilidad
 */
export function useHabilidadCatalogo(habilidadId) {
  return useQuery({
    queryKey: catalogoKeys.detail(habilidadId),
    queryFn: async () => {
      const response = await habilidadesApi.obtener(habilidadId);
      return response.data?.data || response.data;
    },
    enabled: !!habilidadId,
  });
}

/**
 * Lista profesionales con una habilidad específica
 * @param {number} habilidadId - ID de la habilidad
 * @param {Object} options - Opciones del hook
 */
export function useProfesionalesConHabilidad(habilidadId, options = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: catalogoKeys.profesionales(habilidadId),
    queryFn: async () => {
      const response = await habilidadesApi.listarProfesionales(habilidadId, filtros);
      return response.data?.data || response.data;
    },
    enabled: enabled && !!habilidadId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

// ==================== MUTATIONS CATÁLOGO ====================

/**
 * Crea una habilidad en el catálogo
 */
export function useCrearHabilidadCatalogo() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await habilidadesApi.crear(data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogoKeys.lists(), refetchType: 'active' });
      toast.success('Habilidad creada en catálogo');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Habilidad')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Actualiza una habilidad del catálogo
 */
export function useActualizarHabilidadCatalogo() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ habilidadId, data }) => {
      const response = await habilidadesApi.actualizar(habilidadId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogoKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: catalogoKeys.detail(variables.habilidadId), refetchType: 'active' });
      toast.success('Habilidad actualizada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Habilidad')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Elimina una habilidad del catálogo
 */
export function useEliminarHabilidadCatalogo() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (habilidadId) => {
      const response = await habilidadesApi.eliminar(habilidadId);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogoKeys.lists(), refetchType: 'active' });
      toast.success('Habilidad eliminada del catálogo');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Habilidad')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

// ==================== HOOKS HABILIDADES EMPLEADO ====================

/**
 * Lista habilidades de un profesional
 * @param {number} profesionalId - ID del profesional
 * @param {Object} options - Opciones del hook
 * @param {Object} options.filtros - { categoria, nivel, verificado, limit, offset }
 * @param {boolean} options.enabled - Si el query está habilitado
 */
export function useHabilidadesEmpleado(profesionalId, options = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: habilidadesEmpleadoKeys.list(profesionalId, filtros),
    queryFn: async () => {
      const response = await profesionalesApi.listarHabilidades(profesionalId, filtros);
      return response.data?.data || response.data;
    },
    enabled: enabled && !!profesionalId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Obtiene una habilidad específica de un empleado
 * @param {number} profesionalId - ID del profesional
 * @param {number} habilidadEmpleadoId - ID de la habilidad del empleado
 */
export function useHabilidadEmpleadoDetalle(profesionalId, habilidadEmpleadoId) {
  return useQuery({
    queryKey: habilidadesEmpleadoKeys.detail(profesionalId, habilidadEmpleadoId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerHabilidadEmpleado(profesionalId, habilidadEmpleadoId);
      return response.data?.data || response.data;
    },
    enabled: !!profesionalId && !!habilidadEmpleadoId,
  });
}

// ==================== MUTATIONS HABILIDADES EMPLEADO ====================

/**
 * Asigna una habilidad a un profesional
 */
export function useAsignarHabilidad() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, data }) => {
      const response = await profesionalesApi.asignarHabilidad(profesionalId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: habilidadesEmpleadoKeys.lists(), refetchType: 'active' });
      toast.success('Habilidad asignada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Habilidad')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Asigna múltiples habilidades en batch
 */
export function useAsignarHabilidadesBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, habilidades }) => {
      const response = await profesionalesApi.asignarHabilidadesBatch(profesionalId, { habilidades });
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: habilidadesEmpleadoKeys.lists(), refetchType: 'active' });
      toast.success(`${data.asignadas || 'Varias'} habilidades asignadas`);
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Habilidades')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Actualiza una habilidad de empleado
 */
export function useActualizarHabilidadEmpleado() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, habilidadEmpleadoId, data }) => {
      const response = await profesionalesApi.actualizarHabilidadEmpleado(profesionalId, habilidadEmpleadoId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: habilidadesEmpleadoKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({
        queryKey: habilidadesEmpleadoKeys.detail(variables.profesionalId, variables.habilidadEmpleadoId)
      });
      toast.success('Habilidad actualizada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Habilidad')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Elimina una habilidad de un empleado
 */
export function useEliminarHabilidadEmpleado() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, habilidadEmpleadoId }) => {
      const response = await profesionalesApi.eliminarHabilidadEmpleado(profesionalId, habilidadEmpleadoId);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: habilidadesEmpleadoKeys.lists(), refetchType: 'active' });
      toast.success('Habilidad eliminada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Habilidad')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Verifica/desverifica una habilidad de empleado
 */
export function useVerificarHabilidadEmpleado() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, habilidadEmpleadoId, verificado }) => {
      const response = await profesionalesApi.verificarHabilidadEmpleado(profesionalId, habilidadEmpleadoId, { verificado });
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: habilidadesEmpleadoKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({
        queryKey: habilidadesEmpleadoKeys.detail(variables.profesionalId, variables.habilidadEmpleadoId)
      });
      const accion = variables.verificado ? 'verificada' : 'desverificada';
      toast.success(`Habilidad ${accion}`);
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Habilidad')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

// ==================== UTILIDADES ====================

/**
 * Obtiene la configuración de una categoría de habilidad
 * @param {string} categoria - Categoría
 * @returns {Object} { label, color, icon }
 */
export function getCategoriaConfig(categoria) {
  return CATEGORIAS_HABILIDAD.find(c => c.value === categoria) || CATEGORIAS_HABILIDAD[5]; // 'otro' como default
}

/**
 * Obtiene la configuración de un nivel de habilidad
 * @param {string} nivel - Nivel
 * @returns {Object} { label, porcentaje, color }
 */
export function getNivelConfig(nivel) {
  return NIVELES_HABILIDAD.find(n => n.value === nivel) || NIVELES_HABILIDAD[0]; // 'basico' como default
}

/**
 * Agrupa habilidades por categoría
 * @param {Array} habilidades - Array de habilidades
 * @returns {Object} Objeto con categorías como keys
 */
export function agruparPorCategoria(habilidades) {
  return habilidades.reduce((acc, hab) => {
    const cat = hab.categoria || 'otro';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(hab);
    return acc;
  }, {});
}

/**
 * Filtra habilidades del catálogo que no están asignadas al empleado
 * @param {Array} catalogo - Habilidades del catálogo
 * @param {Array} asignadas - Habilidades asignadas al empleado
 * @returns {Array} Habilidades disponibles para asignar
 */
export function filtrarDisponibles(catalogo, asignadas) {
  const idsAsignados = new Set(asignadas.map(h => h.habilidad_id));
  return catalogo.filter(h => !idsAsignados.has(h.id));
}

/**
 * Formatea años de experiencia
 * @param {number} anios - Años de experiencia
 * @returns {string} Texto formateado
 */
export function formatearAniosExperiencia(anios) {
  if (!anios || anios === 0) return 'Sin experiencia';
  if (anios < 1) return 'Menos de 1 año';
  if (anios === 1) return '1 año';
  return `${anios} años`;
}
