/**
 * ====================================================================
 * SERVICIOS CANVAS BLOCK
 * ====================================================================
 * Bloque de servicios editable para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { InlineText } from '../InlineEditor';
import * as LucideIcons from 'lucide-react';

/**
 * Servicios Canvas Block
 */
function ServiciosCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Nuestros Servicios',
    subtitulo_seccion = 'Lo que ofrecemos',
    columnas = 3,
    mostrar_precio = false,
    items = [],
  } = contenido;

  // Default items if empty
  const servicios =
    items.length > 0
      ? items
      : [
          { icono: 'Scissors', titulo: 'Servicio 1', descripcion: 'Descripción del servicio', precio: 0 },
          { icono: 'Brush', titulo: 'Servicio 2', descripcion: 'Descripción del servicio', precio: 0 },
          { icono: 'Sparkles', titulo: 'Servicio 3', descripcion: 'Descripción del servicio', precio: 0 },
        ];

  // Grid columns class
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  /**
   * Update a single service item
   */
  const updateItem = (index, field, value) => {
    const newItems = [...servicios];
    newItems[index] = { ...newItems[index], [field]: value };
    onContentChange({ items: newItems });
  };

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          {isEditing ? (
            <InlineText
              value={titulo_seccion}
              onChange={(value) => onContentChange({ titulo_seccion: value })}
              placeholder="Título de sección"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 block"
              as="h2"
            />
          ) : (
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              style={{ fontFamily: 'var(--fuente-titulos)' }}
            >
              {titulo_seccion}
            </h2>
          )}

          {subtitulo_seccion && (
            isEditing ? (
              <InlineText
                value={subtitulo_seccion}
                onChange={(value) => onContentChange({ subtitulo_seccion: value })}
                placeholder="Subtítulo"
                className="text-lg text-gray-600 dark:text-gray-400 block"
                as="p"
              />
            ) : (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {subtitulo_seccion}
              </p>
            )
          )}
        </div>

        {/* Services Grid */}
        <div className={cn('grid gap-8', gridCols[columnas] || gridCols[3])}>
          {servicios.map((servicio, index) => {
            // Get icon component
            const IconComponent = LucideIcons[servicio.icono] || LucideIcons.Star;

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `var(--color-primario, ${tema?.color_primario || '#753572'})20`,
                    color: `var(--color-primario, ${tema?.color_primario || '#753572'})`,
                  }}
                >
                  <IconComponent className="w-7 h-7" />
                </div>

                {/* Title */}
                {isEditing ? (
                  <InlineText
                    value={servicio.titulo}
                    onChange={(value) => updateItem(index, 'titulo', value)}
                    placeholder="Nombre del servicio"
                    className="text-xl font-semibold text-gray-900 dark:text-white mb-2 block"
                    as="h3"
                  />
                ) : (
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {servicio.titulo}
                  </h3>
                )}

                {/* Description */}
                {isEditing ? (
                  <InlineText
                    value={servicio.descripcion}
                    onChange={(value) => updateItem(index, 'descripcion', value)}
                    placeholder="Descripción del servicio"
                    className="text-gray-600 dark:text-gray-400 block"
                    as="p"
                    multiline
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    {servicio.descripcion}
                  </p>
                )}

                {/* Price */}
                {mostrar_precio && servicio.precio > 0 && (
                  <p
                    className="mt-4 text-lg font-bold"
                    style={{ color: `var(--color-primario, ${tema?.color_primario || '#753572'})` }}
                  >
                    ${servicio.precio.toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default memo(ServiciosCanvasBlock);
