/**
 * ====================================================================
 * TIMELINE PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza el itinerario/agenda del evento.
 * Diseño sincronizado con TimelineCanvasBlock (editor).
 *
 * @version 1.3.0
 * @since 2026-02-03
 * @updated 2026-02-07 - Fix semántica izquierda/derecha + mobile fallback
 */

import { memo } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

const INV = THEME_FALLBACK_COLORS.invitacion;

function TimelinePublico({ bloque, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  // Editor guarda titulo_seccion/subtitulo_seccion, antes se usaba titulo/subtitulo
  const titulo = contenido.titulo_seccion || contenido.titulo || 'Itinerario';
  const subtitulo = contenido.subtitulo_seccion || contenido.subtitulo;
  const items = contenido.items || [];

  // Layouts válidos: 'alternado', 'izquierda', 'derecha'
  const layout = estilos.layout || contenido.layout || 'alternado';
  const colorLinea = estilos.color_linea || contenido.color_linea || tema?.color_primario;

  // Obtener icono de Lucide
  const getIcon = (iconName) => {
    const Icon = LucideIcons[iconName] || LucideIcons.Clock;
    return Icon;
  };

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  if (items.length === 0) return null;

  return (
    <section className={cn('py-16 px-6', className)} style={{ backgroundColor: tema?.color_fondo || INV.fondo }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={cn('text-center mb-12', animationClass)}>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: tema?.color_primario, fontFamily: tema?.fuente_titulo }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p
              className="max-w-2xl mx-auto"
              style={{ color: tema?.color_texto_claro || INV.textoClaro }}
            >
              {subtitulo}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Línea central — izquierda=contenido izq/línea der, derecha=contenido der/línea izq */}
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
              // izquierda: contenido a la izq, línea a la der → flex-row-reverse
              // derecha: contenido a la der, línea a la izq → normal

              return (
                <div
                  key={idx}
                  className={cn(
                    'relative flex items-start gap-4',
                    isVisible ? 'animate-fadeInUp' : 'opacity-0',
                    layout === 'alternado' && !isLeft && 'flex-row-reverse',
                    layout === 'izquierda' && 'flex-row-reverse'
                  )}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Punto con icono */}
                  <div
                    className={cn(
                      'absolute w-8 h-8 rounded-full flex items-center justify-center z-10',
                      layout === 'izquierda' && 'right-0',
                      layout === 'derecha' && 'left-0',
                      layout === 'alternado' && 'left-1/2 -translate-x-1/2'
                    )}
                    style={{ backgroundColor: tema?.color_fondo || INV.fondo }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colorLinea }}
                    >
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Contenido - SIN tarjeta, texto directo */}
                  <div
                    className={cn(
                      'flex-1',
                      layout === 'izquierda' && 'pr-12 text-right',
                      layout === 'derecha' && 'pl-12',
                      // Alternado: contenido alterna izq/der respecto a línea central
                      layout === 'alternado' && isLeft && 'mr-[calc(50%+1rem)] text-right',
                      layout === 'alternado' && !isLeft && 'ml-[calc(50%+1rem)] text-left'
                    )}
                  >
                    {/* Hora como texto simple */}
                    {item.hora && (
                      <span
                        className="text-sm font-medium block mb-1"
                        style={{ color: tema?.color_primario }}
                      >
                        {item.hora}
                      </span>
                    )}

                    {/* Título */}
                    <h3
                      className="text-lg font-bold mb-2"
                      style={{ color: tema?.color_texto || INV.texto }}
                    >
                      {item.titulo}
                    </h3>

                    {/* Descripción */}
                    {item.descripcion && (
                      <p
                        className="text-sm"
                        style={{ color: tema?.color_texto_claro || INV.textoClaro }}
                      >
                        {item.descripcion}
                      </p>
                    )}

                    {/* Ubicación (solo en público, si existe) */}
                    {item.ubicacion && (
                      <p
                        className="text-sm mt-2 flex items-center gap-1"
                        style={{ color: tema?.color_texto_claro || INV.textoClaro }}
                      >
                        <LucideIcons.MapPin className="w-3.5 h-3.5" />
                        {item.ubicacion}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(TimelinePublico);
