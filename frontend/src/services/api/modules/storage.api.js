import apiClient from '../client';
/**
 * API de Storage
 */
export const storageApi = {
  /**
   * Subir archivo
   * @param {FormData} formData - file, folder?, isPublic?, generateThumbnail?, entidadTipo?, entidadId?
   * @returns {Promise<Object>} { id, url, thumbnailUrl, bucket, path, fileName, mimeType, size, creadoEn }
   */
  upload: (formData) => apiClient.post('/storage/upload', formData),

  /**
   * Listar archivos de la organización
   * @param {Object} params - { entidadTipo?, entidadId?, limit?, offset? }
   * @returns {Promise<Object>} Array de archivos
   */
  listar: (params = {}) => apiClient.get('/storage', { params }),

  /**
   * Obtener archivo por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/storage/${id}`),

  /**
   * Obtener URL firmada (para archivos privados)
   * @param {number} id
   * @param {Object} params - { expiry? } en segundos
   * @returns {Promise<Object>} { url, expiresIn, esPublica }
   */
  obtenerPresignedUrl: (id, params = {}) => apiClient.get(`/storage/${id}/presigned`, { params }),

  /**
   * Eliminar archivo
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/storage/${id}`),

  /**
   * Obtener uso de almacenamiento
   * @returns {Promise<Object>} { totalArchivos, totalBytes, totalMb }
   */
  obtenerUso: () => apiClient.get('/storage/usage'),
};

// ==================== INVITACIONES (Nov 2025 - Sistema Profesional-Usuario) ====================
