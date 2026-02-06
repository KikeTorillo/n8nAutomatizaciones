/**
 * ====================================================================
 * SEPARADOR CANVAS BLOCK
 * ====================================================================
 * Bloque separador para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * Separador Canvas Block
 */
function SeparadorCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};
  const {
    tipo = 'linea', // 'linea' | 'espacio' | 'ondas'
    altura = 50,
    color = THEME_FALLBACK_COLORS.common.separador,
  } = contenido;

  // Render based on type
  const renderSeparador = () => {
    switch (tipo) {
      case 'espacio':
        return <div style={{ height: `${altura}px` }} />;

      case 'ondas':
        return (
          <div
            className="w-full overflow-hidden"
            style={{ height: `${altura}px` }}
          >
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="w-full h-full"
              style={{ fill: color }}
            >
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
          </div>
        );

      case 'linea':
      default:
        return (
          <div
            className="w-full flex items-center justify-center"
            style={{ height: `${altura}px` }}
          >
            <div
              className="w-full max-w-md h-px"
              style={{ backgroundColor: color }}
            />
          </div>
        );
    }
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800')}>
      {renderSeparador()}
    </div>
  );
}

export default memo(SeparadorCanvasBlock);
