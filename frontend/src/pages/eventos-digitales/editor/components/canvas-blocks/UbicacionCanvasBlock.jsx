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
import { cn } from '@/lib/utils';

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

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const titulo = contenido.titulo || 'Ubicación';
  const subtitulo = contenido.subtitulo;
  const mostrar_todas = contenido.mostrar_todas ?? true;
  const ubicacion_id = contenido.ubicacion_id;

  const mostrar_mapa = estilos.mostrar_mapa ?? true;
  const altura_mapa = estilos.altura_mapa || 300;

  const colorPrimario = tema?.color_primario || '#753572';

  // Filtrar ubicaciones a mostrar
  const ubicacionesAMostrar = mostrar_todas
    ? ubicaciones
    : ubicaciones.filter((u) => u.id === ubicacion_id);

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {subtitulo}
            </p>
          )}
        </div>

        {/* Ubicaciones */}
        {ubicacionesAMostrar.length > 0 ? (
          <div className="space-y-8">
            {ubicacionesAMostrar.map((ubicacion, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg"
              >
                {/* Mapa */}
                {mostrar_mapa && ubicacion.mapa_embed ? (
                  <div style={{ height: altura_mapa }}>
                    <iframe
                      src={ubicacion.mapa_embed}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Mapa de ${ubicacion.nombre}`}
                    />
                  </div>
                ) : mostrar_mapa ? (
                  <div
                    className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                    style={{ height: altura_mapa }}
                  >
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Mapa no disponible</p>
                    </div>
                  </div>
                ) : null}

                {/* Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3
                        className="text-xl font-bold mb-2"
                        style={{ color: colorPrimario }}
                      >
                        {ubicacion.nombre || 'Nombre del lugar'}
                      </h3>
                      {ubicacion.direccion && (
                        <p className="text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>{ubicacion.direccion}</span>
                        </p>
                      )}
                      {ubicacion.referencia && (
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                          {ubicacion.referencia}
                        </p>
                      )}
                    </div>

                    {ubicacion.url_maps && (
                      <a
                        href={ubicacion.url_maps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
                        style={{ backgroundColor: colorPrimario }}
                      >
                        <Navigation className="w-4 h-4" />
                        <span className="hidden md:inline">Cómo llegar</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay ubicaciones configuradas</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(UbicacionCanvasBlock);
