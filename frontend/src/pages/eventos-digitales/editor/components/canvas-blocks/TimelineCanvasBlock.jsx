/**
 * ====================================================================
 * TIMELINE CANVAS BLOCK (ITINERARIO)
 * ====================================================================
 * Bloque de itinerario/programa del día para invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

/**
 * Timeline Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function TimelineCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const titulo_seccion = contenido.titulo_seccion || 'Itinerario del Día';
  const subtitulo_seccion = contenido.subtitulo_seccion;
  const items = contenido.items || [];

  // Fallback: estilos pueden venir en contenido o en estilos
  const layout = estilos.layout || contenido.layout || 'alternado';
  const color_linea = estilos.color_linea || contenido.color_linea;

  const colorPrimario = tema?.color_primario || '#753572';
  const colorLinea = color_linea || colorPrimario;

  // Obtener icono de Lucide
  const getIcon = (iconName) => {
    const Icon = LucideIcons[iconName] || LucideIcons.Clock;
    return Icon;
  };

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo_seccion}
          </h2>
          {subtitulo_seccion && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {subtitulo_seccion}
            </p>
          )}
        </div>

        {/* Timeline */}
        {items.length > 0 ? (
          <div className="relative">
            {/* Línea central */}
            <div
              className={cn(
                'absolute w-0.5 top-0 bottom-0',
                layout === 'izquierda'
                  ? 'left-4'
                  : layout === 'derecha'
                  ? 'right-4'
                  : 'left-1/2 -translate-x-1/2'
              )}
              style={{ backgroundColor: colorLinea }}
            />

            {/* Items */}
            <div className="space-y-8">
              {items.map((item, idx) => {
                const Icon = getIcon(item.icono);
                const isLeft = layout === 'alternado' ? idx % 2 === 0 : layout === 'izquierda';

                return (
                  <div
                    key={idx}
                    className={cn(
                      'relative flex items-start gap-4',
                      layout === 'alternado' && 'md:gap-8',
                      layout === 'alternado' && !isLeft && 'md:flex-row-reverse',
                      layout === 'derecha' && 'flex-row-reverse'
                    )}
                  >
                    {/* Punto */}
                    <div
                      className={cn(
                        'absolute w-8 h-8 rounded-full flex items-center justify-center z-10 bg-white dark:bg-gray-900',
                        layout === 'izquierda' && 'left-0',
                        layout === 'derecha' && 'right-0',
                        layout === 'alternado' && 'left-1/2 -translate-x-1/2'
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colorLinea }}
                      >
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* Contenido */}
                    <div
                      className={cn(
                        'flex-1',
                        layout === 'izquierda' && 'pl-12',
                        layout === 'derecha' && 'pr-12 text-right',
                        layout === 'alternado' && 'md:w-1/2',
                        layout === 'alternado' && isLeft && 'md:pr-12 md:text-right pl-12 md:pl-0',
                        layout === 'alternado' && !isLeft && 'md:pl-12 md:text-left pl-12'
                      )}
                    >
                      <span
                        className="text-sm font-medium block mb-1"
                        style={{ color: colorPrimario }}
                      >
                        {item.hora || '00:00'}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {item.titulo || 'Actividad'}
                      </h3>
                      {item.descripcion && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {item.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <LucideIcons.Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay actividades en el itinerario</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TimelineCanvasBlock);
