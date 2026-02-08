/**
 * ====================================================================
 * SEPARADOR CANVAS BLOCK (Compartido)
 * ====================================================================
 * Renderer de separador compartido entre Website e Invitaciones.
 * Superset de estilos: linea, espacio, ondas, flores.
 */

import { memo } from 'react';
import { getThemeColors } from '../../utils/themeColors';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * SeparadorCanvasBlock compartido
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema del editor
 * @param {'website'|'invitacion'} [props.fallbackContext='website'] - Contexto fallback
 * @param {'fill'|'stroke'} [props.estiloOndas='fill'] - Estilo SVG para ondas
 */
function SeparadorCanvasBlock({
  bloque,
  tema,
  fallbackContext = 'website',
  estiloOndas = 'fill',
}) {
  const colors = getThemeColors(tema, fallbackContext);
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  const tipo = estilos.estilo || contenido.estilo || contenido.tipo || 'linea';
  const altura = estilos.altura ?? contenido.altura ?? (fallbackContext === 'website' ? 50 : 40);
  const colorExplicito = estilos.color || contenido.color;

  // Website usa color explícito con fallback a common, invitación usa colorPrimario
  const colorFinal = colorExplicito
    || (fallbackContext === 'website' ? THEME_FALLBACK_COLORS.common.separador : colors.primario);

  const renderSeparador = () => {
    switch (tipo) {
      case 'espacio':
        return <div style={{ height: `${altura}px` }} />;

      case 'ondas':
        return estiloOndas === 'stroke' ? (
          <div className="flex items-center justify-center" style={{ height: altura }}>
            <svg
              viewBox="0 0 200 20"
              className="w-full max-w-md"
              style={{ height: Math.min(altura, 40) }}
              preserveAspectRatio="none"
            >
              <path
                d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10"
                fill="none"
                stroke={colorFinal}
                strokeWidth="2"
              />
            </svg>
          </div>
        ) : (
          <div className="w-full overflow-hidden" style={{ height: `${altura}px` }}>
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="w-full h-full"
              style={{ fill: colorFinal }}
            >
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
          </div>
        );

      case 'flores':
        return (
          <div className="flex items-center justify-center" style={{ height: altura }}>
            <div className="flex items-center gap-6">
              <div className="w-20 h-px flex-1" style={{ backgroundColor: colorFinal }} />
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 flex-shrink-0"
                style={{ fill: colorFinal }}
              >
                <path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7H14C15.1 7 16 7.9 16 9V10C17.1 10 18 10.9 18 12C18 13.1 17.1 14 16 14V15C16 16.1 15.1 17 14 17H13V18.27C13.6 18.61 14 19.26 14 20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20C10 19.26 10.4 18.61 11 18.27V17H10C8.9 17 8 16.1 8 15V14C6.9 14 6 13.1 6 12C6 10.9 6.9 10 8 10V9C8 7.9 8.9 7 10 7H11V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2Z" />
              </svg>
              <div className="w-20 h-px flex-1" style={{ backgroundColor: colorFinal }} />
            </div>
          </div>
        );

      case 'linea':
      default:
        return (
          <div className="w-full flex items-center justify-center" style={{ height: `${altura}px` }}>
            <div
              className={`w-full h-px ${fallbackContext === 'invitacion' ? 'max-w-xs' : 'max-w-md'}`}
              style={{ backgroundColor: colorFinal }}
            />
          </div>
        );
    }
  };

  return (
    <div className={fallbackContext === 'invitacion' ? 'bg-white dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}>
      {renderSeparador()}
    </div>
  );
}

export default memo(SeparadorCanvasBlock);
