import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para listar archivos con filtros
 * @param {Object} params - { entidadTipo?, entidadId?, limit?, offset? }
 */
export function useArchivos(params = {}) {
  return useQuery({
    queryKey: ['archivos', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await storageApi.listar(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener archivo por ID
 */
export function useArchivo(id) {
  return useQuery({
    queryKey: ['archivo', id],
    queryFn: async () => {
      const response = await storageApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener uso de almacenamiento
 */
export function useStorageUsage() {
  return useQuery({
    queryKey: ['storage-usage'],
    queryFn: async () => {
      const response = await storageApi.obtenerUso();
      return response.data.data;
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para subir archivo
 */
export function useUploadArchivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, folder = 'general', isPublic = true, generateThumbnail = false, entidadTipo, entidadId }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('isPublic', isPublic.toString());
      formData.append('generateThumbnail', generateThumbnail.toString());

      if (entidadTipo) formData.append('entidadTipo', entidadTipo);
      if (entidadId) formData.append('entidadId', entidadId.toString());

      const response = await storageApi.upload(formData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archivos'] });
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
    },
    onError: createCRUDErrorHandler('create', 'Archivo', {
      413: 'El archivo excede el tamano maximo permitido',
      403: 'Has alcanzado el limite de almacenamiento de tu plan',
    }),
  });
}

/**
 * Hook para eliminar archivo
 */
export function useEliminarArchivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await storageApi.eliminar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archivos'] });
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
    },
    onError: createCRUDErrorHandler('delete', 'Archivo'),
  });
}

/**
 * Hook para obtener URL firmada (archivos privados)
 */
export function usePresignedUrl(id, options = {}) {
  const { expiry = 3600, enabled = true } = options;

  return useQuery({
    queryKey: ['presigned-url', id, expiry],
    queryFn: async () => {
      const response = await storageApi.obtenerPresignedUrl(id, { expiry });
      return response.data.data;
    },
    enabled: !!id && enabled,
    staleTime: (expiry - 60) * 1000, // Refrescar 1 minuto antes de expirar
  });
}
