/**
 * ====================================================================
 * TIMELINE PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza el itinerario/agenda del evento.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { Clock, MapPin, ChevronRight } from 'lucide-react';

function TimelinePublico({ bloque, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  // Editor guarda titulo_seccion/subtitulo_seccion, antes se usaba titulo/subtitulo
  const titulo = contenido.titulo_seccion || contenido.titulo || 'Itinerario';
  const subtitulo = contenido.subtitulo_seccion || contenido.subtitulo;
  const items = contenido.items || [];

  const layout = estilos.layout || contenido.layout || 'vertical';
  const mostrarIconos = estilos.mostrar_iconos !== false;

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  if (items.length === 0) return null;

  return (
    <section
      className={`py-20 ${className}`}
      style={{ backgroundColor: tema?.color_secundario + '10' }}
    >
      <div className="max-w-4xl mx-auto px-4">
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

        {/* Timeline */}
        {layout === 'vertical' ? (
          <div className="relative">
            {/* Línea central */}
            <div
              className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
              style={{ backgroundColor: tema?.color_primario + '30' }}
            />

            {items.map((item, idx) => (
              <div
                key={idx}
                className={`relative flex items-start gap-4 sm:gap-8 mb-8 last:mb-0 ${
                  isVisible ? 'animate-fadeInUp' : 'opacity-0'
                }`}
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                {/* Punto en la línea */}
                <div
                  className="absolute left-4 sm:left-1/2 w-4 h-4 rounded-full -translate-x-1/2 z-10"
                  style={{
                    backgroundColor: tema?.color_primario,
                    boxShadow: `0 0 0 4px ${tema?.color_secundario}`,
                  }}
                />

                {/* Contenido */}
                <div
                  className={`ml-10 sm:ml-0 ${
                    idx % 2 === 0 ? 'sm:mr-[calc(50%+2rem)] sm:text-right' : 'sm:ml-[calc(50%+2rem)]'
                  } bg-white rounded-2xl p-6 shadow-sm flex-1`}
                  style={{ boxShadow: `0 4px 20px ${tema?.color_primario}10` }}
                >
                  {/* Hora */}
                  {item.hora && (
                    <div
                      className={`flex items-center gap-2 mb-2 ${
                        idx % 2 === 0 ? 'sm:justify-end' : ''
                      }`}
                    >
                      <Clock className="w-4 h-4" style={{ color: tema?.color_primario }} />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: tema?.color_primario }}
                      >
                        {item.hora}
                      </span>
                    </div>
                  )}

                  {/* Título del item */}
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: tema?.color_texto }}
                  >
                    {item.titulo}
                  </h3>

                  {/* Descripción */}
                  {item.descripcion && (
                    <p className="text-sm" style={{ color: tema?.color_texto_claro }}>
                      {item.descripcion}
                    </p>
                  )}

                  {/* Ubicación */}
                  {item.ubicacion && (
                    <div
                      className={`flex items-center gap-1 mt-3 ${
                        idx % 2 === 0 ? 'sm:justify-end' : ''
                      }`}
                    >
                      <MapPin className="w-4 h-4" style={{ color: tema?.color_texto_claro }} />
                      <span className="text-sm" style={{ color: tema?.color_texto_claro }}>
                        {item.ubicacion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Layout horizontal (tarjetas) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-6 ${isVisible ? 'animate-scaleIn' : 'opacity-0'}`}
                style={{
                  boxShadow: `0 4px 20px ${tema?.color_primario}10`,
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                {/* Hora */}
                {item.hora && (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
                    style={{ backgroundColor: tema?.color_secundario }}
                  >
                    <Clock className="w-4 h-4" style={{ color: tema?.color_primario }} />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: tema?.color_primario }}
                    >
                      {item.hora}
                    </span>
                  </div>
                )}

                {/* Título */}
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: tema?.color_texto }}
                >
                  {item.titulo}
                </h3>

                {/* Descripción */}
                {item.descripcion && (
                  <p className="text-sm mb-3" style={{ color: tema?.color_texto_claro }}>
                    {item.descripcion}
                  </p>
                )}

                {/* Ubicación */}
                {item.ubicacion && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" style={{ color: tema?.color_texto_claro }} />
                    <span className="text-sm" style={{ color: tema?.color_texto_claro }}>
                      {item.ubicacion}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TimelinePublico);
