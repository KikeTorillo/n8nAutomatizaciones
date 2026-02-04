/**
 * ====================================================================
 * BLOCK DEFAULTS - CONFIGURACIÓN BASE PARA BLOQUES COMUNES
 * ====================================================================
 * Valores por defecto y configuración compartida entre editores.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

// ========== SEPARADOR ==========

export const SEPARADOR_DEFAULTS = {
  estilo: 'linea',
  color: 'primary',
};

export const SEPARADOR_ESTILOS = {
  // Estilos comunes a ambos editores
  LINEA: 'linea',
  ESPACIO: 'espacio',
  ONDAS: 'ondas',
  FLORES: 'flores',
  // Estilos solo para Website
  PUNTEADO: 'punteado',
  GRADIENTE: 'gradiente',
  ONDULADO: 'ondulado',
};

// ========== GALERIA ==========

export const GALERIA_DEFAULTS = {
  titulo: '',
  imagenes: [],
  columnas: 3,
  espaciado: 'normal',
  mostrarTitulos: false,
  efectoHover: 'zoom',
};

export const GALERIA_EFECTOS_HOVER = {
  NINGUNO: 'ninguno',
  ZOOM: 'zoom',
  OSCURECER: 'oscurecer',
  BRILLO: 'brillo',
};

export const GALERIA_ESPACIADOS = {
  NINGUNO: 'ninguno',
  PEQUENO: 'pequeno',
  NORMAL: 'normal',
  GRANDE: 'grande',
};

// ========== VIDEO ==========

export const VIDEO_DEFAULTS = {
  url: '',
  titulo: '',
  autoplay: false,
  muted: false,
  loop: false,
  controles: true,
};

export const VIDEO_PLATAFORMAS = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
  LOCAL: 'local',
};

// ========== FAQ ==========

export const FAQ_DEFAULTS = {
  titulo: 'Preguntas Frecuentes',
  preguntas: [],
  estiloAcordeon: true,
  abrirPrimera: true,
};

export const FAQ_PREGUNTA_DEFAULT = {
  pregunta: '',
  respuesta: '',
};

// ========== COUNTDOWN ==========

export const COUNTDOWN_DEFAULTS = {
  titulo: '',
  fechaObjetivo: '',
  mostrarDias: true,
  mostrarHoras: true,
  mostrarMinutos: true,
  mostrarSegundos: true,
  estilo: 'cajas',
  mensajeFinal: '¡El momento ha llegado!',
};

export const COUNTDOWN_ESTILOS = {
  CAJAS: 'cajas',
  CIRCULAR: 'circular',
  MINIMALISTA: 'minimalista',
  ELEGANTE: 'elegante',
};

// ========== UTILS ==========

/**
 * Detecta la plataforma de un video por su URL
 * @param {string} url - URL del video
 * @returns {string} - Plataforma (youtube, vimeo, local)
 */
export function detectarPlataformaVideo(url) {
  if (!url) return VIDEO_PLATAFORMAS.LOCAL;

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return VIDEO_PLATAFORMAS.YOUTUBE;
  }

  if (url.includes('vimeo.com')) {
    return VIDEO_PLATAFORMAS.VIMEO;
  }

  return VIDEO_PLATAFORMAS.LOCAL;
}

/**
 * Extrae el ID de un video de YouTube
 * @param {string} url - URL del video
 * @returns {string|null} - ID del video
 */
export function extraerIdYoutube(url) {
  if (!url) return null;

  // youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/embed/ID
  const embedMatch = url.match(/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Extrae el ID de un video de Vimeo
 * @param {string} url - URL del video
 * @returns {string|null} - ID del video
 */
export function extraerIdVimeo(url) {
  if (!url) return null;

  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Genera URL de embed para un video
 * @param {string} url - URL original del video
 * @param {Object} opciones - Opciones de embed
 * @returns {string} - URL de embed
 */
export function generarEmbedUrl(url, opciones = {}) {
  const plataforma = detectarPlataformaVideo(url);
  const { autoplay = false, muted = false, loop = false } = opciones;

  if (plataforma === VIDEO_PLATAFORMAS.YOUTUBE) {
    const videoId = extraerIdYoutube(url);
    if (!videoId) return url;

    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (muted) params.set('mute', '1');
    if (loop) params.set('loop', '1');

    const paramStr = params.toString();
    return `https://www.youtube.com/embed/${videoId}${paramStr ? '?' + paramStr : ''}`;
  }

  if (plataforma === VIDEO_PLATAFORMAS.VIMEO) {
    const videoId = extraerIdVimeo(url);
    if (!videoId) return url;

    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (muted) params.set('muted', '1');
    if (loop) params.set('loop', '1');

    const paramStr = params.toString();
    return `https://player.vimeo.com/video/${videoId}${paramStr ? '?' + paramStr : ''}`;
  }

  return url;
}
