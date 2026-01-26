/**
 * ====================================================================
 * TIMELINE CANVAS BLOCK
 * ====================================================================
 * Bloque de linea de tiempo para historia/proceso en el canvas WYSIWYG.
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

/**
 * Timeline Item Component
 */
function TimelineItem({ item, index, total, layout, colorLinea, isEditing, onUpdate }) {
  const { fecha, titulo, descripcion, icono = 'star' } = item;
  const Icon = ICONS[icono] || Star;
  const isLeft = layout === 'izquierda' || (layout === 'alternado' && index % 2 === 0);
  const isLast = index === total - 1;

  return (
    <div
      className={cn(
        'relative flex items-start gap-6',
        layout === 'alternado' && 'md:justify-center',
        layout === 'alternado' && index % 2 === 1 && 'md:flex-row-reverse'
      )}
    >
      {/* Content - Left side for alternating */}
      {layout === 'alternado' && (
        <div
          className={cn(
            'hidden md:block md:w-5/12',
            index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'
          )}
        >
          {index % 2 === 0 && (
            <TimelineContent
              item={item}
              index={index}
              isEditing={isEditing}
              onUpdate={onUpdate}
            />
          )}
        </div>
      )}

      {/* Timeline Line & Dot */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center z-10 shadow-lg"
          style={{ backgroundColor: colorLinea }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Line */}
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-[80px]"
            style={{ backgroundColor: `${colorLinea}40` }}
          />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 pb-12',
          layout === 'alternado' && 'md:w-5/12',
          layout === 'alternado' && index % 2 === 0 && 'md:hidden'
        )}
      >
        <TimelineContent
          item={item}
          index={index}
          isEditing={isEditing}
          onUpdate={onUpdate}
        />
      </div>

      {/* Content - Right side for alternating */}
      {layout === 'alternado' && (
        <div
          className={cn(
            'hidden md:block md:w-5/12',
            index % 2 === 1 ? 'text-right pr-8' : 'text-left pl-8'
          )}
        >
          {index % 2 === 1 && (
            <TimelineContent
              item={item}
              index={index}
              isEditing={isEditing}
              onUpdate={onUpdate}
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Timeline Content Component
 */
function TimelineContent({ item, index, isEditing, onUpdate }) {
  const { fecha, titulo, descripcion } = item;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
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
 * Timeline Canvas Block
 */
function TimelineCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Nuestra Historia',
    subtitulo_seccion = 'Un recorrido por nuestros logros',
    layout = 'alternado',
    color_linea = '#3B82F6',
    items = [],
  } = contenido;

  // Default items if empty
  const hitos =
    items.length > 0
      ? items
      : [
          { fecha: '2020', titulo: 'Fundacion', descripcion: 'Comenzamos nuestra aventura con una vision clara.', icono: 'rocket' },
          { fecha: '2021', titulo: 'Primer Hito', descripcion: 'Alcanzamos nuestros primeros 100 clientes.', icono: 'flag' },
          { fecha: '2022', titulo: 'Expansion', descripcion: 'Abrimos nuestra segunda ubicacion.', icono: 'map-pin' },
          { fecha: '2023', titulo: 'Reconocimiento', descripcion: 'Recibimos el premio a la excelencia en servicio.', icono: 'award' },
        ];

  /**
   * Update a single item
   */
  const updateItem = (index, field, value) => {
    const newItems = [...hitos];
    newItems[index] = { ...newItems[index], [field]: value };
    onContentChange({ items: newItems });
  };

  const colorPrimario = tema?.color_primario || '#753572';
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
        <div className="relative">
          {hitos.map((item, index) => (
            <TimelineItem
              key={index}
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
      </div>
    </section>
  );
}

export default memo(TimelineCanvasBlock);
