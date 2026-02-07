/**
 * ====================================================================
 * UBICACION CANVAS BLOCK
 * ====================================================================
 * Bloque de ubicación para invitaciones digitales.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

// Generar URL de embed de Google Maps desde coordenadas o dirección
const getMapEmbedUrl = (ubicacion) => {
  if (ubicacion.coordenadas) {
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${ubicacion.coordenadas.lng}!3d${ubicacion.coordenadas.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1ses!2smx!4v1`;
  }
  if (ubicacion.direccion || ubicacion.nombre) {
    return `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(ubicacion.direccion || ubicacion.nombre)}`;
  }
  return null;
};

const getGoogleMapsUrl = (ubicacion) => {
  if (ubicacion.coordenadas) {
    return `https://www.google.com/maps/search/?api=1&query=${ubicacion.coordenadas.lat},${ubicacion.coordenadas.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion.direccion || ubicacion.nombre)}`;
};

/**
 * Ubicación Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 * @param {Array} props.ubicaciones - Ubicaciones del evento
 */
function UbicacionCanvasBlock({ bloque, tema, ubicaciones = [] }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  const titulo = contenido.titulo || 'Ubicación';
  const subtitulo = contenido.subtitulo;
  const mostrar_todas = contenido.mostrar_todas ?? true;
  const ubicacion_id = contenido.ubicacion_id;

  // mostrar_mapa se guarda en contenido (el editor flat form → actualizarBloqueLocal → contenido)
  const mostrarMapa = (contenido.mostrar_mapa ?? estilos.mostrar_mapa) !== false;

  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;
  const colorSecundario = tema?.color_secundario || INV.acento;

  // Filtrar ubicaciones a mostrar (== para comparar string/number)
  const ubicacionesAMostrar = mostrar_todas
    ? ubicaciones
    : ubicaciones.filter((u) => u.id == ubicacion_id);

  return (
    <section className="py-20 px-6" style={{ backgroundColor: colorSecundario + '20' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorTexto, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-lg" style={{ color: colorTextoClaro }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Ubicaciones */}
        {ubicacionesAMostrar.length > 0 ? (
          <div className={`grid gap-8 ${ubicacionesAMostrar.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {ubicacionesAMostrar.map((ubicacion, idx) => {
              const embedUrl = getMapEmbedUrl(ubicacion);

              return (
                <div
                  key={idx}
                  className="rounded-3xl overflow-hidden"
                  style={{
                    backgroundColor: colorSecundario + '30',
                    boxShadow: `0 10px 40px ${colorPrimario}15`,
                  }}
                >
                  {/* Mapa */}
                  {mostrarMapa && embedUrl ? (
                    <div className="h-48 sm:h-64 w-full">
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
                    <div className="h-48 flex items-center justify-center" style={{ backgroundColor: colorSecundario + '30' }}>
                      <div className="text-center">
                        <MapPin className="w-10 h-10 mx-auto mb-2" style={{ color: colorPrimario }} />
                        <p className="text-sm" style={{ color: colorTextoClaro }}>Mapa no disponible</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Info */}
                  <div className="p-6">
                    {ubicacion.tipo && (
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
                        style={{ backgroundColor: colorSecundario, color: colorPrimario }}
                      >
                        {ubicacion.tipo}
                      </span>
                    )}

                    <h3 className="text-xl font-semibold mb-2" style={{ color: colorTexto }}>
                      {ubicacion.nombre || 'Nombre del lugar'}
                    </h3>

                    {ubicacion.direccion && (
                      <p className="flex items-start gap-2 mb-4" style={{ color: colorTextoClaro }}>
                        <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        {ubicacion.direccion}
                      </p>
                    )}

                    {ubicacion.hora && (
                      <p className="text-sm mb-4" style={{ color: colorTextoClaro }}>
                        <span className="font-medium">Hora:</span> {ubicacion.hora}
                      </p>
                    )}

                    {ubicacion.notas && (
                      <p className="text-sm mb-4" style={{ color: colorTextoClaro }}>
                        {ubicacion.notas}
                      </p>
                    )}

                    <a
                      href={getGoogleMapsUrl(ubicacion)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                      style={{ backgroundColor: colorPrimario, color: 'white' }}
                      onClick={(e) => e.preventDefault()}
                    >
                      <Navigation className="w-4 h-4" />
                      Cómo llegar
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: colorPrimario, opacity: 0.5 }} />
            <p style={{ color: colorTextoClaro }}>No hay ubicaciones configuradas</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(UbicacionCanvasBlock);
