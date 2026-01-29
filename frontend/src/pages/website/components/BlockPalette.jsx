/**
 * ====================================================================
 * BLOCK PALETTE
 * ====================================================================
 * Paleta de bloques disponibles para agregar al canvas.
 * Los bloques se pueden arrastrar directamente al canvas o hacer clic
 * para agregarlos al final de la pagina.
 */

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
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
  GripVertical,
} from 'lucide-react';

/**
 * Iconos para cada tipo de bloque
 */
const ICONOS_BLOQUES = {
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

/**
 * Colores para cada tipo de bloque
 */
const COLORES_BLOQUES = {
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

/**
 * Descripciones de cada bloque
 */
const DESCRIPCIONES_BLOQUES = {
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

/**
 * BlockPalette - Paleta de bloques disponibles
 *
 * @param {Object} props
 * @param {Array} props.tiposBloques - Lista de tipos de bloques disponibles
 * @param {Function} props.onAgregarBloque - Callback al agregar un bloque
 * @param {boolean} props.disabled - Si la paleta está deshabilitada
 * @param {boolean} props.isInDrawer - Si se renderiza dentro de un drawer (móvil)
 */
function BlockPalette({ tiposBloques = [], onAgregarBloque, disabled, isInDrawer = false }) {
  // Si no hay tipos del backend, usar lista hardcoded
  const tipos = tiposBloques.length > 0
    ? tiposBloques
    : [
        { tipo: 'hero', nombre: 'Hero' },
        { tipo: 'servicios', nombre: 'Servicios' },
        { tipo: 'testimonios', nombre: 'Testimonios' },
        { tipo: 'equipo', nombre: 'Equipo' },
        { tipo: 'cta', nombre: 'CTA' },
        { tipo: 'contacto', nombre: 'Contacto' },
        { tipo: 'footer', nombre: 'Footer' },
        { tipo: 'texto', nombre: 'Texto' },
        { tipo: 'galeria', nombre: 'Galeria' },
        { tipo: 'video', nombre: 'Video' },
        { tipo: 'separador', nombre: 'Separador' },
        { tipo: 'pricing', nombre: 'Precios' },
        { tipo: 'faq', nombre: 'FAQ' },
        { tipo: 'countdown', nombre: 'Countdown' },
        { tipo: 'stats', nombre: 'Estadisticas' },
        { tipo: 'timeline', nombre: 'Timeline' },
      ];

  // Agrupar por categoria
  const estructurales = tipos.filter(t =>
    ['hero', 'footer', 'separador'].includes(t.tipo)
  );
  const contenido = tipos.filter(t =>
    ['servicios', 'equipo', 'testimonios', 'texto', 'faq', 'timeline'].includes(t.tipo)
  );
  const media = tipos.filter(t =>
    ['galeria', 'video'].includes(t.tipo)
  );
  const interactivos = tipos.filter(t =>
    ['cta', 'contacto', 'pricing', 'countdown', 'stats'].includes(t.tipo)
  );

  const renderGrupo = (titulo, bloques) => {
    if (bloques.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          {titulo}
        </h4>
        {/* Grid 3 columnas en drawer (más espacio), 2 columnas en sidebar */}
        <div className={cn(
          'grid gap-2',
          isInDrawer ? 'grid-cols-3' : 'grid-cols-2'
        )}>
          {bloques.map((bloque) => (
            <DraggableBloqueCard
              key={bloque.tipo}
              tipo={bloque.tipo}
              nombre={bloque.nombre}
              onClick={() => onAgregarBloque(bloque.tipo)}
              disabled={disabled}
              isInDrawer={isInDrawer}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - oculto en drawer porque el Drawer ya tiene título */}
      {!isInDrawer && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Agregar bloque</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Arrastra al canvas o haz clic para agregar
          </p>
        </div>
      )}

      {/* Bloques */}
      <div className={cn(
        'flex-1 overflow-y-auto',
        isInDrawer ? 'p-2' : 'p-4'
      )}>
        {disabled && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Selecciona una pagina para agregar bloques
            </p>
          </div>
        )}

        {renderGrupo('Estructura', estructurales)}
        {renderGrupo('Contenido', contenido)}
        {renderGrupo('Media', media)}
        {renderGrupo('Interactivos', interactivos)}
      </div>
    </div>
  );
}

/**
 * Card de bloque individual con soporte para drag
 */
const DraggableBloqueCard = memo(function DraggableBloqueCard({ tipo, nombre, onClick, disabled, isInDrawer = false }) {
  const Icono = ICONOS_BLOQUES[tipo] || Layout;
  const colores = COLORES_BLOQUES[tipo] || { bg: 'bg-gray-100', text: 'text-gray-600', dark: 'dark:bg-gray-700 dark:text-gray-400' };
  const descripcion = DESCRIPCIONES_BLOQUES[tipo] || '';

  // Setup draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `palette-${tipo}`,
    data: {
      tipo,
      source: 'palette',
    },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-left',
        'transition-all cursor-grab active:cursor-grabbing',
        'hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md',
        'group relative',
        // Padding más grande en drawer para mejor touch target
        isInDrawer ? 'p-4' : 'p-3',
        isDragging && 'opacity-50 scale-95',
        disabled && 'opacity-50 cursor-not-allowed hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-none'
      )}
      title={descripcion}
    >
      {/* Drag indicator - oculto en móvil (drawer) */}
      {!isInDrawer && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-gray-300 dark:text-gray-600" />
        </div>
      )}

      <div className={cn(
        'rounded-lg flex items-center justify-center mb-2',
        'group-hover:scale-110 transition-transform',
        colores.bg,
        colores.dark,
        // Icono más grande en drawer para mejor touch target
        isInDrawer ? 'w-10 h-10' : 'w-8 h-8'
      )}>
        <Icono className={cn(colores.text, isInDrawer ? 'w-5 h-5' : 'w-4 h-4')} />
      </div>
      <p className={cn(
        'font-medium text-gray-900 dark:text-gray-100',
        isInDrawer ? 'text-sm' : 'text-xs'
      )}>{nombre}</p>
    </div>
  );
});

export default memo(BlockPalette);
