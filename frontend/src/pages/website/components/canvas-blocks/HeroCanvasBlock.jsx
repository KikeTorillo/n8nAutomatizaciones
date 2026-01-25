/**
 * ====================================================================
 * HERO CANVAS BLOCK
 * ====================================================================
 * Bloque Hero editable para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { InlineText } from '../InlineEditor';

/**
 * Hero Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isEditing - Si está en modo inline editing
 * @param {Function} props.onContentChange - Callback al cambiar contenido
 */
function HeroCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo = 'Tu Título Principal',
    subtitulo = 'Describe tu negocio en pocas palabras',
    imagen_url,
    imagen_overlay = 0.5,
    alineacion = 'center',
    boton_texto = 'Comenzar',
    boton_url = '#contacto',
  } = contenido;

  // Alignment classes
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <section
      className={cn(
        'relative min-h-[400px] flex flex-col justify-center py-20 px-6',
        alignmentClasses[alineacion]
      )}
      style={{
        backgroundImage: imagen_url ? `url(${imagen_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: !imagen_url
          ? `var(--color-primario, ${tema?.color_primario || '#753572'})`
          : undefined,
      }}
    >
      {/* Overlay */}
      {imagen_url && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: imagen_overlay }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        {/* Title */}
        {isEditing ? (
          <InlineText
            value={titulo}
            onChange={(value) => onContentChange({ titulo: value })}
            placeholder="Escribe tu título..."
            className={cn(
              'text-4xl md:text-5xl lg:text-6xl font-bold mb-4 block w-full',
              imagen_url || !tema?.color_fondo
                ? 'text-white'
                : 'text-gray-900 dark:text-white'
            )}
            as="h1"
          />
        ) : (
          <h1
            className={cn(
              'text-4xl md:text-5xl lg:text-6xl font-bold mb-4',
              imagen_url || !tema?.color_fondo
                ? 'text-white'
                : 'text-gray-900 dark:text-white'
            )}
            style={{ fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h1>
        )}

        {/* Subtitle */}
        {isEditing ? (
          <InlineText
            value={subtitulo}
            onChange={(value) => onContentChange({ subtitulo: value })}
            placeholder="Escribe tu subtítulo..."
            className={cn(
              'text-xl md:text-2xl mb-8 block w-full',
              imagen_url || !tema?.color_fondo
                ? 'text-white/90'
                : 'text-gray-600 dark:text-gray-300'
            )}
            as="p"
          />
        ) : (
          <p
            className={cn(
              'text-xl md:text-2xl mb-8',
              imagen_url || !tema?.color_fondo
                ? 'text-white/90'
                : 'text-gray-600 dark:text-gray-300'
            )}
            style={{ fontFamily: 'var(--fuente-cuerpo)' }}
          >
            {subtitulo}
          </p>
        )}

        {/* CTA Button */}
        {boton_texto && (
          <button
            className={cn(
              'px-8 py-3 rounded-lg font-semibold text-lg transition-all',
              'bg-white text-gray-900 hover:bg-gray-100',
              'shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            )}
            style={{
              backgroundColor: imagen_url
                ? 'white'
                : `var(--color-acento, ${tema?.color_acento || '#F59E0B'})`,
              color: imagen_url ? 'var(--color-primario)' : 'white',
            }}
          >
            {isEditing ? (
              <InlineText
                value={boton_texto}
                onChange={(value) => onContentChange({ boton_texto: value })}
                placeholder="Texto del botón"
                className="font-semibold"
              />
            ) : (
              boton_texto
            )}
          </button>
        )}
      </div>
    </section>
  );
}

export default memo(HeroCanvasBlock);
