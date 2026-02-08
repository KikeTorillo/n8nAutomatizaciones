/**
 * ====================================================================
 * TEXTO CANVAS BLOCK (Compartido)
 * ====================================================================
 * Renderer de texto compartido entre Website e Invitaciones.
 * Soporta dos modos: 'rich' (TipTap HTML) y 'plain' (texto plano).
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { InlineText, InlineRichText } from '../../inline';
import { getThemeColors } from '../../utils/themeColors';

const ALIGNMENT_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const SIZE_CLASSES = {
  small: 'text-sm md:text-base',
  normal: 'text-base md:text-lg',
  large: 'text-lg md:text-xl',
};

/**
 * TextoCanvasBlock compartido
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema del editor
 * @param {boolean} [props.isEditing] - Modo edición inline
 * @param {Function} [props.onContentChange] - Callback cambio contenido
 * @param {'website'|'invitacion'} [props.fallbackContext='website'] - Contexto fallback
 * @param {'rich'|'plain'} [props.mode='rich'] - Modo de edición
 * @param {string} [props.contentField='html'] - Campo del contenido a usar
 * @param {boolean} [props.showFontSize] - Mostrar selector de tamaño fuente
 */
function TextoCanvasBlock({
  bloque,
  tema,
  isEditing,
  onContentChange,
  fallbackContext = 'website',
  mode = 'rich',
  contentField = 'html',
  showFontSize = false,
}) {
  const colors = getThemeColors(tema, fallbackContext);
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  const texto = contenido[contentField];
  const alineacion = estilos.alineacion || contenido.alineacion || (fallbackContext === 'invitacion' ? 'center' : 'left');
  const tamano_fuente = showFontSize ? (estilos.tamano_fuente || contenido.tamano_fuente || 'normal') : null;

  const sectionClass = fallbackContext === 'invitacion'
    ? 'py-12 px-6 bg-white dark:bg-gray-900'
    : 'py-12 px-6 bg-white dark:bg-gray-800';
  const maxWidthClass = fallbackContext === 'invitacion' ? 'max-w-3xl mx-auto' : 'max-w-4xl mx-auto';

  if (mode === 'rich') {
    // Website: Rich Text (TipTap HTML)
    const htmlContent = texto || '<p>Escribe tu contenido aquí...</p>';

    return (
      <section className={sectionClass}>
        <div className={cn(maxWidthClass, ALIGNMENT_CLASSES[alineacion])}>
          {isEditing ? (
            <InlineRichText
              value={htmlContent}
              onChange={(value) => onContentChange?.({ contenido: value })}
              placeholder="Escribe tu contenido aquí..."
              className="min-h-[100px]"
            />
          ) : (
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              style={{
                fontFamily: 'var(--fuente-cuerpo)',
                '--tw-prose-links': `var(--color-primario, ${colors.primario})`,
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>
      </section>
    );
  }

  // Invitaciones: Plain Text
  const textClasses = cn(
    'text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap',
    tamano_fuente ? (SIZE_CLASSES[tamano_fuente] || SIZE_CLASSES.normal) : '',
    ALIGNMENT_CLASSES[alineacion] || ALIGNMENT_CLASSES.center
  );

  return (
    <section className={sectionClass}>
      <div className={maxWidthClass}>
        {isEditing ? (
          <InlineText
            value={contenido[contentField] || ''}
            onChange={(v) => onContentChange?.({ [contentField]: v })}
            placeholder="Escribe el contenido del texto..."
            as="div"
            multiline
            className={textClasses}
            style={{ fontFamily: 'var(--fuente-cuerpo)' }}
          />
        ) : texto ? (
          <div className={textClasses} style={{ fontFamily: 'var(--fuente-cuerpo)' }}>
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
