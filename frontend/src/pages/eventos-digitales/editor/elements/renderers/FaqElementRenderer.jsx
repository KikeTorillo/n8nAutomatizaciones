/**
 * ====================================================================
 * FAQ ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo faq en el canvas.
 * Muestra preguntas frecuentes en formato acordeón.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

function FaqElementRenderer({
  elemento,
  tema,
  isEditing = false,
}) {
  const { contenido = {} } = elemento;

  const titulo = contenido.titulo_seccion || contenido.titulo || 'Preguntas Frecuentes';
  const subtitulo = contenido.subtitulo_seccion || contenido.subtitulo || '';
  const items = contenido.items || [];

  // Estilos del tema
  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorSecundario = tema?.color_secundario || INV.secundario;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;
  const fuenteTitulo = tema?.fuente_titulos || 'inherit';

  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (idx) => {
    if (isEditing) return; // No toggle en modo edición
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.clear();
        newSet.add(idx);
      }
      return newSet;
    });
  };

  // Mostrar placeholder si no hay items en modo edición
  if (items.length === 0) {
    if (isEditing) {
      return (
        <div className="faq-element w-full py-6">
          <div className="text-center mb-6">
            <HelpCircle className="w-8 h-8 mx-auto mb-2" style={{ color: colorPrimario }} />
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
            className="text-center py-6 rounded-xl"
            style={{ backgroundColor: colorSecundario + '30' }}
          >
            <p className="text-sm" style={{ color: colorTextoClaro }}>
              Las preguntas frecuentes se mostrarán aquí
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="faq-element w-full py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <HelpCircle className="w-8 h-8 mx-auto mb-2" style={{ color: colorPrimario }} />
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

      {/* Acordeón */}
      <div className="space-y-2">
        {items.slice(0, 5).map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl overflow-hidden"
            style={{ boxShadow: `0 2px 10px ${colorPrimario}10` }}
          >
            {/* Pregunta */}
            <button
              onClick={() => toggleItem(idx)}
              className="w-full flex items-center justify-between p-4 text-left transition-colors"
              style={{
                backgroundColor: openItems.has(idx) ? colorSecundario + '30' : 'white',
              }}
            >
              <span className="font-semibold text-sm pr-3" style={{ color: colorTexto }}>
                {item.pregunta}
              </span>
              <ChevronDown
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                  openItems.has(idx) ? 'rotate-180' : ''
                }`}
                style={{ color: colorPrimario }}
              />
            </button>

            {/* Respuesta */}
            <div
              className={`overflow-hidden transition-all duration-200 ${
                openItems.has(idx) ? 'max-h-48' : 'max-h-0'
              }`}
            >
              <div className="px-4 pb-4 text-sm" style={{ color: colorTextoClaro }}>
                {item.respuesta}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicador de más preguntas */}
      {items.length > 5 && (
        <p className="text-center text-xs mt-3" style={{ color: colorTextoClaro }}>
          +{items.length - 5} preguntas más
        </p>
      )}
    </div>
  );
}

FaqElementRenderer.propTypes = {
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
  isEditing: PropTypes.bool,
};

export default memo(FaqElementRenderer);
