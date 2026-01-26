import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { marketplaceApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hooks personalizados para el marketplace de clientes
 * Sigue el patrón establecido en useServicios.js y useComisiones.js
 */

// ==================== QUERIES (8) ====================

/**
 * Hook para listar categorías/industrias disponibles (público)
 * @returns {Object} { data: categorias[], isLoading, error }
 *
 * @example
 * const { data: categorias, isLoading } = useCategoriasMarketplace();
 * // categorias = [{ id: 1, codigo: 'barberia', nombre: 'Barbería', ... }, ...]
 */
export function useCategoriasMarketplace() {
  return useQuery({
    queryKey: ['categorias-marketplace'],
    queryFn: async () => {
      const response = await marketplaceApi.getCategorias();
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.LONG, // 30 minutos (categorías cambian poco)
  });
}

/**
 * Hook para listar perfiles del marketplace (público)
 * @param {Object} params - { ciudad, ciudad_id, categoria_id, rating_min, q, pagina, limite }
 * @returns {Object} { data: { perfiles, paginacion }, isLoading, error, refetch }
 *
 * @example
 * const { data, isLoading } = usePerfilesMarketplace({
 *   ciudad: 'CDMX',
 *   categoria_id: 1, // Filtro por industria
 *   rating_min: 4,
 *   pagina: 1,
 *   limite: 12
 * });
 */
export function usePerfilesMarketplace(params = {}) {
  return useQuery({
    queryKey: ['perfiles-marketplace', params],
    queryFn: async () => {
      // Sanitizar params y validar rating_min (1-5)
      const sanitizedParams = sanitizeParams(params);
      if (sanitizedParams.rating_min) {
        const num = parseInt(sanitizedParams.rating_min);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          sanitizedParams.rating_min = num;
        } else {
          delete sanitizedParams.rating_min;
        }
      }

      const response = await marketplaceApi.getPerfiles(sanitizedParams);
      return {
        perfiles: response.data.data.perfiles || [],
        paginacion: response.data.data.paginacion || null,
      };
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos (contenido público cambia poco)
    keepPreviousData: true, // Evita flash durante paginación
  });
}

/**
 * Hook para obtener perfil público por slug
 * @param {string} slug - Slug único del perfil
 * @returns {Object} { data: perfil, isLoading, error }
 *
 * @example
 * const { data: perfil, isLoading } = usePerfilPublico('barberia-cdmx-abc123');
 */
export function usePerfilPublico(slug) {
  return useQuery({
    queryKey: ['perfil-publico', slug],
    queryFn: async () => {
      const response = await marketplaceApi.getPerfilPorSlug(slug);
      // El backend retorna { perfil, servicios, profesionales, reseñas, stats }
      // Pero necesitamos solo el objeto perfil con todos los datos incluidos
      const data = response.data.data;
      return {
        ...data.perfil,
        servicios: data.servicios || [],
        profesionales: data.profesionales || [],
        reseñas: data.reseñas || [],
        stats: data.stats || {}
      };
    },
    enabled: !!slug,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener mi perfil de marketplace (admin/propietario)
 * @returns {Object} { data: perfil, isLoading, error, refetch }
 *
 * @example
 * const { data: miPerfil, isLoading } = useMiPerfilMarketplace();
 */
export function useMiPerfilMarketplace() {
  return useQuery({
    queryKey: ['mi-perfil-marketplace'],
    queryFn: async () => {
      const response = await marketplaceApi.getMiPerfil();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener estadísticas del perfil
 * @param {number} id - ID del perfil
 * @param {Object} params - { fecha_desde, fecha_hasta }
 * @returns {Object} { data: estadisticas, isLoading, error }
 *
 * @example
 * const { data: stats } = useEstadisticasPerfil(1, {
 *   fecha_desde: '2025-01-01',
 *   fecha_hasta: '2025-01-31'
 * });
 */
export function useEstadisticasPerfil(id, params = {}) {
  return useQuery({
    queryKey: ['estadisticas-perfil', id, params],
    queryFn: async () => {
      const response = await marketplaceApi.getEstadisticasPerfil(id, sanitizeParams(params));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Hook para listar reseñas de un negocio (público)
 * @param {string} slug - Slug del negocio
 * @param {Object} params - { pagina, limite, orden }
 * @returns {Object} { data: { resenas, paginacion }, isLoading, error }
 *
 * @example
 * const { data, isLoading } = useReseñasNegocio('barberia-cdmx-abc123', {
 *   pagina: 1,
 *   limite: 10,
 *   orden: 'recientes'
 * });
 */
export function useReseñasNegocio(slug, params = {}) {
  return useQuery({
    queryKey: ['resenas-negocio', slug, params],
    queryFn: async () => {
      const response = await marketplaceApi.getReseñas(slug, sanitizeParams(params));
      return {
        resenas: response.data.data.resenas || [],
        paginacion: response.data.data.paginacion || null,
      };
    },
    enabled: !!slug,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    keepPreviousData: true,
  });
}

/**
 * Hook para obtener servicios públicos de una organización
 * @param {number} organizacionId - ID de la organización
 * @returns {Object} { data: servicios[], isLoading, error }
 *
 * @example
 * const { data: servicios } = useServiciosPublicos(123);
 */
export function useServiciosPublicos(organizacionId) {
  return useQuery({
    queryKey: ['servicios-publicos', organizacionId],
    queryFn: async () => {
      // Usa el endpoint público de perfil que ya retorna servicios
      // Necesitamos primero obtener el perfil de la organización
      const response = await marketplaceApi.getPerfiles({ organizacion_id: organizacionId });
      const perfiles = response.data.data.perfiles;

      if (perfiles && perfiles.length > 0) {
        // Luego obtener el perfil completo con servicios
        const perfilResponse = await marketplaceApi.getPerfilPorSlug(perfiles[0].slug);
        return perfilResponse.data.data.servicios || [];
      }

      return [];
    },
    enabled: !!organizacionId,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para consultar disponibilidad pública (sin autenticación)
 * @param {number} organizacionId - ID de la organización
 * @param {Object} params - { servicios_ids, fecha, profesional_id?, intervalo_minutos? }
 * @returns {Object} { data: { fecha, slots: [...] }, isLoading, error }
 *
 * @example
 * const { data, isLoading } = useDisponibilidadPublica(1, {
 *   servicios_ids: [1, 2],
 *   fecha: '2025-11-20',
 *   intervalo_minutos: 30
 * });
 * // data.slots = [{ hora_inicio: '09:00', hora_fin: '10:00', disponible: true }, ...]
 */
export function useDisponibilidadPublica(organizacionId, params = {}) {
  return useQuery({
    queryKey: ['disponibilidad-publica', organizacionId, params],
    queryFn: async () => {
      // Sanitizar parámetros
      const sanitizedParams = {
        organizacion_id: organizacionId,
        ...sanitizeParams(params)
      };

      // Convertir servicios_ids a array si es necesario
      if (sanitizedParams.servicios_ids && !Array.isArray(sanitizedParams.servicios_ids)) {
        sanitizedParams.servicios_ids = [sanitizedParams.servicios_ids];
      }

      const response = await marketplaceApi.consultarDisponibilidadPublica(sanitizedParams);
      const backendData = response.data.data;

      // Transformar la respuesta del backend al formato esperado por el frontend
      // Backend: disponibilidad_por_fecha[].profesionales[].slots[]
      // Frontend: dias[].slots_disponibles[]
      const transformedData = {
        ...backendData,
        dias: backendData.disponibilidad_por_fecha?.map((fecha) => ({
          fecha: fecha.fecha,
          dia_semana: fecha.dia_semana,
          slots_disponibles: fecha.profesionales?.flatMap((prof) =>
            prof.slots
              ?.filter((slot) => slot.disponible)
              .map((slot) => ({
                hora: slot.hora.substring(0, 5), // "09:00:00" -> "09:00"
                disponible: slot.disponible,
                duracion_disponible: slot.duracion_disponible,
                profesional_id: prof.profesional_id,
                profesional_nombre: prof.nombre,
              })) || []
          ) || [],
          total_slots_disponibles: fecha.total_slots_disponibles_dia || 0,
        })) || [],
      };

      return transformedData;
    },
    enabled: !!organizacionId && !!params.fecha && (
      (Array.isArray(params.servicios_ids) && params.servicios_ids.length > 0) ||
      !!params.servicio_id
    ),
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos (disponibilidad cambia rápido)
    retry: 1, // Solo un reintento en caso de error
  });
}

// ==================== MUTATIONS (4) ====================

/**
 * Hook para crear perfil de marketplace
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const crearPerfil = useCrearPerfil();
 *
 * const handleCrear = () => {
 *   crearPerfil.mutate({
 *     nombre_comercial: 'Barbería El Corte',
 *     ciudad: 'CDMX',
 *     categoria: 'belleza',
 *     descripcion_corta: 'Los mejores cortes de la ciudad'
 *   });
 * };
 */
export function useCrearPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion_larga: data.descripcion_larga?.trim() || undefined,
        email_publico: data.email_publico?.trim() || undefined,
        sitio_web: data.sitio_web?.trim() || undefined,
        instagram: data.instagram?.trim() || undefined,
        facebook: data.facebook?.trim() || undefined,
      };
      const response = await marketplaceApi.crearPerfil(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas (sin exact para capturar todas las variantes)
      queryClient.invalidateQueries({ queryKey: ['perfiles-marketplace'], refetchType: 'active' });
      // Invalidar mi perfil (con exact porque es específico)
      queryClient.invalidateQueries({ queryKey: ['mi-perfil-marketplace'], exact: true, refetchType: 'active' });
      // Invalidar setup progress del dashboard
      queryClient.invalidateQueries({ queryKey: ['organizacion-setup-progress'], exact: true, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Perfil', {
      409: 'Ya existe un perfil para esta organizacion',
    }),
  });
}

/**
 * Hook para actualizar perfil de marketplace
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const actualizar = useActualizarPerfil();
 *
 * const handleActualizar = () => {
 *   actualizar.mutate({
 *     id: 1,
 *     data: { descripcion_corta: 'Nueva descripción' }
 *   });
 * };
 */
export function useActualizarPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion_larga: data.descripcion_larga?.trim() || undefined,
        email_publico: data.email_publico?.trim() || undefined,
        sitio_web: data.sitio_web?.trim() || undefined,
        instagram: data.instagram?.trim() || undefined,
        facebook: data.facebook?.trim() || undefined,
      };
      const response = await marketplaceApi.actualizarPerfil(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['perfiles-marketplace'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['mi-perfil-marketplace'], exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['perfil-publico', data.slug], exact: true, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Perfil'),
  });
}

/**
 * Hook para crear reseña (cliente con cita completada)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const crearResena = useCrearReseña();
 *
 * const handleCrear = () => {
 *   crearResena.mutate({
 *     cita_id: 123,
 *     rating: 5,
 *     comentario: 'Excelente servicio'
 *   });
 * };
 */
export function useCrearReseña() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        comentario: data.comentario?.trim() || undefined,
      };
      const response = await marketplaceApi.crearReseña(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar reseñas del negocio
      queryClient.invalidateQueries({ queryKey: ['resenas-negocio'], refetchType: 'active' });
      // Invalidar perfil público (para actualizar rating promedio)
      queryClient.invalidateQueries({ queryKey: ['perfil-publico'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Resena', {
      400: 'No puedes crear resena para esta cita',
      409: 'Ya creaste una resena para esta cita',
    }),
  });
}

/**
 * Hook para responder reseña (admin/propietario)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const responder = useResponderReseña();
 *
 * const handleResponder = () => {
 *   responder.mutate({
 *     id: 1,
 *     respuesta: '¡Gracias por tu comentario!'
 *   });
 * };
 */
export function useResponderReseña() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, respuesta }) => {
      const response = await marketplaceApi.responderReseña(id, {
        respuesta: respuesta.trim(),
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar reseñas
      queryClient.invalidateQueries({ queryKey: ['resenas-negocio'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['mi-perfil-marketplace'], exact: true, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Resena'),
  });
}

/**
 * Hook para moderar reseña (admin/propietario)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const moderar = useModerarReseña();
 *
 * const handleModerar = () => {
 *   moderar.mutate({
 *     id: 1,
 *     estado: 'oculta',
 *     motivo_moderacion: 'Contenido inapropiado'
 *   });
 * };
 */
export function useModerarReseña() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado, motivo_moderacion }) => {
      const response = await marketplaceApi.moderarReseña(id, {
        estado,
        motivo_moderacion: motivo_moderacion?.trim() || undefined,
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar reseñas
      queryClient.invalidateQueries({ queryKey: ['resenas-negocio'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['mi-perfil-marketplace'], exact: true, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Resena'),
  });
}

/**
 * Hook para crear cita pública (sin autenticación, crea cliente automáticamente)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const crearCita = useCrearCitaPublica();
 *
 * const handleCrear = () => {
 *   crearCita.mutate({
 *     cliente: {
 *       nombre: 'Juan',
 *       apellidos: 'Pérez',
 *       email: 'juan@example.com',
 *       telefono: '+525512345678'
 *     },
 *     servicios_ids: [1, 2],
 *     fecha_cita: '2025-11-20',
 *     hora_inicio: '14:00'
 *   });
 * };
 */
export function useCrearCitaPublica() {
  return useMutation({
    mutationFn: async (data) => {
      // Sanitizar datos del cliente
      const sanitized = {
        ...data,
        cliente: {
          nombre: data.cliente.nombre.trim(),
          apellidos: data.cliente.apellidos?.trim() || undefined,
          email: data.cliente.email.trim(),
          telefono: data.cliente.telefono.trim(),
        },
      };

      // Usar el endpoint de citas existente que detecta cliente vs cliente_id
      const response = await marketplaceApi.crearCitaPublica(sanitized);
      return response.data.data;
    },
    onError: createCRUDErrorHandler('create', 'Cita', {
      403: 'El negocio no esta disponible en este momento',
      404: 'Los servicios seleccionados no estan disponibles',
      409: 'El horario seleccionado ya no esta disponible',
    }),
  });
}

// ==================== EXPORT DEFAULT ====================

export default {
  // Queries
  useCategoriasMarketplace,
  usePerfilesMarketplace,
  usePerfilPublico,
  useMiPerfilMarketplace,
  useEstadisticasPerfil,
  useReseñasNegocio,
  useServiciosPublicos,
  useDisponibilidadPublica,

  // Mutations
  useCrearPerfil,
  useActualizarPerfil,
  useCrearReseña,
  useResponderReseña,
  useModerarReseña,
  useCrearCitaPublica,
};
