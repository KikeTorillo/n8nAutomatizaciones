/**
 * ====================================================================
 * SEPARADOR ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo separador en el canvas.
 * Soporta variantes: linea, puntos, gradiente, decorativo.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

// ========== COMPONENT ==========

function SeparadorElementRenderer({
  elemento,
  tema,
}) {
  const { contenido = {}, estilos = {} } = elemento;
  const { variante = 'linea' } = contenido;
  const {
    grosor = 1,
    color,
    estilo = 'solid',
  } = estilos;

  // Calcular color usando tema si no está especificado
  const computedColor = useMemo(() => {
    return color || tema?.color_primario || '#d1d5db';
  }, [color, tema]);

  // Renderizar según variante
  switch (variante) {
    case 'linea':
      return (
        <hr
          className="separador-element linea w-full border-0"
          style={{
            height: `${grosor}px`,
            backgroundColor: computedColor,
          }}
        />
      );

    case 'puntos':
      return (
        <div
          className="separador-element puntos w-full flex items-center justify-center gap-2"
          style={{ height: `${Math.max(grosor * 4, 8)}px` }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: `${grosor * 3}px`,
                height: `${grosor * 3}px`,
                backgroundColor: computedColor,
              }}
            />
          ))}
        </div>
      );

    case 'gradiente':
      return (
        <div
          className="separador-element gradiente w-full"
          style={{
            height: `${grosor}px`,
            background: `linear-gradient(90deg, transparent, ${computedColor}, transparent)`,
          }}
        />
      );

    case 'decorativo':
      return (
        <div className="separador-element decorativo w-full flex items-center gap-4">
          <div
            className="flex-1"
            style={{
              height: `${grosor}px`,
              background: `linear-gradient(90deg, transparent, ${computedColor})`,
            }}
          />
          <div
            className="transform rotate-45"
            style={{
              width: `${grosor * 6}px`,
              height: `${grosor * 6}px`,
              backgroundColor: computedColor,
            }}
          />
          <div
            className="flex-1"
            style={{
              height: `${grosor}px`,
              background: `linear-gradient(90deg, ${computedColor}, transparent)`,
            }}
          />
        </div>
      );

    default:
      return (
        <hr
          className="separador-element default w-full"
          style={{
            height: `${grosor}px`,
            backgroundColor: computedColor,
            borderStyle: estilo,
          }}
        />
      );
  }
}

SeparadorElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      variante: PropTypes.oneOf(['linea', 'puntos', 'gradiente', 'decorativo']),
    }),
    estilos: PropTypes.shape({
      grosor: PropTypes.number,
      color: PropTypes.string,
      estilo: PropTypes.oneOf(['solid', 'dashed', 'dotted']),
    }),
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
  }),
};

export default memo(SeparadorElementRenderer);
