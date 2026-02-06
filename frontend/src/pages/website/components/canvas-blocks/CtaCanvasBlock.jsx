/**
 * ====================================================================
 * CTA CANVAS BLOCK
 * ====================================================================
 * Bloque de Call to Action editable para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { InlineText } from '../InlineEditor';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * CTA Canvas Block
 */
function CtaCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const WEB = THEME_FALLBACK_COLORS.website;
  const contenido = bloque.contenido || {};
  const {
    titulo = '¿Listo para comenzar?',
    descripcion = 'Agenda tu cita hoy y descubre la diferencia',
    boton_texto = 'Agendar ahora',
    boton_url = '#contacto',
    fondo_tipo = 'color', // 'color' | 'imagen' | 'gradiente'
    fondo_valor = '',
  } = contenido;

  // Background style based on type
  const getBackgroundStyle = () => {
    switch (fondo_tipo) {
      case 'imagen':
        return {
          backgroundImage: fondo_valor ? `url(${fondo_valor})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'gradiente':
        return {
          background: fondo_valor || `linear-gradient(135deg, var(--color-primario), var(--color-secundario))`,
        };
      default:
        return {
          backgroundColor: fondo_valor || `var(--color-primario, ${tema?.color_primario || WEB.primario})`,
        };
    }
  };

  return (
    <section
      className="relative py-20 px-6"
      style={getBackgroundStyle()}
    >
      {/* Overlay for image backgrounds */}
      {fondo_tipo === 'imagen' && fondo_valor && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Title */}
        {isEditing ? (
          <InlineText
            value={titulo}
            onChange={(value) => onContentChange({ titulo: value })}
            placeholder="Título del CTA"
            className="text-3xl md:text-4xl font-bold text-white mb-4 block"
            as="h2"
          />
        ) : (
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h2>
        )}

        {/* Description */}
        {descripcion && (
          isEditing ? (
            <InlineText
              value={descripcion}
              onChange={(value) => onContentChange({ descripcion: value })}
              placeholder="Descripción"
              className="text-xl text-white/90 mb-8 block"
              as="p"
            />
          ) : (
            <p className="text-xl text-white/90 mb-8">
              {descripcion}
            </p>
          )
        )}

        {/* Button */}
        {boton_texto && (
          <button
            className={cn(
              'px-8 py-3 rounded-lg font-semibold text-lg transition-all',
              'bg-white hover:bg-gray-100',
              'shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            )}
            style={{
              color: `var(--color-primario, ${tema?.color_primario || WEB.primario})`,
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

export default memo(CtaCanvasBlock);
