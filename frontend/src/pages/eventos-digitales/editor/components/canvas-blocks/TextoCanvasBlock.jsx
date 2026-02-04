/**
 * ====================================================================
 * TEXTO CANVAS BLOCK
 * ====================================================================
 * Bloque de texto libre para invitaciones digitales.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Texto Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function TextoCanvasBlock({ bloque, tema }) {
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
        {texto ? (
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
            Bloque de texto vacío
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TextoCanvasBlock);
