/**
 * ====================================================================
 * TESTIMONIOS CANVAS BLOCK
 * ====================================================================
 * Bloque de testimonios editable para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Star, Quote } from 'lucide-react';
import { InlineText } from '../InlineEditor';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * Testimonios Canvas Block
 */
function TestimoniosCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const WEB = THEME_FALLBACK_COLORS.website;
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Lo que dicen nuestros clientes',
    layout = 'grid',
    items = [],
  } = contenido;

  // Default items if empty
  const testimonios =
    items.length > 0
      ? items
      : [
          {
            nombre: 'María García',
            texto: 'Excelente servicio, muy profesionales y atentos. Lo recomiendo totalmente.',
            rating: 5,
            foto_url: null,
          },
          {
            nombre: 'Carlos López',
            texto: 'La mejor experiencia que he tenido. Definitivamente volveré.',
            rating: 5,
            foto_url: null,
          },
          {
            nombre: 'Ana Martínez',
            texto: 'Superaron mis expectativas. El equipo es increíble.',
            rating: 5,
            foto_url: null,
          },
        ];

  /**
   * Update a single testimonial
   */
  const updateItem = (index, field, value) => {
    const newItems = [...testimonios];
    newItems[index] = { ...newItems[index], [field]: value };
    onContentChange({ items: newItems });
  };

  /**
   * Render stars
   */
  const renderStars = (rating) => (
    <div className="flex gap-1 mb-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
          )}
        />
      ))}
    </div>
  );

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
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

        {/* Testimonials */}
        <div
          className={cn(
            layout === 'carousel'
              ? 'flex gap-6 overflow-x-auto snap-x snap-mandatory'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          )}
        >
          {testimonios.map((testimonio, index) => (
            <div
              key={index}
              className={cn(
                'bg-gray-50 dark:bg-gray-900 rounded-xl p-6 relative',
                layout === 'carousel' && 'min-w-[300px] snap-center'
              )}
            >
              {/* Quote icon */}
              <Quote
                className="absolute top-4 right-4 w-8 h-8 opacity-10"
                style={{ color: `var(--color-primario, ${tema?.color_primario || WEB.primario})` }}
              />

              {/* Rating */}
              {renderStars(testimonio.rating)}

              {/* Text */}
              {isEditing ? (
                <InlineText
                  value={testimonio.texto}
                  onChange={(value) => updateItem(index, 'texto', value)}
                  placeholder="Testimonio del cliente"
                  className="text-gray-600 dark:text-gray-300 mb-4 block italic"
                  as="p"
                  multiline
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                  "{testimonio.texto}"
                </p>
              )}

              {/* Author */}
              <div className="flex items-center gap-3 mt-4">
                {/* Avatar */}
                {testimonio.foto_url ? (
                  <img
                    src={testimonio.foto_url}
                    alt={testimonio.nombre}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{
                      backgroundColor: `var(--color-primario, ${tema?.color_primario || WEB.primario})`,
                    }}
                  >
                    {testimonio.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}

                {/* Name */}
                {isEditing ? (
                  <InlineText
                    value={testimonio.nombre}
                    onChange={(value) => updateItem(index, 'nombre', value)}
                    placeholder="Nombre"
                    className="font-semibold text-gray-900 dark:text-white"
                  />
                ) : (
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {testimonio.nombre}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(TestimoniosCanvasBlock);
