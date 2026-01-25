/**
 * ====================================================================
 * GALERIA CANVAS BLOCK
 * ====================================================================
 * Bloque de galería de imágenes para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';
import { InlineText } from '../InlineEditor';

/**
 * Galeria Canvas Block
 */
function GaleriaCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Nuestra Galería',
    layout = 'grid', // 'grid' | 'masonry' | 'carousel'
    columnas = 3,
    imagenes = [],
  } = contenido;

  // Default images if empty
  const imagenesRender =
    imagenes.length > 0
      ? imagenes
      : [
          { url: '', alt: 'Imagen 1', caption: '' },
          { url: '', alt: 'Imagen 2', caption: '' },
          { url: '', alt: 'Imagen 3', caption: '' },
          { url: '', alt: 'Imagen 4', caption: '' },
          { url: '', alt: 'Imagen 5', caption: '' },
          { url: '', alt: 'Imagen 6', caption: '' },
        ];

  // Grid columns class
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        {titulo_seccion && (
          <div className="text-center mb-12">
            {isEditing ? (
              <InlineText
                value={titulo_seccion}
                onChange={(value) => onContentChange({ titulo_seccion: value })}
                placeholder="Título de sección"
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white block"
                as="h2"
              />
            ) : (
              <h2
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                style={{ fontFamily: 'var(--fuente-titulos)' }}
              >
                {titulo_seccion}
              </h2>
            )}
          </div>
        )}

        {/* Gallery Grid */}
        <div
          className={cn(
            layout === 'carousel'
              ? 'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4'
              : `grid gap-4 ${gridCols[columnas] || gridCols[3]}`,
            layout === 'masonry' && 'masonry-cols'
          )}
        >
          {imagenesRender.map((imagen, index) => (
            <div
              key={index}
              className={cn(
                'group relative rounded-xl overflow-hidden',
                layout === 'carousel' && 'min-w-[280px] snap-center',
                layout === 'masonry' && index % 3 === 0 && 'row-span-2'
              )}
            >
              {imagen.url ? (
                <img
                  src={imagen.url}
                  alt={imagen.alt || `Imagen ${index + 1}`}
                  className={cn(
                    'w-full h-full object-cover',
                    layout !== 'masonry' && 'aspect-square'
                  )}
                />
              ) : (
                // Placeholder
                <div
                  className={cn(
                    'w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center',
                    layout !== 'masonry' ? 'aspect-square' : 'min-h-[200px]'
                  )}
                >
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* Caption overlay */}
              {imagen.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-white text-sm">{imagen.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(GaleriaCanvasBlock);
