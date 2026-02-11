import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

interface ArchivosParams {
  entidadTipo?: string;
  entidadId?: string | number;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface UploadArchivoParams {
  file: File;
  folder?: string;
  isPublic?: boolean;
  generateThumbnail?: boolean;
  entidadTipo?: string;
  entidadId?: string | number;
}

interface PresignedUrlOptions {
  expiry?: number;
  enabled?: boolean;
}

/**
 * Hook para listar archivos con filtros
 */
export function useArchivos(params: ArchivosParams = {}) {
  return useQuery({
    queryKey: queryKeys.storage.archivos.list(params),
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce<
        Record<string, unknown>
      >((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await storageApi.listar(sanitizedParams);
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener archivo por ID
 */
export function useArchivo(id: string | number | null) {
  return useQuery({
    queryKey: queryKeys.storage.archivos.detail(id),
    queryFn: async () => {
      const response = await storageApi.obtener(id!);
      return (response as any).data.data;
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
    queryKey: queryKeys.storage.usage,
    queryFn: async () => {
      const response = await storageApi.obtenerUso();
      return (response as any).data.data;
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
    mutationFn: async ({
      file,
      folder = 'general',
      isPublic = true,
      generateThumbnail = false,
      entidadTipo,
      entidadId,
    }: UploadArchivoParams) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('isPublic', isPublic.toString());
      formData.append('generateThumbnail', generateThumbnail.toString());

      if (entidadTipo) formData.append('entidadTipo', entidadTipo);
      if (entidadId) formData.append('entidadId', entidadId.toString());

      const response = await storageApi.upload(formData);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.storage.archivos.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.storage.usage,
        refetchType: 'active',
      });
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
    mutationFn: async (id: string | number) => {
      const response = await storageApi.eliminar(id);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.storage.archivos.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.storage.usage,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('delete', 'Archivo'),
  });
}

/**
 * Hook para obtener URL firmada (archivos privados)
 */
export function usePresignedUrl(
  id: string | number | null,
  options: PresignedUrlOptions = {}
) {
  const { expiry = 3600, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.storage.presignedUrl(id, expiry),
    queryFn: async () => {
      const response = await storageApi.obtenerPresignedUrl(id!, { expiry });
      return (response as any).data.data;
    },
    enabled: !!id && enabled,
    staleTime: (expiry - 60) * 1000,
  });
}
