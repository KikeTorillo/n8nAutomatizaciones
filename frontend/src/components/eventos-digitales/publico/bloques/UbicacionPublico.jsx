/**
 * ====================================================================
 * UBICACION PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza las ubicaciones del evento con mapa embebido.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

function UbicacionPublico({ bloque, evento, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  const titulo = contenido.titulo || 'Ubicación';
  const subtitulo = contenido.subtitulo;
  // Si el bloque tiene ubicaciones propias, usarlas; sino usar las del evento
  const ubicaciones = contenido.ubicaciones?.length > 0
    ? contenido.ubicaciones
    : evento?.ubicaciones || [];

  const mostrarMapa = estilos.mostrar_mapa !== false;
  const layout = estilos.layout || 'cards';

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  if (ubicaciones.length === 0) return null;

  const getGoogleMapsUrl = (ubicacion) => {
    if (ubicacion.coordenadas) {
      return `https://www.google.com/maps/search/?api=1&query=${ubicacion.coordenadas.lat},${ubicacion.coordenadas.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion.direccion || ubicacion.nombre)}`;
  };

  const getMapEmbedUrl = (ubicacion) => {
    if (ubicacion.coordenadas) {
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${ubicacion.coordenadas.lng}!3d${ubicacion.coordenadas.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1ses!2smx!4v1`;
    }
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(ubicacion.direccion || ubicacion.nombre)}`;
  };

  return (
    <section className={`py-20 ${className}`}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-12 ${animationClass}`}>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: tema?.color_texto, fontFamily: tema?.fuente_titulo }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-lg" style={{ color: tema?.color_texto_claro }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Ubicaciones */}
        <div
          className={`grid gap-8 ${
            ubicaciones.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {ubicaciones.map((ubicacion, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-3xl overflow-hidden shadow-lg ${
                isVisible ? 'animate-fadeInUp' : 'opacity-0'
              }`}
              style={{
                boxShadow: `0 10px 40px ${tema?.color_primario}15`,
                animationDelay: `${idx * 0.15}s`,
              }}
            >
              {/* Mapa embed */}
              {mostrarMapa && (
                <div className="h-48 sm:h-64 w-full">
                  <iframe
                    src={getMapEmbedUrl(ubicacion)}
                    className="w-full h-full border-0"
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Mapa de ${ubicacion.nombre}`}
                  />
                </div>
              )}

              {/* Info */}
              <div className="p-6">
                {/* Tipo de ubicación (badge) */}
                {ubicacion.tipo && (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
                    style={{
                      backgroundColor: tema?.color_secundario,
                      color: tema?.color_primario,
                    }}
                  >
                    {ubicacion.tipo}
                  </span>
                )}

                {/* Nombre */}
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: tema?.color_texto }}
                >
                  {ubicacion.nombre}
                </h3>

                {/* Dirección */}
                {ubicacion.direccion && (
                  <p
                    className="flex items-start gap-2 mb-4"
                    style={{ color: tema?.color_texto_claro }}
                  >
                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    {ubicacion.direccion}
                  </p>
                )}

                {/* Hora (si aplica) */}
                {ubicacion.hora && (
                  <p className="text-sm mb-4" style={{ color: tema?.color_texto_claro }}>
                    <span className="font-medium">Hora:</span> {ubicacion.hora}
                  </p>
                )}

                {/* Notas */}
                {ubicacion.notas && (
                  <p className="text-sm mb-4" style={{ color: tema?.color_texto_claro }}>
                    {ubicacion.notas}
                  </p>
                )}

                {/* Botón para abrir en Google Maps */}
                <a
                  href={getGoogleMapsUrl(ubicacion)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    backgroundColor: tema?.color_primario,
                    color: 'white',
                  }}
                >
                  <Navigation className="w-4 h-4" />
                  Cómo llegar
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(UbicacionPublico);
