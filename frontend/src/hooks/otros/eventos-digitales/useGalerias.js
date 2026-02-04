/**
 * Hooks para galería, felicitaciones y mesa de regalos
 *
 * Ene 2026: Extraído de useEventosDigitales.js para mejor mantenibilidad
 * Feb 2026: Migrado a EVENTO_QUERY_KEYS centralizados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { eventosDigitalesApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { EVENTO_QUERY_KEYS } from './helpers';

// ==================== QUERIES MESA DE REGALOS ====================

/**
 * Hook para listar mesa de regalos de un evento
 * @param {number} eventoId - ID del evento
 * @param {Object} params - { disponibles? }
 * @returns {Object} { data: regalos[], isLoading, error }
 */
export function useMesaRegalos(eventoId, params = {}) {
  return useQuery({
    queryKey: [...EVENTO_QUERY_KEYS.regalos(eventoId), params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarRegalos(eventoId, sanitizeParams(params));
      return response.data.data.regalos || [];
    },
    enabled: !!eventoId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ==================== MUTATIONS MESA DE REGALOS ====================

/**
 * Hook para crear regalo
 */
export function useCrearRegalo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, data }) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        url_externa: data.url_externa?.trim() || undefined,
        imagen_url: data.imagen_url?.trim() || undefined,
      };
      const response = await eventosDigitalesApi.crearRegalo(eventoId, sanitized);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.regalos(variables.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('create', 'Regalo'),
  });
}

/**
 * Hook para actualizar regalo
 */
export function useActualizarRegalo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId, data }) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        url_externa: data.url_externa?.trim() || undefined,
        imagen_url: data.imagen_url?.trim() || undefined,
      };
      const response = await eventosDigitalesApi.actualizarRegalo(id, sanitized);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.regalos(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('update', 'Regalo'),
  });
}

/**
 * Hook para marcar regalo como comprado
 */
export function useMarcarRegaloComprado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId, comprado_por }) => {
      const response = await eventosDigitalesApi.marcarRegaloComprado(id, { comprado_por });
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.regalos(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('update', 'Regalo'),
  });
}

/**
 * Hook para eliminar regalo
 */
export function useEliminarRegalo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarRegalo(id);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.regalos(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('delete', 'Regalo'),
  });
}

// ==================== QUERIES FELICITACIONES ====================

/**
 * Hook para listar felicitaciones de un evento
 * @param {number} eventoId - ID del evento
 * @param {Object} params - { aprobadas?, limit?, offset? }
 * @returns {Object} { data: { felicitaciones, total }, isLoading, error }
 */
export function useFelicitaciones(eventoId, params = {}) {
  return useQuery({
    queryKey: [...EVENTO_QUERY_KEYS.felicitaciones(eventoId), params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarFelicitaciones(eventoId, sanitizeParams(params));
      return {
        felicitaciones: response.data.data.felicitaciones || [],
        total: response.data.data.total || 0,
      };
    },
    enabled: !!eventoId,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

// ==================== MUTATIONS FELICITACIONES ====================

/**
 * Hook para crear felicitación (admin)
 */
export function useCrearFelicitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, data }) => {
      const sanitized = {
        nombre_autor: data.nombre_autor.trim(),
        mensaje: data.mensaje.trim(),
        invitado_id: data.invitado_id || undefined,
      };
      const response = await eventosDigitalesApi.crearFelicitacion(eventoId, sanitized);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.felicitaciones(variables.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('create', 'Felicitacion'),
  });
}

/**
 * Hook para aprobar felicitación
 */
export function useAprobarFelicitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.aprobarFelicitacion(id);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.felicitaciones(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('update', 'Felicitacion'),
  });
}

/**
 * Hook para rechazar felicitación
 */
export function useRechazarFelicitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.rechazarFelicitacion(id);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.felicitaciones(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('update', 'Felicitacion'),
  });
}

/**
 * Hook para eliminar felicitación
 */
export function useEliminarFelicitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarFelicitacion(id);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.felicitaciones(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('delete', 'Felicitacion'),
  });
}

// ==================== QUERIES GALERÍA ====================

/**
 * Hook para listar fotos de la galería de un evento
 * @param {number} eventoId - ID del evento
 * @param {Object} params - { estado?, limit?, offset? }
 */
export function useGaleria(eventoId, params = {}) {
  return useQuery({
    queryKey: [...EVENTO_QUERY_KEYS.galeria(eventoId), params],
    queryFn: async () => {
      const response = await eventosDigitalesApi.listarFotos(eventoId, sanitizeParams(params));
      return response.data.data;
    },
    enabled: !!eventoId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Hook para obtener galería pública de un evento (sin auth)
 * @param {string} slug - Slug del evento
 * @param {number} limit - Límite de fotos
 */
export function useGaleriaPublica(slug, limit = 100) {
  return useQuery({
    queryKey: ['galeria-publica', slug, limit],
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerGaleriaPublica(slug, limit);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

// ==================== MUTATIONS GALERÍA ====================

/**
 * Hook para subir foto a la galería (admin/organizador)
 */
export function useSubirFoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, data }) => {
      const sanitized = {
        url: data.url,
        thumbnail_url: data.thumbnail_url || undefined,
        caption: data.caption?.trim() || undefined,
        tamanio_bytes: data.tamanio_bytes || undefined,
        tipo_mime: data.tipo_mime || undefined,
      };
      const response = await eventosDigitalesApi.subirFoto(eventoId, sanitized);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.galeria(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('create', 'Foto'),
  });
}

/**
 * Hook para cambiar estado de foto (visible/oculta)
 */
export function useCambiarEstadoFoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fotoId, estado, eventoId }) => {
      const response = await eventosDigitalesApi.cambiarEstadoFoto(fotoId, estado);
      return { ...response.data.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.galeria(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('update', 'Foto'),
  });
}

/**
 * Hook para eliminar foto (soft delete)
 */
export function useEliminarFoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fotoId, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarFoto(fotoId);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.galeria(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('delete', 'Foto'),
  });
}

/**
 * Hook para eliminar foto permanentemente
 */
export function useEliminarFotoPermanente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fotoId, eventoId }) => {
      const response = await eventosDigitalesApi.eliminarFotoPermanente(fotoId);
      return { ...response.data, eventoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: EVENTO_QUERY_KEYS.galeria(data.eventoId),
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('delete', 'Foto'),
  });
}

/**
 * Hook para subir foto como invitado (público)
 */
export function useSubirFotoPublica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, token, file, caption }) => {
      const response = await eventosDigitalesApi.subirFotoPublica(slug, token, file, caption?.trim() || '');
      return { ...response.data.data, slug };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['galeria-publica', data.slug],
        refetchType: 'active'
      });
    },
    onError: createCRUDErrorHandler('create', 'Foto', {
      400: 'No esta permitido subir fotos en este evento',
      413: 'La imagen es demasiado grande. Maximo 10MB.',
    }),
  });
}

/**
 * Hook para reportar foto inapropiada (público)
 */
export function useReportarFoto() {
  return useMutation({
    mutationFn: async ({ fotoId, motivo }) => {
      const response = await eventosDigitalesApi.reportarFoto(fotoId, motivo);
      return response.data;
    },
    onError: createCRUDErrorHandler('create', 'Reporte'),
  });
}
