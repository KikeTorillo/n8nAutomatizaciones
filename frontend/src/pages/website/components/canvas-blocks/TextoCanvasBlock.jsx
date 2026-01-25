/**
 * ====================================================================
 * TEXTO CANVAS BLOCK
 * ====================================================================
 * Bloque de texto libre editable con TipTap para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { InlineRichText } from '../InlineEditor';

/**
 * Texto Canvas Block
 */
function TextoCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    html: htmlContent = '<p>Escribe tu contenido aquí...</p>',
    alineacion = 'left',
  } = contenido;

  // Alignment classes
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <section className="py-12 px-6 bg-white dark:bg-gray-800">
      <div className={cn('max-w-4xl mx-auto', alignmentClasses[alineacion])}>
        {isEditing ? (
          <InlineRichText
            value={htmlContent}
            onChange={(value) => onContentChange({ contenido: value })}
            placeholder="Escribe tu contenido aquí..."
            className="min-h-[100px]"
          />
        ) : (
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            style={{
              fontFamily: 'var(--fuente-cuerpo)',
              '--tw-prose-links': `var(--color-primario, ${tema?.color_primario || '#753572'})`,
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </section>
  );
}

export default memo(TextoCanvasBlock);
