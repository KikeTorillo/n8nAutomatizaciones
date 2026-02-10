import client from '../client';
import type { ApiResponse } from '../client';

interface StorageFile {
  id: number;
  url: string;
  thumbnailUrl?: string;
  bucket: string;
  path: string;
  fileName: string;
  mimeType: string;
  size: number;
  creadoEn: string;
}

interface StorageUsage {
  totalArchivos: number;
  totalBytes: number;
  totalMb: number;
}

interface PresignedUrl {
  url: string;
  expiresIn: number;
  esPublica: boolean;
}

interface StorageListParams {
  entidadTipo?: string;
  entidadId?: number;
  limit?: number;
  offset?: number;
}

export const storageApi = {
  upload: (formData: FormData): Promise<ApiResponse<StorageFile>> =>
    client.post('/storage/upload', formData),
  listar: (params: StorageListParams = {}): Promise<ApiResponse<StorageFile[]>> =>
    client.get('/storage', { params }),
  obtener: (id: number): Promise<ApiResponse<StorageFile>> =>
    client.get(`/storage/${id}`),
  obtenerPresignedUrl: (id: number, params: { expiry?: number } = {}): Promise<ApiResponse<PresignedUrl>> =>
    client.get(`/storage/${id}/presigned`, { params }),
  eliminar: (id: number): Promise<ApiResponse<void>> =>
    client.delete(`/storage/${id}`),
  obtenerUso: (): Promise<ApiResponse<StorageUsage>> =>
    client.get('/storage/usage'),
};
