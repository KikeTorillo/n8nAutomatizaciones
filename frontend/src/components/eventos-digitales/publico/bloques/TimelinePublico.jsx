/**
 * ====================================================================
 * TIMELINE PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza el itinerario/agenda del evento.
 * Diseño sincronizado con TimelineCanvasBlock (editor).
 *
 * @version 1.2.0
 * @since 2026-02-03
 * @updated 2026-02-05 - Sincronizado con diseño del editor (sin tarjetas)
 */

import { memo } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <section className={cn('py-16 px-6 bg-white', className)}>
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
            <p className="text-gray-600 max-w-2xl mx-auto">
              {subtitulo}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Línea central */}
          <div
            className={cn(
              'absolute w-0.5 top-0 bottom-0',
              layout === 'izquierda' && 'left-4',
              layout === 'derecha' && 'right-4',
              layout === 'alternado' && 'left-4 md:left-1/2 md:-translate-x-1/2'
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
                    isVisible ? 'animate-fadeInUp' : 'opacity-0',
                    layout === 'alternado' && 'md:gap-8',
                    layout === 'alternado' && !isLeft && 'md:flex-row-reverse',
                    layout === 'derecha' && 'flex-row-reverse'
                  )}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Punto con icono */}
                  <div
                    className={cn(
                      'absolute w-8 h-8 rounded-full flex items-center justify-center z-10 bg-white',
                      layout === 'izquierda' && 'left-0',
                      layout === 'derecha' && 'right-0',
                      layout === 'alternado' && 'left-0 md:left-1/2 md:-translate-x-1/2'
                    )}
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
                      layout === 'izquierda' && 'pl-12',
                      layout === 'derecha' && 'pr-12 text-right',
                      // Alternado: posicionar cerca de la línea central
                      layout === 'alternado' && 'pl-10 md:pl-0',
                      layout === 'alternado' && isLeft && 'md:ml-0 md:mr-[calc(50%+1.5rem)] md:text-right',
                      layout === 'alternado' && !isLeft && 'md:mr-0 md:ml-[calc(50%+1.5rem)] md:text-left'
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
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {item.titulo}
                    </h3>

                    {/* Descripción */}
                    {item.descripcion && (
                      <p className="text-gray-600 text-sm">
                        {item.descripcion}
                      </p>
                    )}

                    {/* Ubicación (solo en público, si existe) */}
                    {item.ubicacion && (
                      <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
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
