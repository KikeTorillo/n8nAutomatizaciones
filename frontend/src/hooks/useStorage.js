import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '@/services/api/endpoints';

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
    staleTime: 1000 * 60 * 2, // 2 minutos
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
    staleTime: 1000 * 60 * 5,
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
    staleTime: 1000 * 60 * 2, // 2 minutos
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
      queryClient.invalidateQueries(['archivos']);
      queryClient.invalidateQueries(['storage-usage']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        400: 'Archivo inválido o tipo no permitido',
        413: 'El archivo excede el tamaño máximo permitido',
        403: 'Has alcanzado el límite de almacenamiento de tu plan',
        500: 'Error del servidor. Intenta nuevamente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al subir archivo';
      throw new Error(message);
    },
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
      queryClient.invalidateQueries(['archivos']);
      queryClient.invalidateQueries(['storage-usage']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Archivo no encontrado',
        403: 'No tienes permisos para eliminar este archivo',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar archivo';
      throw new Error(message);
    },
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
