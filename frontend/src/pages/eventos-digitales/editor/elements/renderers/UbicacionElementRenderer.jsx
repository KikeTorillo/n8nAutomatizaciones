/**
 * ====================================================================
 * UBICACION ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo ubicacion en el canvas.
 * Muestra las ubicaciones del evento con información y mapa.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

function UbicacionElementRenderer({
  elemento,
  tema,
  evento,
  isEditing = false,
}) {
  const { contenido = {} } = elemento;

  const titulo = contenido.titulo || 'Ubicación';
  const subtitulo = contenido.subtitulo || '';
  const mostrarMapa = contenido.mostrar_mapa !== false;

  // Usar ubicaciones del elemento o las del evento
  const ubicaciones = contenido.ubicaciones?.length > 0
    ? contenido.ubicaciones
    : evento?.ubicaciones || [];

  // Estilos del tema
  const colorPrimario = tema?.color_primario || '#753572';
  const colorSecundario = tema?.color_secundario || '#fce7f3';
  const colorTexto = tema?.color_texto || '#1f2937';
  const colorTextoClaro = tema?.color_texto_claro || '#6b7280';
  const fuenteTitulo = tema?.fuente_titulos || 'inherit';

  const getGoogleMapsUrl = (ubicacion) => {
    if (ubicacion.coordenadas) {
      return `https://www.google.com/maps/search/?api=1&query=${ubicacion.coordenadas.lat},${ubicacion.coordenadas.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion.direccion || ubicacion.nombre)}`;
  };

  // Mostrar placeholder si no hay ubicaciones en modo edición
  if (ubicaciones.length === 0) {
    if (isEditing) {
      return (
        <div className="ubicacion-element w-full py-6">
          <div className="text-center mb-6">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: colorTexto, fontFamily: fuenteTitulo }}
            >
              {titulo}
            </h2>
            {subtitulo && (
              <p className="text-sm" style={{ color: colorTextoClaro }}>{subtitulo}</p>
            )}
          </div>
          <div
            className="text-center py-8 rounded-xl"
            style={{ backgroundColor: colorSecundario + '30' }}
          >
            <MapPin className="w-10 h-10 mx-auto mb-2" style={{ color: colorPrimario }} />
            <p className="text-sm" style={{ color: colorTextoClaro }}>
              Las ubicaciones del evento se mostrarán aquí
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="ubicacion-element w-full py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: colorTexto, fontFamily: fuenteTitulo }}
        >
          {titulo}
        </h2>
        {subtitulo && (
          <p className="text-sm" style={{ color: colorTextoClaro }}>{subtitulo}</p>
        )}
      </div>

      {/* Ubicaciones */}
      <div className={`grid gap-4 ${ubicaciones.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {ubicaciones.map((ubicacion, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl overflow-hidden"
            style={{ boxShadow: `0 4px 20px ${colorPrimario}15` }}
          >
            {/* Mapa placeholder */}
            {mostrarMapa && (
              <div
                className="h-32 flex items-center justify-center"
                style={{ backgroundColor: colorSecundario + '40' }}
              >
                <MapPin className="w-8 h-8" style={{ color: colorPrimario }} />
              </div>
            )}

            {/* Info */}
            <div className="p-4">
              {/* Tipo badge */}
              {ubicacion.tipo && (
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2"
                  style={{ backgroundColor: colorSecundario, color: colorPrimario }}
                >
                  {ubicacion.tipo}
                </span>
              )}

              {/* Nombre */}
              <h3 className="text-base font-semibold mb-1" style={{ color: colorTexto }}>
                {ubicacion.nombre}
              </h3>

              {/* Dirección */}
              {ubicacion.direccion && (
                <p className="flex items-start gap-1.5 text-sm mb-3" style={{ color: colorTextoClaro }}>
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {ubicacion.direccion}
                </p>
              )}

              {/* Hora */}
              {ubicacion.hora && (
                <p className="text-xs mb-2" style={{ color: colorTextoClaro }}>
                  <span className="font-medium">Hora:</span> {ubicacion.hora}
                </p>
              )}

              {/* Botón */}
              <a
                href={getGoogleMapsUrl(ubicacion)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: colorPrimario, color: 'white' }}
                onClick={(e) => isEditing && e.preventDefault()}
              >
                <Navigation className="w-3 h-3" />
                Cómo llegar
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

UbicacionElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.object,
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    color_secundario: PropTypes.string,
    color_texto: PropTypes.string,
    color_texto_claro: PropTypes.string,
    fuente_titulos: PropTypes.string,
  }),
  evento: PropTypes.shape({
    ubicaciones: PropTypes.array,
  }),
  isEditing: PropTypes.bool,
};

export default memo(UbicacionElementRenderer);
