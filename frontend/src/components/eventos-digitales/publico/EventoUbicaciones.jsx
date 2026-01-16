import { forwardRef } from 'react';
import { MapPin, Clock } from 'lucide-react';

/**
 * Sección de ubicaciones para página pública de eventos
 */
const EventoUbicaciones = forwardRef(function EventoUbicaciones({
  ubicaciones,
  tema,
  visibleSections,
}, ref) {
  if (!ubicaciones || ubicaciones.length === 0) return null;

  return (
    <section
      ref={ref}
      data-section="ubicaciones"
      className="py-20"
      style={{ backgroundColor: tema.color_secundario + '30' }}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className={`text-center mb-12 ${visibleSections.has('ubicaciones') ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
          >
            Ubicaciones
          </h2>
          <p className="text-lg" style={{ color: tema.color_texto_claro }}>
            Te esperamos en
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {ubicaciones.map((ubi, ubiIdx) => (
            <div
              key={ubi.id}
              className={`relative overflow-hidden rounded-3xl p-8 transition-transform hover:scale-[1.02] ${visibleSections.has('ubicaciones') ? (ubiIdx % 2 === 0 ? 'animate-slideInLeft' : 'animate-slideInRight') : 'opacity-0'}`}
              style={{
                animationDelay: `${ubiIdx * 0.15}s`,
                backgroundColor: 'white',
                boxShadow: `0 10px 40px ${tema.color_primario}15`
              }}
            >
              {/* Decorative corner */}
              <div
                className="absolute top-0 right-0 w-24 h-24 opacity-10"
                style={{
                  background: `radial-gradient(circle at top right, ${tema.color_primario}, transparent)`
                }}
              />

              <div className="flex items-start gap-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: tema.color_secundario }}
                >
                  <MapPin className="w-8 h-8" style={{ color: tema.color_primario }} />
                </div>
                <div className="flex-1">
                  <p
                    className="text-sm font-semibold uppercase tracking-wider mb-1"
                    style={{ color: tema.color_primario }}
                  >
                    {ubi.tipo}
                  </p>
                  <h3
                    className="text-2xl font-bold mb-3"
                    style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
                  >
                    {ubi.nombre}
                  </h3>
                  {ubi.hora_inicio && (
                    <p className="flex items-center gap-2 mb-2" style={{ color: tema.color_texto_claro }}>
                      <Clock className="w-4 h-4" />
                      {ubi.hora_inicio}{ubi.hora_fin ? ` - ${ubi.hora_fin}` : ''}
                    </p>
                  )}
                  {ubi.direccion && (
                    <p className="mb-2" style={{ color: tema.color_texto_claro }}>{ubi.direccion}</p>
                  )}
                  {ubi.codigo_vestimenta && (
                    <p className="text-sm mb-3" style={{ color: tema.color_texto_claro }}>
                      <span className="font-medium">Vestimenta:</span> {ubi.codigo_vestimenta}
                    </p>
                  )}
                  {ubi.google_maps_url && (
                    <a
                      href={ubi.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
                      style={{
                        backgroundColor: tema.color_primario,
                        color: 'white'
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                      Ver en Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default EventoUbicaciones;
