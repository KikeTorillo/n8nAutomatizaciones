/**
 * ====================================================================
 * TIMELINE ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo timeline (itinerario/agenda) en el canvas.
 * Diseño sincronizado con TimelineCanvasBlock (editor).
 * Soporta layouts: alternado, izquierda, derecha.
 *
 * @version 1.2.0
 * @since 2026-02-04
 * @updated 2026-02-05 - Sincronizado con diseño del editor (sin tarjetas)
 */

import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== COMPONENT ==========

function TimelineElementRenderer({
  elemento,
  tema,
  isEditing = false,
}) {
  const { contenido = {}, estilos = {} } = elemento;

  // Configuración
  const titulo = contenido.titulo || '';
  const subtitulo = contenido.subtitulo || '';
  const items = contenido.items || [];
  // Layouts válidos: 'alternado', 'izquierda', 'derecha'
  const layout = estilos.layout || contenido.layout || 'alternado';

  // Colores
  const colorPrimario = estilos.color_primario || tema?.color_primario || '#753572';
  const colorFondo = tema?.color_fondo || '#FFFFFF';
  const colorTexto = estilos.color_texto || tema?.color_texto || '#1f2937';
  const colorTextoClaro = estilos.color_texto_claro || tema?.color_texto_claro || '#6b7280';
  const colorLinea = estilos.color_linea || contenido.color_linea || colorPrimario;
  const fuenteTitulo = estilos.fuente_titulo || tema?.fuente_titulos || 'inherit';

  // Obtener icono de Lucide
  const getIcon = (iconName) => {
    const Icon = LucideIcons[iconName] || LucideIcons.Clock;
    return Icon;
  };

  // Items de ejemplo para edición
  const displayItems = useMemo(() => {
    if (items.length > 0) return items;
    if (isEditing) {
      return [
        { hora: '14:00', titulo: 'Ceremonia', descripcion: 'Inicio de la celebración' },
        { hora: '15:30', titulo: 'Cóctel', descripcion: 'Aperitivos y bebidas' },
        { hora: '17:00', titulo: 'Recepción', descripcion: 'Cena y fiesta' },
      ];
    }
    return [];
  }, [items, isEditing]);

  if (displayItems.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        Agrega actividades al itinerario
      </div>
    );
  }

  return (
    <div className="timeline-element w-full py-8 px-4" style={{ backgroundColor: colorFondo }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {(titulo || subtitulo) && (
          <div className="text-center mb-8">
            {titulo && (
              <h3
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: colorPrimario, fontFamily: fuenteTitulo }}
              >
                {titulo}
              </h3>
            )}
            {subtitulo && (
              <p className="max-w-2xl mx-auto" style={{ color: colorTextoClaro }}>
                {subtitulo}
              </p>
            )}
          </div>
        )}

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
          <div className="space-y-6">
            {displayItems.map((item, idx) => {
              const Icon = getIcon(item.icono);
              const isLeft = layout === 'alternado' ? idx % 2 === 0 : layout === 'izquierda';

              return (
                <div
                  key={idx}
                  className={cn(
                    'relative flex items-start gap-4',
                    layout === 'alternado' && 'md:gap-6',
                    layout === 'alternado' && !isLeft && 'md:flex-row-reverse',
                    layout === 'derecha' && 'flex-row-reverse'
                  )}
                >
                  {/* Punto con icono */}
                  <div
                    className={cn(
                      'absolute w-7 h-7 rounded-full flex items-center justify-center z-10',
                      layout === 'izquierda' && 'left-0.5',
                      layout === 'derecha' && 'right-0.5',
                      layout === 'alternado' && 'left-0.5 md:left-1/2 md:-translate-x-1/2'
                    )}
                    style={{ backgroundColor: colorFondo }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colorLinea }}
                    >
                      <Icon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>

                  {/* Contenido - SIN tarjeta, texto directo */}
                  <div
                    className={cn(
                      'flex-1',
                      layout === 'izquierda' && 'pl-10',
                      layout === 'derecha' && 'pr-10 text-right',
                      // Alternado: posicionar cerca de la línea central
                      layout === 'alternado' && 'pl-10 md:pl-0',
                      layout === 'alternado' && isLeft && 'md:ml-0 md:mr-[calc(50%+1.25rem)] md:text-right',
                      layout === 'alternado' && !isLeft && 'md:mr-0 md:ml-[calc(50%+1.25rem)] md:text-left'
                    )}
                  >
                    {/* Hora como texto simple */}
                    {item.hora && (
                      <span
                        className="text-sm font-medium block mb-1"
                        style={{ color: colorPrimario }}
                      >
                        {item.hora}
                      </span>
                    )}

                    {/* Título */}
                    <h4 className="text-lg font-bold mb-1" style={{ color: colorTexto }}>
                      {item.titulo}
                    </h4>

                    {/* Descripción */}
                    {item.descripcion && (
                      <p className="text-sm" style={{ color: colorTextoClaro }}>
                        {item.descripcion}
                      </p>
                    )}

                    {/* Ubicación (si existe) */}
                    {item.ubicacion && (
                      <p className="text-sm mt-2 flex items-center gap-1" style={{ color: colorTextoClaro }}>
                        <LucideIcons.MapPin className="w-3 h-3" />
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
    </div>
  );
}

TimelineElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      titulo: PropTypes.string,
      subtitulo: PropTypes.string,
      items: PropTypes.arrayOf(PropTypes.shape({
        hora: PropTypes.string,
        titulo: PropTypes.string,
        descripcion: PropTypes.string,
        ubicacion: PropTypes.string,
        icono: PropTypes.string,
      })),
      layout: PropTypes.oneOf(['alternado', 'izquierda', 'derecha']),
      color_linea: PropTypes.string,
    }),
    estilos: PropTypes.object,
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    color_secundario: PropTypes.string,
    color_texto: PropTypes.string,
    color_texto_claro: PropTypes.string,
    fuente_titulos: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
};

export default memo(TimelineElementRenderer);
