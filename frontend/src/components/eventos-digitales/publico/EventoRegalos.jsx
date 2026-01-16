import { forwardRef } from 'react';
import { Gift, ExternalLink } from 'lucide-react';

/**
 * Sección de mesa de regalos para página pública de eventos
 */
const EventoRegalos = forwardRef(function EventoRegalos({
  regalos,
  tema,
  visibleSections,
}, ref) {
  // Filtrar solo regalos no comprados
  const regalosDisponibles = regalos?.filter(r => !r.comprado) || [];

  if (regalosDisponibles.length === 0) return null;

  return (
    <section
      ref={ref}
      data-section="regalos"
      className="max-w-5xl mx-auto px-4 py-20"
    >
      <div className={`text-center mb-12 ${visibleSections.has('regalos') ? 'animate-fadeInUp' : 'opacity-0'}`}>
        <h2
          className="text-4xl sm:text-5xl font-bold mb-4"
          style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
        >
          Mesa de Regalos
        </h2>
        <p className="text-lg max-w-xl mx-auto" style={{ color: tema.color_texto_claro }}>
          Tu presencia es nuestro mejor regalo, pero si deseas obsequiarnos algo
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {regalosDisponibles.map((regalo, idx) => (
          <div
            key={regalo.id}
            className={`group relative overflow-hidden rounded-3xl p-6 transition-all hover:scale-[1.02] ${visibleSections.has('regalos') ? 'animate-scaleIn' : 'opacity-0'}`}
            style={{
              animationDelay: `${idx * 0.1}s`,
              backgroundColor: 'white',
              boxShadow: `0 10px 40px ${tema.color_primario}10`
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: tema.color_secundario }}
            >
              <Gift className="w-7 h-7" style={{ color: tema.color_primario }} />
            </div>
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: tema.color_texto }}
            >
              {regalo.nombre}
            </h3>
            {regalo.descripcion && (
              <p className="text-sm mb-3" style={{ color: tema.color_texto_claro }}>
                {regalo.descripcion}
              </p>
            )}
            {regalo.precio && (
              <p
                className="text-2xl font-bold mb-4"
                style={{ color: tema.color_primario }}
              >
                ${regalo.precio.toLocaleString()}
              </p>
            )}
            {regalo.url_externa && (
              <a
                href={regalo.url_externa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: tema.color_primario }}
              >
                Ver regalo
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
});

export default EventoRegalos;
