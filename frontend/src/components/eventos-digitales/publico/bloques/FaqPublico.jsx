/**
 * ====================================================================
 * FAQ PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza preguntas frecuentes con acordeón.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

function FaqPublico({ bloque, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  // Editor guarda titulo_seccion/subtitulo_seccion, antes se usaba titulo/subtitulo
  const titulo = contenido.titulo_seccion || contenido.titulo || 'Preguntas Frecuentes';
  const subtitulo = contenido.subtitulo_seccion || contenido.subtitulo;
  const items = contenido.items || [];

  const permitirMultiples = estilos.permitir_multiples || false;

  const [openItems, setOpenItems] = useState(new Set());

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  if (items.length === 0) return null;

  const toggleItem = (idx) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        if (!permitirMultiples) {
          newSet.clear();
        }
        newSet.add(idx);
      }
      return newSet;
    });
  };

  return (
    <section className={`py-20 ${className}`}>
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-12 ${animationClass}`}>
          <HelpCircle className="w-12 h-12 mx-auto mb-4" style={{ color: tema?.color_primario }} />
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

        {/* Acordeón */}
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl overflow-hidden ${
                isVisible ? 'animate-fadeInUp' : 'opacity-0'
              }`}
              style={{
                boxShadow: `0 4px 20px ${tema?.color_primario}10`,
                animationDelay: `${idx * 0.1}s`,
              }}
            >
              {/* Pregunta (header) */}
              <button
                onClick={() => toggleItem(idx)}
                className="w-full flex items-center justify-between p-6 text-left transition-colors"
                style={{
                  backgroundColor: openItems.has(idx) ? tema?.color_secundario + '30' : 'white',
                }}
              >
                <span
                  className="font-semibold text-lg pr-4"
                  style={{ color: tema?.color_texto }}
                >
                  {item.pregunta}
                </span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                    openItems.has(idx) ? 'rotate-180' : ''
                  }`}
                  style={{ color: tema?.color_primario }}
                />
              </button>

              {/* Respuesta (contenido) */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openItems.has(idx) ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div
                  className="px-6 pb-6"
                  style={{ color: tema?.color_texto_claro }}
                >
                  {item.respuesta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(FaqPublico);
