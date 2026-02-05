/**
 * ====================================================================
 * TIMELINE ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo timeline (itinerario/agenda) en el canvas.
 * Soporta layouts: vertical, horizontal (tarjetas).
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Clock, MapPin } from 'lucide-react';
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
  const layout = contenido.layout || 'vertical';

  // Colores
  const colorPrimario = estilos.color_primario || tema?.color_primario || '#753572';
  const colorSecundario = estilos.color_secundario || tema?.color_secundario || '#fce7f3';
  const colorTexto = estilos.color_texto || tema?.color_texto || '#1f2937';
  const colorTextoClaro = estilos.color_texto_claro || tema?.color_texto_claro || '#6b7280';
  const fuenteTitulo = estilos.fuente_titulo || tema?.fuente_titulos || 'inherit';

  // Items de ejemplo para edición
  const displayItems = useMemo(() => {
    if (items.length > 0) return items;
    if (isEditing) {
      return [
        { hora: '14:00', titulo: 'Ceremonia', descripcion: 'Inicio de la celebración', ubicacion: '' },
        { hora: '15:30', titulo: 'Cóctel', descripcion: 'Aperitivos y bebidas', ubicacion: '' },
        { hora: '17:00', titulo: 'Recepción', descripcion: 'Cena y fiesta', ubicacion: '' },
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
    <div className="timeline-element w-full">
      {/* Header */}
      {(titulo || subtitulo) && (
        <div className="text-center mb-6">
          {titulo && (
            <h3
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: colorTexto, fontFamily: fuenteTitulo }}
            >
              {titulo}
            </h3>
          )}
          {subtitulo && (
            <p className="text-base" style={{ color: colorTextoClaro }}>
              {subtitulo}
            </p>
          )}
        </div>
      )}

      {/* Layout Vertical */}
      {layout === 'vertical' && (
        <div className="relative">
          {/* Línea central */}
          <div
            className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
            style={{ backgroundColor: colorPrimario + '30' }}
          />

          {displayItems.map((item, idx) => (
            <div
              key={idx}
              className="relative flex items-start gap-4 sm:gap-6 mb-6 last:mb-0"
            >
              {/* Punto en la línea */}
              <div
                className="absolute left-4 sm:left-1/2 w-3 h-3 rounded-full -translate-x-1/2 z-10"
                style={{
                  backgroundColor: colorPrimario,
                  boxShadow: `0 0 0 3px ${colorSecundario}`,
                }}
              />

              {/* Contenido */}
              <div
                className={cn(
                  'ml-10 sm:ml-0 bg-white rounded-xl p-4 shadow-sm flex-1',
                  idx % 2 === 0 ? 'sm:mr-[calc(50%+1.5rem)] sm:text-right' : 'sm:ml-[calc(50%+1.5rem)]',
                )}
                style={{ boxShadow: `0 2px 12px ${colorPrimario}10` }}
              >
                {/* Hora */}
                {item.hora && (
                  <div
                    className={cn(
                      'flex items-center gap-1.5 mb-1.5',
                      idx % 2 === 0 && 'sm:justify-end',
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" style={{ color: colorPrimario }} />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: colorPrimario }}
                    >
                      {item.hora}
                    </span>
                  </div>
                )}

                {/* Título del item */}
                <h4
                  className="text-lg font-semibold mb-1"
                  style={{ color: colorTexto }}
                >
                  {item.titulo}
                </h4>

                {/* Descripción */}
                {item.descripcion && (
                  <p className="text-sm" style={{ color: colorTextoClaro }}>
                    {item.descripcion}
                  </p>
                )}

                {/* Ubicación */}
                {item.ubicacion && (
                  <div
                    className={cn(
                      'flex items-center gap-1 mt-2',
                      idx % 2 === 0 && 'sm:justify-end',
                    )}
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: colorTextoClaro }} />
                    <span className="text-xs" style={{ color: colorTextoClaro }}>
                      {item.ubicacion}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Layout Horizontal (tarjetas) */}
      {layout === 'horizontal' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-4"
              style={{ boxShadow: `0 2px 12px ${colorPrimario}10` }}
            >
              {/* Hora */}
              {item.hora && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
                  style={{ backgroundColor: colorSecundario }}
                >
                  <Clock className="w-3.5 h-3.5" style={{ color: colorPrimario }} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colorPrimario }}
                  >
                    {item.hora}
                  </span>
                </div>
              )}

              {/* Título */}
              <h4
                className="text-lg font-semibold mb-1"
                style={{ color: colorTexto }}
              >
                {item.titulo}
              </h4>

              {/* Descripción */}
              {item.descripcion && (
                <p className="text-sm mb-2" style={{ color: colorTextoClaro }}>
                  {item.descripcion}
                </p>
              )}

              {/* Ubicación */}
              {item.ubicacion && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" style={{ color: colorTextoClaro }} />
                  <span className="text-xs" style={{ color: colorTextoClaro }}>
                    {item.ubicacion}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
      })),
      layout: PropTypes.oneOf(['vertical', 'horizontal']),
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
