/**
 * ====================================================================
 * TIMELINE CANVAS BLOCK
 * ====================================================================
 * Bloque de linea de tiempo para historia/proceso en el canvas WYSIWYG.
 *
 * Layouts soportados:
 * - alternado: Zigzag izquierda-derecha (default)
 * - izquierda: Todo el contenido a la izquierda del dot
 * - derecha: Todo el contenido a la derecha del dot
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  Rocket,
  Flag,
  MapPin,
  Award,
  Users,
  Building,
  Star,
  Zap,
  Target,
  Heart,
} from 'lucide-react';
import { InlineText } from '../InlineEditor';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

// Icon mapping
const ICONS = {
  rocket: Rocket,
  flag: Flag,
  'map-pin': MapPin,
  award: Award,
  users: Users,
  building: Building,
  star: Star,
  zap: Zap,
  target: Target,
  heart: Heart,
};

// Default items cuando no hay ninguno configurado
const DEFAULT_ITEMS = [
  { fecha: '2020', titulo: 'Fundacion', descripcion: 'Comenzamos nuestra aventura con una vision clara.', icono: 'rocket' },
  { fecha: '2021', titulo: 'Primer Hito', descripcion: 'Alcanzamos nuestros primeros 100 clientes.', icono: 'flag' },
  { fecha: '2022', titulo: 'Expansion', descripcion: 'Abrimos nuestra segunda ubicacion.', icono: 'map-pin' },
  { fecha: '2023', titulo: 'Reconocimiento', descripcion: 'Recibimos el premio a la excelencia en servicio.', icono: 'award' },
];

/**
 * Timeline Content Component - El card con la información
 */
function TimelineContent({ item, index, isEditing, onUpdate, alignment = 'left' }) {
  const { fecha, titulo, descripcion } = item;

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg',
      alignment === 'right' && 'text-right'
    )}>
      {/* Date Badge */}
      {isEditing ? (
        <InlineText
          value={fecha}
          onChange={(value) => onUpdate(index, 'fecha', value)}
          placeholder="Fecha"
          className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 mb-3"
        />
      ) : (
        <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
          {fecha}
        </span>
      )}

      {/* Title */}
      {isEditing ? (
        <InlineText
          value={titulo}
          onChange={(value) => onUpdate(index, 'titulo', value)}
          placeholder="Titulo del hito"
          className="text-xl font-bold text-gray-900 dark:text-white mb-2 block"
          as="h3"
        />
      ) : (
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {titulo}
        </h3>
      )}

      {/* Description */}
      {isEditing ? (
        <InlineText
          value={descripcion}
          onChange={(value) => onUpdate(index, 'descripcion', value)}
          placeholder="Descripcion del hito"
          className="text-gray-600 dark:text-gray-400 block"
          as="p"
          multiline
        />
      ) : (
        <p className="text-gray-600 dark:text-gray-400">{descripcion}</p>
      )}
    </div>
  );
}

/**
 * Timeline Dot Component - El círculo con icono y línea
 */
function TimelineDot({ icon, color, isLast }) {
  const Icon = ICONS[icon] || Star;

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center z-10 shadow-lg"
        style={{ backgroundColor: color }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      {!isLast && (
        <div
          className="w-0.5 flex-1 min-h-[80px]"
          style={{ backgroundColor: `${color}40` }}
        />
      )}
    </div>
  );
}

/**
 * Timeline Item - Layout Izquierda (contenido a la izquierda del dot)
 */
function TimelineItemLeft({ item, index, total, colorLinea, isEditing, onUpdate }) {
  return (
    <div className="flex items-start gap-6 pb-8">
      {/* Content */}
      <div className="flex-1">
        <TimelineContent
          item={item}
          index={index}
          isEditing={isEditing}
          onUpdate={onUpdate}
          alignment="right"
        />
      </div>
      {/* Dot */}
      <TimelineDot
        icon={item.icono}
        color={colorLinea}
        isLast={index === total - 1}
      />
      {/* Spacer for symmetry */}
      <div className="flex-1 hidden md:block" />
    </div>
  );
}

/**
 * Timeline Item - Layout Derecha (contenido a la derecha del dot)
 */
function TimelineItemRight({ item, index, total, colorLinea, isEditing, onUpdate }) {
  return (
    <div className="flex items-start gap-6 pb-8">
      {/* Spacer for symmetry */}
      <div className="flex-1 hidden md:block" />
      {/* Dot */}
      <TimelineDot
        icon={item.icono}
        color={colorLinea}
        isLast={index === total - 1}
      />
      {/* Content */}
      <div className="flex-1">
        <TimelineContent
          item={item}
          index={index}
          isEditing={isEditing}
          onUpdate={onUpdate}
          alignment="left"
        />
      </div>
    </div>
  );
}

/**
 * Timeline Item - Layout Alternado
 */
function TimelineItemAlternado({ item, index, total, colorLinea, isEditing, onUpdate }) {
  const isEven = index % 2 === 0;

  return (
    <div className="flex items-start gap-6 pb-8">
      {/* Left side */}
      <div className={cn('flex-1', !isEven && 'hidden md:block')}>
        {isEven && (
          <TimelineContent
            item={item}
            index={index}
            isEditing={isEditing}
            onUpdate={onUpdate}
            alignment="right"
          />
        )}
      </div>

      {/* Dot (center) */}
      <TimelineDot
        icon={item.icono}
        color={colorLinea}
        isLast={index === total - 1}
      />

      {/* Right side */}
      <div className={cn('flex-1', isEven && 'hidden md:block')}>
        {!isEven && (
          <TimelineContent
            item={item}
            index={index}
            isEditing={isEditing}
            onUpdate={onUpdate}
            alignment="left"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Timeline Item wrapper que selecciona el layout correcto
 */
function TimelineItem({ item, index, total, layout, colorLinea, isEditing, onUpdate }) {
  const props = { item, index, total, colorLinea, isEditing, onUpdate };

  switch (layout) {
    case 'izquierda':
      return <TimelineItemLeft {...props} />;
    case 'derecha':
      return <TimelineItemRight {...props} />;
    case 'alternado':
    default:
      return <TimelineItemAlternado {...props} />;
  }
}

/**
 * Timeline Canvas Block
 */
function TimelineCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Nuestra Historia',
    subtitulo_seccion = 'Un recorrido por nuestros logros',
    layout = 'alternado',
    color_linea,
  } = contenido;

  // Solo usar defaults si items no está definido en contenido
  // Si el usuario vació los items explícitamente, respetar ese valor
  const hasExplicitItems = 'items' in contenido;
  const hitos = hasExplicitItems ? (contenido.items || []) : DEFAULT_ITEMS;

  /**
   * Update a single item
   * Si estamos usando defaults, primero inicializamos los items explícitos
   */
  const updateItem = (index, field, value) => {
    // Siempre trabajar con una copia de los hitos actuales
    const currentItems = hasExplicitItems ? [...(contenido.items || [])] : [...DEFAULT_ITEMS];
    currentItems[index] = { ...currentItems[index], [field]: value };
    onContentChange({ items: currentItems });
  };

  const WEB = THEME_FALLBACK_COLORS.website;
  const colorPrimario = tema?.color_primario || WEB.primario;
  const lineColor = color_linea || colorPrimario;

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          {isEditing ? (
            <>
              <InlineText
                value={titulo_seccion}
                onChange={(value) => onContentChange({ titulo_seccion: value })}
                placeholder="Titulo de seccion"
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white block mb-4"
                as="h2"
              />
              <InlineText
                value={subtitulo_seccion}
                onChange={(value) => onContentChange({ subtitulo_seccion: value })}
                placeholder="Subtitulo"
                className="text-lg text-gray-600 dark:text-gray-400 block"
                as="p"
              />
            </>
          ) : (
            <>
              <h2
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                style={{ fontFamily: 'var(--fuente-titulos)' }}
              >
                {titulo_seccion}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{subtitulo_seccion}</p>
            </>
          )}
        </div>

        {/* Timeline */}
        {hitos.length > 0 ? (
          <div className="relative">
            {hitos.map((item, index) => (
              <TimelineItem
                key={`${index}-${item.fecha}-${item.titulo}`}
                item={item}
                index={index}
                total={hitos.length}
                layout={layout}
                colorLinea={lineColor}
                isEditing={isEditing}
                onUpdate={updateItem}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>No hay hitos configurados.</p>
            {isEditing && (
              <p className="text-sm mt-2">Usa el panel de propiedades para agregar hitos.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TimelineCanvasBlock);
