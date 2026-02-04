/**
 * Constantes para PropertiesPanel
 */
import {
  Settings,
  Paintbrush,
  Code,
  Search,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';

// ========== TABS CONFIG ==========

export const TABS = [
  { id: 'contenido', label: 'Contenido', icon: Settings },
  { id: 'estilo', label: 'Estilo', icon: Paintbrush },
  { id: 'avanzado', label: 'Avanzado', icon: Code },
  { id: 'seo', label: 'SEO', icon: Search },
];

// ========== BREAKPOINT CONFIG ==========

export const BREAKPOINT_ICONS = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

export const BREAKPOINT_LABELS = {
  desktop: 'Escritorio',
  tablet: 'Tablet',
  mobile: 'Movil',
};

// ========== BLOCK TYPE CONFIGS ==========

export const BLOCK_CONFIGS = {
  hero: {
    contenido: [
      { key: 'titulo', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
      { key: 'imagen_url', label: 'Imagen de fondo', type: 'image' },
      { key: 'boton_texto', label: 'Texto del boton', type: 'text', aiEnabled: true },
      { key: 'boton_url', label: 'URL del boton', type: 'url' },
      { key: 'boton_tipo', label: 'Tipo de boton', type: 'select', options: [
        { value: 'link', label: 'Enlace' },
        { value: 'agendar', label: 'Agendar cita' },
        { value: 'whatsapp', label: 'WhatsApp' },
      ]},
      { key: 'alineacion', label: 'Alineacion', type: 'alignment' },
    ],
    estilo: [
      { key: 'imagen_overlay', label: 'Oscurecer imagen', type: 'range', min: 0, max: 1, step: 0.1 },
    ],
  },
  servicios: {
    contenido: [
      { key: 'titulo_seccion', label: 'Titulo de seccion', type: 'text', aiEnabled: true },
      { key: 'subtitulo_seccion', label: 'Subtitulo', type: 'text', aiEnabled: true },
      { key: 'columnas', label: 'Columnas', type: 'select', options: [
        { value: 2, label: '2 columnas' },
        { value: 3, label: '3 columnas' },
        { value: 4, label: '4 columnas' },
      ]},
      { key: 'mostrar_precio', label: 'Mostrar precios', type: 'toggle' },
      { key: 'mostrar_duracion', label: 'Mostrar duracion', type: 'toggle' },
      { key: 'origen', label: 'Origen de datos', type: 'select', options: [
        { value: 'manual', label: 'Manual' },
        { value: 'erp', label: 'Modulo Servicios (ERP)' },
      ]},
      {
        key: 'items',
        label: 'Servicios',
        type: 'itemsEditor',
        itemType: 'servicios',
        showWhen: (contenido) => contenido?.origen !== 'erp',
      },
    ],
  },
  testimonios: {
    contenido: [
      { key: 'titulo', label: 'Titulo de seccion', type: 'text', aiEnabled: true },
      { key: 'layout', label: 'Diseno', type: 'select', options: [
        { value: 'grid', label: 'Grid' },
        { value: 'carousel', label: 'Carrusel' },
      ]},
      { key: 'origen', label: 'Origen de datos', type: 'select', options: [
        { value: 'manual', label: 'Manual' },
        { value: 'resenas', label: 'Resenas del Marketplace' },
      ]},
    ],
  },
  equipo: {
    contenido: [
      { key: 'titulo_seccion', label: 'Titulo de seccion', type: 'text', aiEnabled: true },
      { key: 'subtitulo_seccion', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
      { key: 'mostrar_redes', label: 'Mostrar redes sociales', type: 'toggle' },
      { key: 'origen', label: 'Origen de datos', type: 'select', options: [
        { value: 'manual', label: 'Manual' },
        { value: 'profesionales', label: 'Modulo Profesionales' },
      ]},
    ],
  },
  cta: {
    contenido: [
      { key: 'titulo', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
      { key: 'boton_texto', label: 'Texto del boton', type: 'text', aiEnabled: true },
      { key: 'boton_url', label: 'URL del boton', type: 'url' },
      { key: 'boton_tipo', label: 'Tipo de boton', type: 'select', options: [
        { value: 'link', label: 'Enlace' },
        { value: 'agendar', label: 'Agendar cita' },
        { value: 'whatsapp', label: 'WhatsApp' },
      ]},
    ],
    estilo: [
      { key: 'fondo_tipo', label: 'Tipo de fondo', type: 'select', options: [
        { value: 'color', label: 'Color solido' },
        { value: 'imagen', label: 'Imagen' },
        { value: 'gradiente', label: 'Gradiente' },
      ]},
      { key: 'fondo_valor', label: 'Valor del fondo', type: 'text', placeholder: 'Color, URL o gradiente CSS' },
    ],
  },
  contacto: {
    contenido: [
      { key: 'titulo', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
      { key: 'mostrar_formulario', label: 'Mostrar formulario', type: 'toggle' },
      { key: 'mostrar_info', label: 'Mostrar informacion', type: 'toggle' },
      { key: 'mostrar_mapa', label: 'Mostrar mapa', type: 'toggle' },
    ],
  },
  footer: {
    contenido: [
      { key: 'descripcion', label: 'Descripcion', type: 'textarea', aiEnabled: true },
      { key: 'logo_url', label: 'URL del logo', type: 'image' },
      { key: 'mostrar_redes', label: 'Mostrar redes sociales', type: 'toggle' },
    ],
  },
  texto: {
    contenido: [
      { key: 'contenido', label: 'Contenido', type: 'textarea', aiEnabled: true },
      { key: 'alineacion', label: 'Alineacion', type: 'alignment' },
    ],
  },
  galeria: {
    contenido: [
      { key: 'titulo_seccion', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo_seccion', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
      { key: 'layout', label: 'Diseno', type: 'select', options: [
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
  video: {
    contenido: [
      { key: 'titulo_seccion', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo_seccion', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
      { key: 'video_url', label: 'URL del video', type: 'url', placeholder: 'YouTube, Vimeo o MP4' },
      { key: 'video_tipo', label: 'Tipo', type: 'select', options: [
        { value: 'youtube', label: 'YouTube' },
        { value: 'vimeo', label: 'Vimeo' },
        { value: 'mp4', label: 'MP4 directo' },
      ]},
      { key: 'autoplay', label: 'Reproduccion automatica', type: 'toggle' },
      { key: 'mostrar_controles', label: 'Mostrar controles', type: 'toggle' },
    ],
  },
  separador: {
    contenido: [
      { key: 'estilo', label: 'Estilo', type: 'select', options: [
        { value: 'linea', label: 'Linea' },
        { value: 'espacio', label: 'Espacio' },
        { value: 'ondas', label: 'Ondas' },
      ]},
      { key: 'altura', label: 'Altura (px)', type: 'number', min: 10, max: 200 },
      { key: 'color', label: 'Color', type: 'color' },
    ],
  },
  pricing: {
    contenido: [
      { key: 'titulo_seccion', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo_seccion', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
    ],
  },
  faq: {
    contenido: [
      { key: 'titulo_seccion', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo_seccion', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
    ],
  },
  countdown: {
    contenido: [
      { key: 'titulo', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
      { key: 'fecha_objetivo', label: 'Fecha objetivo', type: 'text', placeholder: 'YYYY-MM-DD' },
      { key: 'texto_finalizado', label: 'Texto al finalizar', type: 'text', aiEnabled: true },
    ],
  },
  stats: {
    contenido: [
      { key: 'titulo_seccion', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo_seccion', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
    ],
  },
  timeline: {
    contenido: [
      { key: 'titulo_seccion', label: 'Titulo', type: 'text', aiEnabled: true },
      { key: 'subtitulo_seccion', label: 'Subtitulo', type: 'textarea', aiEnabled: true },
      { key: 'layout', label: 'Disposicion', type: 'select', options: [
        { value: 'alternado', label: 'Alternado (zigzag)' },
        { value: 'izquierda', label: 'Todo a la izquierda' },
        { value: 'derecha', label: 'Todo a la derecha' },
      ]},
      { key: 'color_linea', label: 'Color de linea', type: 'color' },
      { key: 'items', label: 'Hitos', type: 'itemsEditor', itemType: 'timeline' },
    ],
  },
};
