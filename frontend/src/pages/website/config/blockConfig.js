/**
 * ====================================================================
 * CONFIGURACIÓN DE BLOQUES - WEBSITE BUILDER
 * ====================================================================
 * Define los iconos, colores y descripciones de bloques para el Website Builder.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import {
  Layout,
  Briefcase,
  MessageSquareQuote,
  Users,
  MousePointerClick,
  Mail,
  PanelBottom,
  Type,
  Image,
  Video,
  Minus,
  DollarSign,
  HelpCircle,
  Clock,
  TrendingUp,
  GitBranch,
} from 'lucide-react';

// ========== CATEGORÍAS DE BLOQUES ==========

export const CATEGORIAS_WEBSITE = {
  estructura: { label: 'Estructura', orden: 1 },
  contenido: { label: 'Contenido', orden: 2 },
  media: { label: 'Media', orden: 3 },
  interactivos: { label: 'Interactivos', orden: 4 },
};

// ========== ICONOS POR TIPO ==========

export const ICONOS_BLOQUES = {
  hero: Layout,
  servicios: Briefcase,
  testimonios: MessageSquareQuote,
  equipo: Users,
  cta: MousePointerClick,
  contacto: Mail,
  footer: PanelBottom,
  texto: Type,
  galeria: Image,
  video: Video,
  separador: Minus,
  pricing: DollarSign,
  faq: HelpCircle,
  countdown: Clock,
  stats: TrendingUp,
  timeline: GitBranch,
};

// ========== NOMBRES POR TIPO ==========

export const NOMBRES_BLOQUES = {
  hero: 'Hero',
  servicios: 'Servicios',
  testimonios: 'Testimonios',
  equipo: 'Equipo',
  cta: 'Llamada a Accion',
  contacto: 'Contacto',
  footer: 'Pie de Pagina',
  texto: 'Texto',
  galeria: 'Galeria',
  video: 'Video',
  separador: 'Separador',
  pricing: 'Precios',
  faq: 'Preguntas Frecuentes',
  countdown: 'Cuenta Regresiva',
  stats: 'Estadisticas',
  timeline: 'Linea de Tiempo',
};

// ========== COLORES ÚNICOS POR TIPO ==========

export const COLORES_BLOQUES = {
  hero: { bg: 'bg-secondary-100', text: 'text-secondary-600', dark: 'dark:bg-secondary-900/30 dark:text-secondary-400' },
  servicios: { bg: 'bg-primary-100', text: 'text-primary-600', dark: 'dark:bg-primary-900/30 dark:text-primary-400' },
  testimonios: { bg: 'bg-amber-100', text: 'text-amber-600', dark: 'dark:bg-amber-900/30 dark:text-amber-400' },
  equipo: { bg: 'bg-green-100', text: 'text-green-600', dark: 'dark:bg-green-900/30 dark:text-green-400' },
  cta: { bg: 'bg-red-100', text: 'text-red-600', dark: 'dark:bg-red-900/30 dark:text-red-400' },
  contacto: { bg: 'bg-primary-100', text: 'text-primary-600', dark: 'dark:bg-primary-900/30 dark:text-primary-400' },
  footer: { bg: 'bg-gray-100', text: 'text-gray-600', dark: 'dark:bg-gray-700 dark:text-gray-400' },
  texto: { bg: 'bg-slate-100', text: 'text-slate-600', dark: 'dark:bg-slate-800 dark:text-slate-400' },
  galeria: { bg: 'bg-pink-100', text: 'text-pink-600', dark: 'dark:bg-pink-900/30 dark:text-pink-400' },
  video: { bg: 'bg-rose-100', text: 'text-rose-600', dark: 'dark:bg-rose-900/30 dark:text-rose-400' },
  separador: { bg: 'bg-neutral-100', text: 'text-neutral-600', dark: 'dark:bg-neutral-800 dark:text-neutral-400' },
  pricing: { bg: 'bg-emerald-100', text: 'text-emerald-600', dark: 'dark:bg-emerald-900/30 dark:text-emerald-400' },
  faq: { bg: 'bg-sky-100', text: 'text-sky-600', dark: 'dark:bg-sky-900/30 dark:text-sky-400' },
  countdown: { bg: 'bg-orange-100', text: 'text-orange-600', dark: 'dark:bg-orange-900/30 dark:text-orange-400' },
  stats: { bg: 'bg-violet-100', text: 'text-violet-600', dark: 'dark:bg-violet-900/30 dark:text-violet-400' },
  timeline: { bg: 'bg-teal-100', text: 'text-teal-600', dark: 'dark:bg-teal-900/30 dark:text-teal-400' },
};

// ========== DESCRIPCIONES POR TIPO ==========

export const DESCRIPCIONES_BLOQUES = {
  hero: 'Banner principal con titulo y CTA',
  servicios: 'Tarjetas de servicios ofrecidos',
  testimonios: 'Opiniones de clientes',
  equipo: 'Miembros del equipo',
  cta: 'Llamada a la accion',
  contacto: 'Formulario e info de contacto',
  footer: 'Pie de pagina con links',
  texto: 'Texto enriquecido libre',
  galeria: 'Galeria de imagenes',
  video: 'Video de YouTube/Vimeo',
  separador: 'Linea divisoria',
  pricing: 'Tablas de precios y planes',
  faq: 'Preguntas frecuentes en accordion',
  countdown: 'Contador regresivo para eventos',
  stats: 'Numeros y estadisticas animadas',
  timeline: 'Linea de tiempo de hitos',
};

// ========== LISTA DE BLOQUES DISPONIBLES ==========

/**
 * Lista por defecto de bloques (se usa si tiposBloques del backend está vacío)
 */
export const BLOQUES_WEBSITE_DEFAULT = [
  { tipo: 'hero', nombre: 'Hero', categoria: 'estructura' },
  { tipo: 'footer', nombre: 'Footer', categoria: 'estructura' },
  { tipo: 'separador', nombre: 'Separador', categoria: 'estructura' },
  { tipo: 'servicios', nombre: 'Servicios', categoria: 'contenido' },
  { tipo: 'equipo', nombre: 'Equipo', categoria: 'contenido' },
  { tipo: 'testimonios', nombre: 'Testimonios', categoria: 'contenido' },
  { tipo: 'texto', nombre: 'Texto', categoria: 'contenido' },
  { tipo: 'faq', nombre: 'FAQ', categoria: 'contenido' },
  { tipo: 'timeline', nombre: 'Timeline', categoria: 'contenido' },
  { tipo: 'galeria', nombre: 'Galería', categoria: 'media' },
  { tipo: 'video', nombre: 'Video', categoria: 'media' },
  { tipo: 'cta', nombre: 'CTA', categoria: 'interactivos' },
  { tipo: 'contacto', nombre: 'Contacto', categoria: 'interactivos' },
  { tipo: 'pricing', nombre: 'Precios', categoria: 'interactivos' },
  { tipo: 'countdown', nombre: 'Countdown', categoria: 'interactivos' },
  { tipo: 'stats', nombre: 'Estadísticas', categoria: 'interactivos' },
];

/**
 * Normaliza tipos de bloques del backend al formato esperado por BlockPalette
 *
 * @param {Array} tiposBloques - Tipos del backend [{tipo, nombre}]
 * @returns {Array} Bloques normalizados con icono, descripción y categoría
 */
export function normalizarBloques(tiposBloques = []) {
  const tipos = tiposBloques.length > 0 ? tiposBloques : BLOQUES_WEBSITE_DEFAULT;

  return tipos.map((bloque) => {
    // Buscar categoría del bloque
    const defaultBloque = BLOQUES_WEBSITE_DEFAULT.find((b) => b.tipo === bloque.tipo);

    return {
      tipo: bloque.tipo,
      nombre: bloque.nombre,
      icon: ICONOS_BLOQUES[bloque.tipo] || Layout,
      descripcion: DESCRIPCIONES_BLOQUES[bloque.tipo] || '',
      categoria: defaultBloque?.categoria || 'contenido',
    };
  });
}
