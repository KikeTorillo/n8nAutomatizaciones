/**
 * ====================================================================
 * TEXTO CANVAS BLOCK
 * ====================================================================
 * Bloque de texto libre para invitaciones digitales.
 * Soporta edición inline del contenido.
 *
 * @version 1.1.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Agregar edición inline
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { InlineText } from '@/components/editor-framework';

/**
 * Texto Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 * @param {boolean} props.isEditing - Si está en modo inline editing
 * @param {Function} props.onContentChange - Callback al cambiar contenido
 */
function TextoCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};
  const { contenido: texto } = contenido;
  // Fallback: estilos pueden venir en contenido o en estilos
  const alineacion = estilos.alineacion || contenido.alineacion || 'center';
  const tamano_fuente = estilos.tamano_fuente || contenido.tamano_fuente || 'normal';

  const colorPrimario = tema?.color_primario || '#753572';

  // Clases de tamaño
  const tamanoClasses = {
    small: 'text-sm md:text-base',
    normal: 'text-base md:text-lg',
    large: 'text-lg md:text-xl',
  };

  // Clases de alineación
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <section className="py-12 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        {isEditing ? (
          <InlineText
            value={contenido.contenido || ''}
            onChange={(v) => onContentChange?.({ contenido: v })}
            placeholder="Escribe el contenido del texto..."
            as="div"
            multiline
            className={cn(
              'text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap',
              tamanoClasses[tamano_fuente] || tamanoClasses.normal,
              alignmentClasses[alineacion] || alignmentClasses.center
            )}
            style={{ fontFamily: 'var(--fuente-cuerpo)' }}
          />
        ) : texto ? (
          <div
            className={cn(
              'text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap',
              tamanoClasses[tamano_fuente] || tamanoClasses.normal,
              alignmentClasses[alineacion] || alignmentClasses.center
            )}
            style={{ fontFamily: 'var(--fuente-cuerpo)' }}
          >
            {texto}
          </div>
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 italic">
            Haz doble clic para editar el texto
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TextoCanvasBlock);
