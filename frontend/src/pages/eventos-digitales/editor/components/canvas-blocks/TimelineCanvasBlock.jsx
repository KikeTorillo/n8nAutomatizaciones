/**
 * ====================================================================
 * TIMELINE CANVAS BLOCK (ITINERARIO)
 * ====================================================================
 * Bloque de itinerario/programa del día para invitaciones.
 *
 * @version 1.1.0
 * @since 2026-02-03
 * @updated 2026-02-07 - Fix semántica izquierda/derecha + mobile layout para canvas
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

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

  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorFondo = tema?.color_fondo || INV.fondo;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;
  const colorLinea = color_linea || colorPrimario;

  // Obtener icono de Lucide
  const getIcon = (iconName) => {
    const Icon = LucideIcons[iconName] || LucideIcons.Clock;
    return Icon;
  };

  return (
    <section className="py-16 px-6" style={{ backgroundColor: colorFondo }}>
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
            <p className="max-w-2xl mx-auto" style={{ color: colorTextoClaro }}>
              {subtitulo_seccion}
            </p>
          )}
        </div>

        {/* Timeline */}
        {items.length > 0 ? (
          <div className="relative">
            {/* Línea — izquierda=contenido izq/línea der, derecha=contenido der/línea izq */}
            <div
              className={cn(
                'absolute w-0.5 top-0 bottom-0',
                layout === 'izquierda' && 'right-4',
                layout === 'derecha' && 'left-4',
                layout === 'alternado' && 'left-1/2 -translate-x-1/2'
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
                      layout === 'izquierda' && 'flex-row-reverse',
                      layout === 'alternado' && !isLeft && 'flex-row-reverse'
                    )}
                  >
                    {/* Punto */}
                    <div
                      className={cn(
                        'absolute w-8 h-8 rounded-full flex items-center justify-center z-10',
                        layout === 'izquierda' && 'right-0',
                        layout === 'derecha' && 'left-0',
                        layout === 'alternado' && 'left-1/2 -translate-x-1/2'
                      )}
                      style={{ backgroundColor: colorFondo }}
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
                        layout === 'izquierda' && 'pr-12 text-right',
                        layout === 'derecha' && 'pl-12',
                        layout === 'alternado' && isLeft && 'mr-[calc(50%+1rem)] text-right',
                        layout === 'alternado' && !isLeft && 'ml-[calc(50%+1rem)] text-left'
                      )}
                    >
                      <span
                        className="text-sm font-medium block mb-1"
                        style={{ color: colorPrimario }}
                      >
                        {item.hora || '00:00'}
                      </span>
                      <h3 className="text-lg font-bold mb-2" style={{ color: colorTexto }}>
                        {item.titulo || 'Actividad'}
                      </h3>
                      {item.descripcion && (
                        <p className="text-sm" style={{ color: colorTextoClaro }}>
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
