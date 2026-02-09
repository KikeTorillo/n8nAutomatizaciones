import apiClient from '../client';

// ========== TYPES ==========

export interface ImageSearchParams {
  query: string;
  page?: number;
  per_page?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
}

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description?: string;
  description?: string;
  user: {
    name: string;
    username: string;
    links?: { html: string };
  };
  links?: {
    download_location?: string;
  };
  width: number;
  height: number;
}

export interface ImageSearchResult {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

export interface ImageDownloadData {
  url: string;
  photographer?: string;
  unsplashId?: string;
  downloadLocation?: string;
}

export interface DownloadedImage {
  url: string;
  [key: string]: unknown;
}

// ========== API ==========

/**
 * API compartida para búsqueda y descarga de imágenes (Unsplash).
 * Desacoplada de websiteApi para uso desde cualquier módulo.
 *
 * NOTA: Esta API desenvuelve `.data` en la capa API (patrón diferente al resto).
 */
export const imagesApi = {
  /** Buscar imágenes en Unsplash */
  buscarImagenes: (params: ImageSearchParams): Promise<ImageSearchResult> =>
    apiClient.get('/images/search', { params: { q: params.query, ...params } })
      .then((res) => (res.data as { data?: ImageSearchResult })?.data || res.data),

  /** Descargar imagen de Unsplash */
  descargarImagen: (datos: ImageDownloadData): Promise<DownloadedImage> =>
    apiClient.post('/images/download', datos)
      .then((res) => (res.data as { data?: DownloadedImage })?.data || res.data),

  /** Obtener imagen aleatoria de Unsplash */
  obtenerImagenAleatoria: (query?: string): Promise<UnsplashImage> =>
    apiClient.get('/images/random', { params: query ? { query } : {} })
      .then((res) => (res.data as { data?: UnsplashImage })?.data || res.data),
};

export default imagesApi;
