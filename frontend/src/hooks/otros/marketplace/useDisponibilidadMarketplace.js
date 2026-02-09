import { useQuery, useMutation } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { marketplaceApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== QUERIES (2) ====================

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
    queryKey: queryKeys.marketplace.serviciosPublicos(organizacionId),
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
    queryKey: queryKeys.marketplace.disponibilidadPublica(organizacionId, params),
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

// ==================== MUTATIONS (1) ====================

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
