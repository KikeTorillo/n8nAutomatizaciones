/**
 * ====================================================================
 * CONFIGURACIÓN DE BLOQUES - EDITOR INVITACIONES
 * ====================================================================
 * Define los tipos de bloques disponibles para el editor de invitaciones
 * digitales y su configuración de campos.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import {
  Layout,
  Clock,
  GitBranch,
  MapPin,
  Image,
  CheckCircle,
  Gift,
  Video,
  Type,
  Minus,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

// ========== CATEGORÍAS DE BLOQUES ==========

export const CATEGORIAS_BLOQUES = {
  estructura: { label: 'Estructura', orden: 1 },
  programa: { label: 'Programa', orden: 2 },
  contenido: { label: 'Contenido', orden: 3 },
  interaccion: { label: 'Interacción', orden: 4 },
};

// ========== TIPOS DE BLOQUES DISPONIBLES ==========

export const BLOQUES_INVITACION = [
  // ESTRUCTURA
  {
    tipo: 'apertura',
    categoria: 'estructura',
    label: 'Apertura',
    icon: Sparkles,
    descripcion: 'Sección de bienvenida con animación o imagen',
    unico: true,
  },
  {
    tipo: 'hero_invitacion',
    categoria: 'estructura',
    label: 'Portada',
    icon: Layout,
    descripcion: 'Portada principal con título y fecha',
  },
  {
    tipo: 'separador',
    categoria: 'estructura',
    label: 'Separador',
    icon: Minus,
    descripcion: 'Línea decorativa entre secciones',
  },

  // PROGRAMA
  {
    tipo: 'countdown',
    categoria: 'programa',
    label: 'Cuenta Regresiva',
    icon: Clock,
    descripcion: 'Contador hasta la fecha del evento',
  },
  {
    tipo: 'timeline',
    categoria: 'programa',
    label: 'Itinerario',
    icon: GitBranch,
    descripcion: 'Programa del día con horarios',
  },
  {
    tipo: 'ubicacion',
    categoria: 'programa',
    label: 'Ubicación',
    icon: MapPin,
    descripcion: 'Mapa y dirección del evento',
  },

  // CONTENIDO
  {
    tipo: 'galeria',
    categoria: 'contenido',
    label: 'Galería',
    icon: Image,
    descripcion: 'Galería de fotos',
  },
  {
    tipo: 'video',
    categoria: 'contenido',
    label: 'Video',
    icon: Video,
    descripcion: 'Video de invitación',
  },
  {
    tipo: 'texto',
    categoria: 'contenido',
    label: 'Texto',
    icon: Type,
    descripcion: 'Bloque de texto libre',
  },

  // INTERACCIÓN
  {
    tipo: 'rsvp',
    categoria: 'interaccion',
    label: 'Confirmación',
    icon: CheckCircle,
    descripcion: 'Formulario de confirmación de asistencia',
  },
  {
    tipo: 'mesa_regalos',
    categoria: 'interaccion',
    label: 'Mesa de Regalos',
    icon: Gift,
    descripcion: 'Enlaces a tiendas y registros',
  },
  {
    tipo: 'felicitaciones',
    categoria: 'interaccion',
    label: 'Felicitaciones',
    icon: MessageSquare,
    descripcion: 'Libro de firmas y buenos deseos',
  },
];

// ========== ICONOS POR TIPO ==========

export const BLOCK_ICONS = Object.fromEntries(
  BLOQUES_INVITACION.map((b) => [b.tipo, b.icon])
);

// ========== NOMBRES POR TIPO ==========

export const BLOCK_NAMES = Object.fromEntries(
  BLOQUES_INVITACION.map((b) => [b.tipo, b.label])
);

// ========== DESCRIPCIONES POR TIPO ==========

export const BLOCK_DESCRIPTIONS = Object.fromEntries(
  BLOQUES_INVITACION.map((b) => [b.tipo, b.descripcion])
);

// ========== CONFIGURACIÓN DE CAMPOS POR TIPO ==========

export const BLOCK_CONFIGS = {
  apertura: {
    contenido: [
      { key: 'modo', label: 'Modo', type: 'select', options: [
        { value: 'animacion', label: 'Animación' },
        { value: 'imagen', label: 'Imagen' },
        { value: 'cortina', label: 'Cortina' },
      ]},
      { key: 'animacion', label: 'Animación', type: 'select' },
      { key: 'imagen_url', label: 'Imagen de fondo', type: 'image' },
      { key: 'imagen_marco', label: 'Imagen del marco', type: 'image' },
      { key: 'direccion_apertura', label: 'Dirección', type: 'select', options: [
        { value: 'vertical', label: 'Izquierda / Derecha' },
        { value: 'horizontal', label: 'Arriba / Abajo' },
      ]},
      { key: 'texto', label: 'Texto', type: 'text', placeholder: 'Desliza para abrir' },
    ],
    estilo: [],
  },

  hero_invitacion: {
    contenido: [
      { key: 'titulo', label: 'Título principal', type: 'text', aiEnabled: true, placeholder: 'Nos Casamos' },
      { key: 'subtitulo', label: 'Subtítulo', type: 'textarea', aiEnabled: true, placeholder: 'Te invitamos a celebrar nuestro amor' },
      { key: 'imagen_url', label: 'Imagen de fondo', type: 'image' },
      { key: 'alineacion', label: 'Alineación', type: 'alignment' },
      { key: 'mostrar_calendario', label: 'Mostrar botones de calendario', type: 'toggle' },
    ],
    estilo: [
      { key: 'tipo_overlay', label: 'Tipo de overlay', type: 'select', options: [
        { value: 'uniforme', label: 'Uniforme' },
        { value: 'gradiente', label: 'Gradiente' },
      ]},
      { key: 'color_overlay', label: 'Color del overlay', type: 'color' },
      { key: 'imagen_overlay', label: 'Opacidad del overlay', type: 'range', min: 0, max: 1, step: 0.1 },
      { key: 'altura', label: 'Altura de sección', type: 'select', options: [
        { value: 'auto', label: 'Automática' },
        { value: 'full', label: 'Pantalla completa' },
        { value: 'medium', label: 'Media pantalla' },
      ]},
    ],
  },

  countdown: {
    contenido: [
      { key: 'titulo', label: 'Título', type: 'text', aiEnabled: true, placeholder: 'Faltan' },
      // fecha_objetivo se toma automáticamente de evento.fecha_evento
      { key: 'texto_finalizado', label: 'Texto al finalizar', type: 'text', aiEnabled: true, placeholder: '¡Llegó el gran día!' },
    ],
    estilo: [
      { key: 'estilo', label: 'Estilo', type: 'select', options: [
        { value: 'cajas', label: 'Cajas separadas' },
        { value: 'inline', label: 'En línea' },
        { value: 'circular', label: 'Circular' },
      ]},
      { key: 'mostrar_segundos', label: 'Mostrar segundos', type: 'toggle' },
    ],
  },

  timeline: {
    contenido: [
      { key: 'titulo_seccion', label: 'Título de sección', type: 'text', aiEnabled: true, placeholder: 'Itinerario del Día' },
      { key: 'subtitulo_seccion', label: 'Subtítulo', type: 'textarea', aiEnabled: true },
      { key: 'items', label: 'Actividades', type: 'itemsEditor', itemType: 'itinerario' },
    ],
    estilo: [
      { key: 'layout', label: 'Disposición', type: 'select', options: [
        { value: 'alternado', label: 'Alternado (zigzag)' },
        { value: 'izquierda', label: 'Todo a la izquierda' },
        { value: 'derecha', label: 'Todo a la derecha' },
      ]},
      { key: 'color_linea', label: 'Color de línea', type: 'color' },
    ],
  },

  ubicacion: {
    contenido: [
      { key: 'titulo', label: 'Título', type: 'text', aiEnabled: true, placeholder: 'Ubicación' },
      { key: 'subtitulo', label: 'Subtítulo', type: 'textarea', aiEnabled: true },
      { key: 'mostrar_todas', label: 'Mostrar todas las ubicaciones', type: 'toggle' },
      { key: 'ubicacion_id', label: 'Ubicación específica', type: 'select', options: [] }, // Se llenará dinámicamente
    ],
    estilo: [
      { key: 'mostrar_mapa', label: 'Mostrar mapa', type: 'toggle' },
      { key: 'altura_mapa', label: 'Altura del mapa', type: 'number', min: 200, max: 600 },
    ],
  },

  galeria: {
    contenido: [
      { key: 'titulo_seccion', label: 'Título', type: 'text', aiEnabled: true, placeholder: 'Galería' },
      { key: 'subtitulo_seccion', label: 'Subtítulo', type: 'textarea', aiEnabled: true },
      { key: 'usar_galeria_evento', label: 'Usar galería del evento', type: 'toggle' },
      { key: 'imagenes', label: 'Imágenes personalizadas', type: 'itemsEditor', itemType: 'imagenes', showWhen: (c) => !c?.usar_galeria_evento },
    ],
    estilo: [
      { key: 'layout', label: 'Diseño', type: 'select', options: [
        { value: 'grid', label: 'Grid' },
        { value: 'masonry', label: 'Masonry' },
        { value: 'carousel', label: 'Carrusel' },
      ]},
      { key: 'columnas', label: 'Columnas', type: 'select', options: [
        { value: 2, label: '2 columnas' },
        { value: 3, label: '3 columnas' },
        { value: 4, label: '4 columnas' },
      ]},
    ],
  },

  rsvp: {
    contenido: [
      { key: 'titulo', label: 'Título', type: 'text', aiEnabled: true, placeholder: 'Confirma tu Asistencia' },
      { key: 'subtitulo', label: 'Subtítulo', type: 'textarea', aiEnabled: true, placeholder: 'Necesitamos saber si podrás acompañarnos' },
      { key: 'texto_confirmado', label: 'Mensaje al confirmar', type: 'text', aiEnabled: true, placeholder: '¡Gracias por confirmar!' },
      { key: 'texto_rechazado', label: 'Mensaje al rechazar', type: 'text', aiEnabled: true, placeholder: 'Lamentamos que no puedas asistir' },
      { key: 'pedir_restricciones', label: 'Preguntar restricciones alimenticias', type: 'toggle' },
    ],
    estilo: [],
  },

  mesa_regalos: {
    contenido: [
      { key: 'titulo', label: 'Título', type: 'text', aiEnabled: true, placeholder: 'Mesa de Regalos' },
      { key: 'subtitulo', label: 'Subtítulo', type: 'textarea', aiEnabled: true, placeholder: 'Tu presencia es nuestro mejor regalo' },
      { key: 'usar_mesa_evento', label: 'Usar mesa de regalos del evento', type: 'toggle' },
      { key: 'items', label: 'Enlaces personalizados', type: 'itemsEditor', itemType: 'regalos', showWhen: (c) => !c?.usar_mesa_evento },
    ],
    estilo: [
      { key: 'layout', label: 'Diseño', type: 'select', options: [
        { value: 'grid', label: 'Grid' },
        { value: 'list', label: 'Lista' },
      ]},
    ],
  },

  video: {
    contenido: [
      { key: 'titulo_seccion', label: 'Título', type: 'text', aiEnabled: true },
      { key: 'subtitulo_seccion', label: 'Subtítulo', type: 'textarea', aiEnabled: true },
      { key: 'video_url', label: 'URL del video', type: 'url', placeholder: 'YouTube, Vimeo o MP4' },
      { key: 'video_tipo', label: 'Tipo', type: 'select', options: [
        { value: 'youtube', label: 'YouTube' },
        { value: 'vimeo', label: 'Vimeo' },
        { value: 'mp4', label: 'MP4 directo' },
      ]},
    ],
    estilo: [
      { key: 'autoplay', label: 'Reproducción automática', type: 'toggle' },
      { key: 'mostrar_controles', label: 'Mostrar controles', type: 'toggle' },
    ],
  },

  texto: {
    contenido: [
      { key: 'contenido', label: 'Contenido', type: 'textarea', aiEnabled: true, rows: 6 },
      { key: 'alineacion', label: 'Alineación', type: 'alignment' },
    ],
    estilo: [
      { key: 'tamano_fuente', label: 'Tamaño de fuente', type: 'select', options: [
        { value: 'small', label: 'Pequeño' },
        { value: 'normal', label: 'Normal' },
        { value: 'large', label: 'Grande' },
      ]},
    ],
  },

  felicitaciones: {
    contenido: [
      { key: 'titulo', label: 'Título', type: 'text', aiEnabled: true, placeholder: 'Libro de Firmas' },
      { key: 'subtitulo', label: 'Subtítulo', type: 'textarea', aiEnabled: true, placeholder: 'Déjanos tus buenos deseos' },
      { key: 'placeholder_mensaje', label: 'Placeholder del mensaje', type: 'text', placeholder: 'Escribe tus buenos deseos...' },
      { key: 'texto_agradecimiento', label: 'Texto de agradecimiento', type: 'text', aiEnabled: true, placeholder: '¡Gracias por tus palabras!' },
    ],
    estilo: [],
  },

  separador: {
    contenido: [
      { key: 'estilo', label: 'Estilo', type: 'select', options: [
        { value: 'linea', label: 'Línea' },
        { value: 'espacio', label: 'Espacio' },
        { value: 'ondas', label: 'Ondas decorativas' },
        { value: 'flores', label: 'Flores' },
      ]},
    ],
    estilo: [
      { key: 'altura', label: 'Altura (px)', type: 'number', min: 10, max: 200 },
      { key: 'color', label: 'Color', type: 'color' },
    ],
  },
};

// ========== DEFAULTS POR TIPO ==========

export const BLOCK_DEFAULTS = {
  apertura: {
    modo: 'animacion',
    animacion: 'sobre',
    imagen_url: '',
    imagen_marco: '',
    direccion_apertura: 'vertical',
    texto: 'Desliza para abrir',
  },

  hero_invitacion: {
    titulo: '',
    subtitulo: '',
    imagen_url: '',
    imagen_posicion: '50% 50%',
    alineacion: 'center',
    imagen_overlay: 0.3,
    tipo_overlay: 'uniforme',
    color_overlay: THEME_FALLBACK_COLORS.invitacion.overlay,
    altura: 'full',
    mostrar_calendario: true,
  },
  countdown: {
    titulo: 'Faltan',
    // fecha_objetivo se toma de evento.fecha_evento
    texto_finalizado: '¡Llegó el gran día!',
    estilo: 'cajas',
    mostrar_segundos: false,
  },
  timeline: {
    titulo_seccion: 'Itinerario del Día',
    subtitulo_seccion: '',
    items: [],
    layout: 'alternado',
    color_linea: '',
  },
  ubicacion: {
    titulo: 'Ubicación',
    subtitulo: '',
    mostrar_todas: true,
    ubicacion_id: null,
    mostrar_mapa: true,
    altura_mapa: 300,
  },
  galeria: {
    titulo_seccion: 'Galería',
    subtitulo_seccion: '',
    usar_galeria_evento: true,
    imagenes: [],
    layout: 'grid',
    columnas: 3,
  },
  rsvp: {
    titulo: 'Confirma tu Asistencia',
    subtitulo: '',
    texto_confirmado: '¡Gracias por confirmar!',
    texto_rechazado: 'Lamentamos que no puedas asistir',
    pedir_restricciones: false,
  },
  mesa_regalos: {
    titulo: 'Mesa de Regalos',
    subtitulo: 'Tu presencia es nuestro mejor regalo',
    usar_mesa_evento: true,
    items: [],
    layout: 'grid',
  },
  video: {
    titulo_seccion: '',
    subtitulo_seccion: '',
    video_url: '',
    video_tipo: 'youtube',
    autoplay: false,
    mostrar_controles: true,
  },
  texto: {
    contenido: '',
    alineacion: 'center',
    tamano_fuente: 'normal',
  },
  felicitaciones: {
    titulo: 'Libro de Firmas',
    subtitulo: 'Déjanos tus buenos deseos',
    placeholder_mensaje: 'Escribe tus buenos deseos...',
    texto_agradecimiento: '¡Gracias por tus palabras!',
  },
  separador: {
    estilo: 'linea',
    altura: 40,
    color: '',
  },
};

/**
 * Obtiene los defaults para un tipo de bloque
 * @param {string} tipo - Tipo de bloque
 * @returns {Object} Contenido por defecto
 */
export function getBlockDefaults(tipo) {
  return BLOCK_DEFAULTS[tipo] || {};
}

/**
 * Obtiene la configuración de campos para un tipo de bloque
 * @param {string} tipo - Tipo de bloque
 * @returns {Object} Configuración de campos
 */
export function getBlockConfig(tipo) {
  return BLOCK_CONFIGS[tipo] || { contenido: [], estilo: [] };
}
