/**
 * ====================================================================
 * SEPARADOR CANVAS BLOCK
 * ====================================================================
 * Bloque separador/divisor para invitaciones digitales.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * Separador Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function SeparadorCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const estilo = contenido.estilo || estilos.estilo || 'linea';
  const altura = estilos.altura ?? contenido.altura ?? 40;
  const color = estilos.color || contenido.color;

  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorFinal = color || colorPrimario;

  // Renderizar separador según estilo
  const renderSeparador = () => {
    switch (estilo) {
      case 'linea':
        return (
          <div className="flex items-center justify-center" style={{ height: altura }}>
            <div
              className="w-full max-w-xs h-px"
              style={{ backgroundColor: colorFinal }}
            />
          </div>
        );

      case 'espacio':
        return <div style={{ height: altura }} />;

      case 'ondas':
        return (
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
        );

      case 'flores':
        return (
          <div className="flex items-center justify-center" style={{ height: altura }}>
            <div className="flex items-center gap-6">
              <div
                className="w-20 h-px flex-1"
                style={{ backgroundColor: colorFinal }}
              />
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 flex-shrink-0"
                style={{ fill: colorFinal }}
              >
                <path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7H14C15.1 7 16 7.9 16 9V10C17.1 10 18 10.9 18 12C18 13.1 17.1 14 16 14V15C16 16.1 15.1 17 14 17H13V18.27C13.6 18.61 14 19.26 14 20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20C10 19.26 10.4 18.61 11 18.27V17H10C8.9 17 8 16.1 8 15V14C6.9 14 6 13.1 6 12C6 10.9 6.9 10 8 10V9C8 7.9 8.9 7 10 7H11V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2Z" />
              </svg>
              <div
                className="w-20 h-px flex-1"
                style={{ backgroundColor: colorFinal }}
              />
            </div>
          </div>
        );

      default:
        return <div style={{ height: altura }} />;
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900">
      {renderSeparador()}
    </section>
  );
}

export default memo(SeparadorCanvasBlock);
