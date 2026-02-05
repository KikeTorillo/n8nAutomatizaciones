/**
 * ====================================================================
 * FORMA ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo forma/shape en el canvas.
 * Soporta variantes: linea, rectangulo, circulo, triangulo.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

// ========== COMPONENT ==========

function FormaElementRenderer({
  elemento,
  tema,
}) {
  const { contenido = {}, estilos = {} } = elemento;
  const { variante = 'linea' } = contenido;
  const {
    color,
    opacidad = 100,
    grosor = 2,
    estilo = 'solid',
    relleno = false,
    colorRelleno,
  } = estilos;

  // Calcular color usando tema si no está especificado
  const computedColor = useMemo(() => {
    return color || tema?.color_primario || '#753572';
  }, [color, tema]);

  const computedFillColor = useMemo(() => {
    return colorRelleno || computedColor;
  }, [colorRelleno, computedColor]);

  // Estilos comunes
  const commonStyles = useMemo(() => ({
    opacity: opacidad / 100,
  }), [opacidad]);

  // Renderizar según variante
  switch (variante) {
    case 'linea':
      return (
        <div
          className="forma-element linea w-full"
          style={{
            ...commonStyles,
            height: `${grosor}px`,
            backgroundColor: computedColor,
            borderStyle: estilo,
          }}
        />
      );

    case 'rectangulo':
      return (
        <div
          className="forma-element rectangulo w-full h-full"
          style={{
            ...commonStyles,
            border: `${grosor}px ${estilo} ${computedColor}`,
            backgroundColor: relleno ? computedFillColor : 'transparent',
          }}
        />
      );

    case 'circulo':
      return (
        <div
          className="forma-element circulo w-full h-full rounded-full"
          style={{
            ...commonStyles,
            border: `${grosor}px ${estilo} ${computedColor}`,
            backgroundColor: relleno ? computedFillColor : 'transparent',
            aspectRatio: '1 / 1',
          }}
        />
      );

    case 'triangulo':
      return (
        <svg
          className="forma-element triangulo w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={commonStyles}
        >
          <polygon
            points="50,10 90,90 10,90"
            fill={relleno ? computedFillColor : 'none'}
            stroke={computedColor}
            strokeWidth={grosor}
            strokeDasharray={estilo === 'dashed' ? '5,5' : estilo === 'dotted' ? '2,2' : 'none'}
          />
        </svg>
      );

    default:
      return (
        <div
          className="forma-element default w-full h-full border-2"
          style={{
            ...commonStyles,
            borderColor: computedColor,
            borderStyle: estilo,
          }}
        />
      );
  }
}

FormaElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      variante: PropTypes.oneOf(['linea', 'rectangulo', 'circulo', 'triangulo']),
    }),
    estilos: PropTypes.shape({
      color: PropTypes.string,
      opacidad: PropTypes.number,
      grosor: PropTypes.number,
      estilo: PropTypes.oneOf(['solid', 'dashed', 'dotted']),
      relleno: PropTypes.bool,
      colorRelleno: PropTypes.string,
    }),
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
  }),
};

export default memo(FormaElementRenderer);
