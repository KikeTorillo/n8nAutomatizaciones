/**
 * ====================================================================
 * MESA REGALOS PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza la mesa de regalos con links a tiendas.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { Gift, ExternalLink, CreditCard, Copy } from 'lucide-react';

function MesaRegalosPublico({ bloque, evento, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  const titulo = contenido.titulo || 'Mesa de Regalos';
  const subtitulo = contenido.subtitulo || 'Tu presencia es nuestro mejor regalo, pero si deseas obsequiarnos algo...';
  // Editor guarda 'items', antes se usaba 'regalos'
  // Prioridad: items del bloque > regalos del bloque > regalos del evento
  const regalos = contenido.items?.length > 0
    ? contenido.items
    : contenido.regalos?.length > 0
      ? contenido.regalos
      : evento?.regalos || [];

  const layout = estilos.layout || contenido.layout || 'grid';
  const mostrarDescripcion = estilos.mostrar_descripcion !== false;

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  if (regalos.length === 0) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // TODO: Toast notification
  };

  return (
    <section
      className={`py-20 ${className}`}
      style={{ backgroundColor: tema?.color_secundario + '10' }}
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-12 ${animationClass}`}>
          <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: tema?.color_primario }} />
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: tema?.color_texto, fontFamily: tema?.fuente_titulo }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-lg max-w-2xl mx-auto" style={{ color: tema?.color_texto_claro }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Lista de regalos */}
        <div
          className={`grid gap-6 ${
            layout === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 max-w-2xl mx-auto'
          }`}
        >
          {regalos.map((regalo, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl overflow-hidden ${
                isVisible ? 'animate-scaleIn' : 'opacity-0'
              }`}
              style={{
                boxShadow: `0 4px 20px ${tema?.color_primario}10`,
                animationDelay: `${idx * 0.1}s`,
              }}
            >
              {/* Logo/Imagen */}
              {regalo.logo_url || regalo.imagen_url ? (
                <div
                  className="h-32 flex items-center justify-center p-4"
                  style={{ backgroundColor: tema?.color_secundario + '30' }}
                >
                  <img
                    src={regalo.logo_url || regalo.imagen_url}
                    alt={regalo.nombre}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: tema?.color_secundario + '30' }}
                >
                  <Gift className="w-12 h-12" style={{ color: tema?.color_primario }} />
                </div>
              )}

              {/* Info */}
              <div className="p-6">
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: tema?.color_texto }}
                >
                  {regalo.nombre || regalo.tienda}
                </h3>

                {mostrarDescripcion && regalo.descripcion && (
                  <p className="text-sm mb-4" style={{ color: tema?.color_texto_claro }}>
                    {regalo.descripcion}
                  </p>
                )}

                {/* Número de cuenta/CLABE */}
                {regalo.numero_cuenta && (
                  <div
                    className="flex items-center justify-between p-3 rounded-lg mb-4"
                    style={{ backgroundColor: tema?.color_secundario + '30' }}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" style={{ color: tema?.color_primario }} />
                      <span className="text-sm font-mono" style={{ color: tema?.color_texto }}>
                        {regalo.numero_cuenta}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(regalo.numero_cuenta)}
                      className="p-1.5 rounded hover:bg-white/50 transition-colors"
                    >
                      <Copy className="w-4 h-4" style={{ color: tema?.color_primario }} />
                    </button>
                  </div>
                )}

                {/* Link externo */}
                {regalo.url && (
                  <a
                    href={regalo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 w-full justify-center"
                    style={{
                      backgroundColor: tema?.color_primario,
                      color: 'white',
                    }}
                  >
                    Ver lista
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(MesaRegalosPublico);
