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
import { registerBlockPreviews } from '@/components/editor-framework/dnd/previewRegistry';

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

// ========== PREVIEWS DE BLOQUES (registrados en previewRegistry) ==========

const HeroPreview = () => (
  <div className="w-full h-24 bg-gradient-to-r from-primary-600 to-primary-700 rounded-md flex flex-col items-center justify-center text-white p-2">
    <div className="w-16 h-2 bg-white/80 rounded mb-1.5" />
    <div className="w-24 h-1.5 bg-white/50 rounded mb-2" />
    <div className="w-12 h-4 bg-white rounded text-[8px] flex items-center justify-center font-medium text-primary-600">
      CTA
    </div>
  </div>
);

const ServiciosPreview = () => (
  <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
    <div className="w-12 h-1.5 bg-primary-500 rounded mx-auto mb-2" />
    <div className="grid grid-cols-3 gap-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-1" />
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const TestimoniosPreview = () => (
  <div className="w-full h-24 bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded mb-1" />
        <div className="w-3/4 h-1.5 bg-gray-200 dark:bg-gray-600 rounded mb-1" />
        <div className="w-1/2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded" />
        <div className="flex gap-0.5 mt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-2 h-2 bg-amber-400 rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const EquipoPreview = () => (
  <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
    <div className="w-12 h-1.5 bg-primary-500 rounded mx-auto mb-2" />
    <div className="flex justify-center gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full mb-1" />
          <div className="w-8 h-1 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const CtaPreview = ({ tema }) => {
  const primaryColor = tema?.color_primario || '#753572';
  return (
    <div className="w-full h-24 rounded-md flex flex-col items-center justify-center p-2" style={{ backgroundColor: primaryColor }}>
      <div className="w-20 h-2 bg-white/80 rounded mb-1.5" />
      <div className="w-28 h-1.5 bg-white/50 rounded mb-2" />
      <div className="w-16 h-5 bg-white rounded text-[8px] flex items-center justify-center font-medium" style={{ color: primaryColor }}>
        Accion
      </div>
    </div>
  );
};

const ContactoPreview = () => (
  <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
    <div className="w-12 h-1.5 bg-primary-500 rounded mx-auto mb-2" />
    <div className="space-y-1.5">
      <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded" />
      <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded" />
      <div className="w-1/3 h-4 bg-primary-500 rounded" />
    </div>
  </div>
);

const FooterPreview = ({ tema }) => {
  const secondaryColor = tema?.color_secundario || '#1F2937';
  return (
    <div className="w-full h-24 rounded-md p-2" style={{ backgroundColor: secondaryColor }}>
      <div className="flex justify-between items-start">
        <div className="w-12 h-4 bg-white/20 rounded" />
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-4 h-4 bg-white/20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="mt-auto pt-4">
        <div className="w-full h-px bg-white/10" />
        <div className="w-24 h-1 bg-white/20 rounded mx-auto mt-2" />
      </div>
    </div>
  );
};

const TextoPreview = () => (
  <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
    <div className="space-y-1.5">
      <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded" />
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-3/4 h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-1/2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  </div>
);

const GaleriaPreview = () => (
  <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
    <div className="grid grid-cols-3 gap-1 h-full">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
  </div>
);

const VideoPreview = () => (
  <div className="w-full h-24 bg-gray-900 rounded-md flex items-center justify-center">
    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
      <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-1" />
    </div>
  </div>
);

const SeparadorPreview = () => (
  <div className="w-full h-16 bg-white dark:bg-gray-800 rounded-md flex items-center justify-center border border-gray-200 dark:border-gray-700">
    <div className="w-2/3 h-px bg-gray-300 dark:bg-gray-600" />
  </div>
);

const PricingPreview = () => (
  <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
    <div className="flex gap-1 h-full">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex-1 rounded p-1 border ${i === 2 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded mb-1" />
          <div className="w-2/3 h-2 bg-gray-300 dark:bg-gray-500 rounded mb-1 mx-auto" />
          <div className="w-full h-8 bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const FaqPreview = () => (
  <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
    <div className="space-y-1.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="w-3 h-3 bg-primary-200 dark:bg-primary-800 rounded-full flex-shrink-0" />
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const CountdownPreview = ({ tema }) => {
  const primaryColor = tema?.color_primario || '#753572';
  return (
    <div className="w-full h-24 rounded-md flex flex-col items-center justify-center p-2" style={{ backgroundColor: primaryColor }}>
      <div className="w-16 h-1.5 bg-white/80 rounded mb-2" />
      <div className="flex gap-2">
        {['00', '12', '45', '30'].map((num, i) => (
          <div key={i} className="w-6 h-8 bg-white/20 rounded flex items-center justify-center text-[8px] text-white font-bold">
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};

const StatsPreview = ({ tema }) => {
  const primaryColor = tema?.color_primario || '#753572';
  return (
    <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-around items-center h-full">
        {['+500', '10', '98%', '24/7'].map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-sm font-bold" style={{ color: primaryColor }}>{stat}</div>
            <div className="w-8 h-1 bg-gray-200 dark:bg-gray-600 rounded mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelinePreview = () => (
  <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
    <div className="flex items-start gap-2 h-full">
      <div className="flex flex-col items-center h-full">
        <div className="w-3 h-3 bg-primary-500 rounded-full" />
        <div className="w-0.5 flex-1 bg-primary-200 dark:bg-primary-800" />
        <div className="w-3 h-3 bg-primary-300 rounded-full" />
        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
        <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
      <div className="flex-1 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1">
            <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

registerBlockPreviews({
  hero: HeroPreview,
  servicios: ServiciosPreview,
  testimonios: TestimoniosPreview,
  equipo: EquipoPreview,
  cta: CtaPreview,
  contacto: ContactoPreview,
  footer: FooterPreview,
  texto: TextoPreview,
  galeria: GaleriaPreview,
  video: VideoPreview,
  separador: SeparadorPreview,
  pricing: PricingPreview,
  faq: FaqPreview,
  countdown: CountdownPreview,
  stats: StatsPreview,
  timeline: TimelinePreview,
});

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
