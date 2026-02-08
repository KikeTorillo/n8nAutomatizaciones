/**
 * Utilidades para embed de video (YouTube, Vimeo, MP4).
 * Compartidas entre Website e Invitaciones canvas blocks.
 */

export interface VideoEmbedConfig {
  url: string;
  tipo?: 'youtube' | 'vimeo' | 'mp4';
  autoplay?: boolean;
  mostrar_controles?: boolean;
}

/**
 * Extrae el ID de un video de YouTube desde varias formas de URL.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/
  );
  return match ? match[1] : null;
}

/**
 * Extrae el ID de un video de Vimeo.
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Determina si la URL es un video directo (MP4, WebM, etc).
 */
export function isDirectVideo(url: string, tipo?: string): boolean {
  if (tipo === 'mp4') return true;
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

/**
 * Construye la URL de embed para YouTube, Vimeo o devuelve la URL directa para MP4.
 */
export function buildEmbedUrl(config: VideoEmbedConfig): string | null {
  const { url, tipo, autoplay = false, mostrar_controles = true } = config;
  if (!url) return null;

  try {
    // YouTube
    if (tipo === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYouTubeId(url);
      if (!videoId) return null;
      const params = new URLSearchParams();
      if (autoplay) params.set('autoplay', '1');
      if (!mostrar_controles) params.set('controls', '0');
      params.set('rel', '0');
      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }

    // Vimeo
    if (tipo === 'vimeo' || url.includes('vimeo.com')) {
      const videoId = extractVimeoId(url);
      if (!videoId) return null;
      const params = new URLSearchParams();
      if (autoplay) params.set('autoplay', '1');
      if (!mostrar_controles) params.set('controls', '0');
      return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
    }

    // MP4 / video directo
    if (isDirectVideo(url, tipo)) {
      return url;
    }

    return url;
  } catch {
    return null;
  }
}
