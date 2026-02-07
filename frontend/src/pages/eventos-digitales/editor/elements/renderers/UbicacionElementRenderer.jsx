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
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

// Generar URL de embed de Google Maps desde coordenadas o dirección
const getMapEmbedUrl = (ubicacion) => {
  if (ubicacion.coordenadas) {
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${ubicacion.coordenadas.lng}!3d${ubicacion.coordenadas.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1ses!2smx!4v1`;
  }
  if (ubicacion.direccion || ubicacion.nombre) {
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(ubicacion.direccion || ubicacion.nombre)}`;
  }
  return null;
};

const getGoogleMapsUrl = (ubicacion) => {
  if (ubicacion.coordenadas) {
    return `https://www.google.com/maps/search/?api=1&query=${ubicacion.coordenadas.lat},${ubicacion.coordenadas.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion.direccion || ubicacion.nombre)}`;
};

function UbicacionElementRenderer({
  elemento,
  tema,
  customData: evento,
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
  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorSecundario = tema?.color_secundario || INV.secundario;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;
  const fuenteTitulo = tema?.fuente_titulos || 'inherit';

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
        {ubicaciones.map((ubicacion, idx) => {
          const embedUrl = getMapEmbedUrl(ubicacion);

          return (
            <div
              key={idx}
              className="bg-white rounded-xl overflow-hidden"
              style={{ boxShadow: `0 4px 20px ${colorPrimario}15` }}
            >
              {/* Mapa */}
              {mostrarMapa && embedUrl ? (
                <div className="h-32 w-full">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Mapa de ${ubicacion.nombre}`}
                  />
                </div>
              ) : mostrarMapa ? (
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: colorSecundario + '40' }}
                >
                  <MapPin className="w-8 h-8" style={{ color: colorPrimario }} />
                </div>
              ) : null}

              {/* Info */}
              <div className="p-4">
                {ubicacion.tipo && (
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2"
                    style={{ backgroundColor: colorSecundario, color: colorPrimario }}
                  >
                    {ubicacion.tipo}
                  </span>
                )}

                <h3 className="text-base font-semibold mb-1" style={{ color: colorTexto }}>
                  {ubicacion.nombre}
                </h3>

                {ubicacion.direccion && (
                  <p className="flex items-start gap-1.5 text-sm mb-3" style={{ color: colorTextoClaro }}>
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {ubicacion.direccion}
                  </p>
                )}

                {ubicacion.hora && (
                  <p className="text-xs mb-2" style={{ color: colorTextoClaro }}>
                    <span className="font-medium">Hora:</span> {ubicacion.hora}
                  </p>
                )}

                <a
                  href={getGoogleMapsUrl(ubicacion)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: colorPrimario, color: 'white' }}
                  onClick={(e) => isEditing && e.preventDefault()}
                >
                  <Navigation className="w-3 h-3" />
                  Cómo llegar
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          );
        })}
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
  customData: PropTypes.shape({
    ubicaciones: PropTypes.array,
  }),
  isEditing: PropTypes.bool,
};

export default memo(UbicacionElementRenderer);
