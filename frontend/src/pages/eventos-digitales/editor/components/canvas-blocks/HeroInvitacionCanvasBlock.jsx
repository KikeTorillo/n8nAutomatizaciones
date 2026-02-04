/**
 * ====================================================================
 * HERO INVITACION CANVAS BLOCK
 * ====================================================================
 * Bloque de portada para invitaciones digitales en el canvas.
 * Soporta edición inline de título, subtítulo y fecha.
 *
 * @version 1.1.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Agregar edición inline
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { InlineText } from '@/components/editor-framework';

/**
 * Hero Invitación Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 * @param {boolean} props.isEditing - Si está en modo inline editing
 * @param {Function} props.onContentChange - Callback al cambiar contenido
 */
function HeroInvitacionCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const titulo = contenido.titulo || 'Nos Casamos';
  const subtitulo = contenido.subtitulo || 'Te invitamos a celebrar nuestro amor';
  const fecha_texto = contenido.fecha_texto || '15 de Junio, 2026';
  const imagen_url = contenido.imagen_url;
  const alineacion = contenido.alineacion || 'center';

  // Fallback: estilos pueden venir en contenido o en estilos
  const imagen_overlay = estilos.imagen_overlay ?? contenido.imagen_overlay ?? 0.3;
  const altura = estilos.altura || contenido.altura || 'full';

  // Clases de altura
  const alturaClasses = {
    auto: 'min-h-[300px]',
    medium: 'min-h-[50vh]',
    full: 'min-h-[100vh]',
  };

  // Clases de alineación
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <section
      className={cn(
        'relative flex flex-col justify-center py-16 px-6',
        alturaClasses[altura] || alturaClasses.full,
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
      <div className="relative z-10 max-w-3xl mx-auto w-full">
        {/* Título */}
        {isEditing ? (
          <InlineText
            value={contenido.titulo || ''}
            onChange={(v) => onContentChange?.({ titulo: v })}
            placeholder="Escribe el título..."
            as="h1"
            className={cn(
              'text-4xl md:text-5xl lg:text-6xl font-bold mb-4',
              'text-white drop-shadow-lg'
            )}
            style={{ fontFamily: 'var(--fuente-titulos)' }}
          />
        ) : (
          <h1
            className={cn(
              'text-4xl md:text-5xl lg:text-6xl font-bold mb-4',
              'text-white drop-shadow-lg'
            )}
            style={{ fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h1>
        )}

        {/* Subtítulo */}
        {isEditing ? (
          <InlineText
            value={contenido.subtitulo || ''}
            onChange={(v) => onContentChange?.({ subtitulo: v })}
            placeholder="Escribe el subtítulo..."
            as="p"
            className={cn(
              'text-xl md:text-2xl mb-6',
              'text-white/90'
            )}
            style={{ fontFamily: 'var(--fuente-cuerpo)' }}
          />
        ) : (
          subtitulo && (
            <p
              className={cn(
                'text-xl md:text-2xl mb-6',
                'text-white/90'
              )}
              style={{ fontFamily: 'var(--fuente-cuerpo)' }}
            >
              {subtitulo}
            </p>
          )
        )}

        {/* Fecha */}
        {isEditing ? (
          <InlineText
            value={contenido.fecha_texto || ''}
            onChange={(v) => onContentChange?.({ fecha_texto: v })}
            placeholder="Escribe la fecha..."
            as="p"
            className={cn(
              'text-lg md:text-xl font-medium tracking-wider uppercase',
              'text-white/80'
            )}
          />
        ) : (
          fecha_texto && (
            <p
              className={cn(
                'text-lg md:text-xl font-medium tracking-wider uppercase',
                'text-white/80'
              )}
            >
              {fecha_texto}
            </p>
          )
        )}
      </div>
    </section>
  );
}

export default memo(HeroInvitacionCanvasBlock);
