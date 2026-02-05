/**
 * ====================================================================
 * SNAP GUIDES
 * ====================================================================
 * Líneas guía de alineación para el canvas.
 * Muestra guías visuales cuando un elemento se alinea con otros.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

// ========== COMPONENT ==========

function SnapGuides({
  guides = [],
  containerWidth,
  containerHeight,
  visible = true,
}) {
  if (!visible || guides.length === 0) {
    return null;
  }

  return (
    <div className="snap-guides absolute inset-0 pointer-events-none z-50">
      {guides.map((guide, index) => {
        if (guide.type === 'vertical') {
          // Guía vertical (línea de arriba a abajo)
          const x = (guide.position / 100) * containerWidth;
          return (
            <div
              key={`v-${index}`}
              className="absolute top-0 bottom-0 w-px bg-primary-500"
              style={{
                left: `${x}px`,
                boxShadow: '0 0 4px rgba(117, 53, 114, 0.5)',
              }}
            />
          );
        }

        if (guide.type === 'horizontal') {
          // Guía horizontal (línea de izquierda a derecha)
          const y = (guide.position / 100) * containerHeight;
          return (
            <div
              key={`h-${index}`}
              className="absolute left-0 right-0 h-px bg-primary-500"
              style={{
                top: `${y}px`,
                boxShadow: '0 0 4px rgba(117, 53, 114, 0.5)',
              }}
            />
          );
        }

        if (guide.type === 'center-v') {
          // Guía de centro vertical
          return (
            <div
              key={`cv-${index}`}
              className="absolute top-0 bottom-0 w-px bg-blue-500"
              style={{
                left: '50%',
                boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)',
              }}
            />
          );
        }

        if (guide.type === 'center-h') {
          // Guía de centro horizontal
          return (
            <div
              key={`ch-${index}`}
              className="absolute left-0 right-0 h-px bg-blue-500"
              style={{
                top: '50%',
                boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)',
              }}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

SnapGuides.propTypes = {
  guides: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['vertical', 'horizontal', 'center-v', 'center-h']).isRequired,
      position: PropTypes.number, // Posición en % (0-100)
    })
  ),
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  visible: PropTypes.bool,
};

export default memo(SnapGuides);

// ========== HELPER FUNCTIONS ==========

/**
 * Calcula las guías de snap para un elemento en movimiento
 *
 * @param {Object} movingElement - Elemento que se está moviendo
 * @param {Array} otherElements - Otros elementos en el canvas
 * @param {Object} options - Opciones de configuración
 * @returns {Object} { guides: Array, snappedPosition: { x, y } }
 */
export function calculateSnapGuides(movingElement, otherElements, options = {}) {
  const {
    snapThreshold = 5, // Umbral en % para activar snap
    snapToCenter = true,
    snapToEdges = true,
    snapToOtherElements = true,
  } = options;

  const guides = [];
  let snappedX = movingElement.x;
  let snappedY = movingElement.y;

  // Snap al centro del contenedor
  if (snapToCenter) {
    // Centro vertical (50%)
    if (Math.abs(movingElement.x - 50) < snapThreshold) {
      guides.push({ type: 'center-v', position: 50 });
      snappedX = 50;
    }
    // Centro horizontal (50%)
    if (Math.abs(movingElement.y - 50) < snapThreshold) {
      guides.push({ type: 'center-h', position: 50 });
      snappedY = 50;
    }
  }

  // Snap a los bordes del contenedor
  if (snapToEdges) {
    // Borde izquierdo
    if (Math.abs(movingElement.x) < snapThreshold) {
      guides.push({ type: 'vertical', position: 0 });
      snappedX = 0;
    }
    // Borde derecho
    if (Math.abs(movingElement.x - 100) < snapThreshold) {
      guides.push({ type: 'vertical', position: 100 });
      snappedX = 100;
    }
    // Borde superior
    if (Math.abs(movingElement.y) < snapThreshold) {
      guides.push({ type: 'horizontal', position: 0 });
      snappedY = 0;
    }
    // Borde inferior
    if (Math.abs(movingElement.y - 100) < snapThreshold) {
      guides.push({ type: 'horizontal', position: 100 });
      snappedY = 100;
    }
  }

  // Snap a otros elementos
  if (snapToOtherElements && otherElements.length > 0) {
    otherElements.forEach((other) => {
      const otherPos = other.posicion || {};

      // Alineación vertical (mismo X)
      if (Math.abs(movingElement.x - otherPos.x) < snapThreshold) {
        guides.push({ type: 'vertical', position: otherPos.x });
        snappedX = otherPos.x;
      }

      // Alineación horizontal (mismo Y)
      if (Math.abs(movingElement.y - otherPos.y) < snapThreshold) {
        guides.push({ type: 'horizontal', position: otherPos.y });
        snappedY = otherPos.y;
      }
    });
  }

  return {
    guides,
    snappedPosition: { x: snappedX, y: snappedY },
  };
}
