/**
 * ====================================================================
 * ELEMENT WRAPPER
 * ====================================================================
 * HOC que envuelve elementos del canvas con capacidades de
 * selección, drag, resize y rotación.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback, useMemo, useRef } from 'react';
import { Rnd } from 'react-rnd';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { getElementType } from './elementTypes';

// ========== CONSTANTES ==========

const RESIZE_HANDLE_STYLES = {
  width: '10px',
  height: '10px',
  background: 'white',
  border: '2px solid #753572',
  borderRadius: '2px',
};

const RESIZE_HANDLE_CORNER_STYLES = {
  ...RESIZE_HANDLE_STYLES,
  width: '12px',
  height: '12px',
  borderRadius: '50%',
};

// ========== COMPONENT ==========

function ElementWrapper({
  elemento,
  isSelected,
  isEditing,
  onSelect,
  onMove,
  onResize,
  onDoubleClick,
  breakpoint,
  containerWidth,
  containerHeight,
  zoom = 100,
  children,
  disabled = false,
}) {
  const rndRef = useRef(null);
  const elementConfig = getElementType(elemento.tipo);

  // Calcular posición según breakpoint actual
  const posicion = useMemo(() => {
    const basePos = elemento.posicion || {};
    const responsivePos = elemento.responsive?.[breakpoint] || {};
    return { ...basePos, ...responsivePos };
  }, [elemento.posicion, elemento.responsive, breakpoint]);

  // Detectar si es un elemento full-width (ancho = 100%)
  const isFullWidth = posicion.ancho === 100 || posicion.ancho === '100';

  // Convertir porcentajes a píxeles para Rnd
  const pixelPosition = useMemo(() => {
    if (isFullWidth) {
      // Full-width: posición X siempre 0, solo Y varía
      return {
        x: 0,
        y: (posicion.y / 100) * containerHeight,
      };
    }
    // Normal: calcular según posición
    const x = (posicion.x / 100) * containerWidth;
    const y = (posicion.y / 100) * containerHeight;
    return { x, y };
  }, [posicion.x, posicion.y, containerWidth, containerHeight, isFullWidth]);

  // Calcular tamaño en píxeles
  const pixelSize = useMemo(() => {
    const width = posicion.ancho === 'auto'
      ? 'auto'
      : (posicion.ancho / 100) * containerWidth;

    const height = posicion.altura === 'auto'
      ? 'auto'
      : typeof posicion.altura === 'number'
        ? posicion.altura
        : 'auto';

    return { width, height };
  }, [posicion.ancho, posicion.altura, containerWidth]);

  // Handle drag stop - convertir píxeles a porcentajes
  const handleDragStop = useCallback((e, data) => {
    if (disabled) return;

    const newX = (data.x / containerWidth) * 100;
    const newY = (data.y / containerHeight) * 100;

    onMove?.({
      x: Math.round(newX * 100) / 100,
      y: Math.round(newY * 100) / 100,
    });
  }, [disabled, containerWidth, containerHeight, onMove]);

  // Handle resize stop
  const handleResizeStop = useCallback((e, direction, ref, delta, position) => {
    if (disabled) return;

    const newWidth = (ref.offsetWidth / containerWidth) * 100;
    const newX = (position.x / containerWidth) * 100;
    const newY = (position.y / containerHeight) * 100;

    onResize?.({
      ancho: Math.round(newWidth * 100) / 100,
      altura: elementConfig?.maintainAspectRatio ? 'auto' : ref.offsetHeight,
      x: Math.round(newX * 100) / 100,
      y: Math.round(newY * 100) / 100,
    });
  }, [disabled, containerWidth, containerHeight, elementConfig, onResize]);

  // Handle click para selección
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!disabled) {
      onSelect?.();
    }
  }, [disabled, onSelect]);

  // Handle double click para edición inline
  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    if (!disabled) {
      onDoubleClick?.();
    }
  }, [disabled, onDoubleClick]);

  // Determinar qué handles de resize mostrar
  const resizeHandles = useMemo(() => {
    if (!elementConfig?.canResize || disabled) {
      return {};
    }

    if (elementConfig.maintainAspectRatio) {
      // Solo esquinas para mantener proporción
      return {
        topLeft: true,
        topRight: true,
        bottomLeft: true,
        bottomRight: true,
      };
    }

    // Todos los handles
    return {
      top: true,
      right: true,
      bottom: true,
      left: true,
      topLeft: true,
      topRight: true,
      bottomLeft: true,
      bottomRight: true,
    };
  }, [elementConfig, disabled]);

  // Estilos de los handles de resize
  const resizeHandleComponent = useMemo(() => {
    if (!isSelected || disabled) return {};

    return {
      top: <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 cursor-n-resize" style={RESIZE_HANDLE_STYLES} />,
      right: <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 cursor-e-resize" style={RESIZE_HANDLE_STYLES} />,
      bottom: <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 cursor-s-resize" style={RESIZE_HANDLE_STYLES} />,
      left: <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 cursor-w-resize" style={RESIZE_HANDLE_STYLES} />,
      topLeft: <div className="absolute -top-1.5 -left-1.5 cursor-nw-resize" style={RESIZE_HANDLE_CORNER_STYLES} />,
      topRight: <div className="absolute -top-1.5 -right-1.5 cursor-ne-resize" style={RESIZE_HANDLE_CORNER_STYLES} />,
      bottomLeft: <div className="absolute -bottom-1.5 -left-1.5 cursor-sw-resize" style={RESIZE_HANDLE_CORNER_STYLES} />,
      bottomRight: <div className="absolute -bottom-1.5 -right-1.5 cursor-se-resize" style={RESIZE_HANDLE_CORNER_STYLES} />,
    };
  }, [isSelected, disabled]);

  // Estilo del contenedor basado en ancla
  const anchorStyle = useMemo(() => {
    // Full-width: no aplicar transform para evitar desplazamiento
    if (isFullWidth) {
      return {};
    }

    const ancla = posicion.ancla || 'center';
    switch (ancla) {
      case 'top-left':
        return { transform: 'translate(0, 0)' };
      case 'top-center':
        return { transform: 'translateX(-50%)' };
      case 'top-right':
        return { transform: 'translateX(-100%)' };
      case 'center-left':
        return { transform: 'translateY(-50%)' };
      case 'center':
        return { transform: 'translate(-50%, -50%)' };
      case 'center-right':
        return { transform: 'translate(-100%, -50%)' };
      case 'bottom-left':
        return { transform: 'translateY(-100%)' };
      case 'bottom-center':
        return { transform: 'translate(-50%, -100%)' };
      case 'bottom-right':
        return { transform: 'translate(-100%, -100%)' };
      default:
        return { transform: 'translate(-50%, -50%)' };
    }
  }, [posicion.ancla, isFullWidth]);

  return (
    <Rnd
      ref={rndRef}
      position={pixelPosition}
      size={pixelSize}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      enableResizing={isSelected && !isFullWidth ? resizeHandles : false}
      disableDragging={disabled || isEditing}
      dragAxis={isFullWidth ? 'y' : 'both'}
      resizeHandleComponent={resizeHandleComponent}
      lockAspectRatio={elementConfig?.maintainAspectRatio || false}
      bounds="parent"
      scale={zoom / 100}
      style={{
        zIndex: elemento.capa || 1,
        ...anchorStyle,
      }}
      className={cn(
        'element-wrapper',
        'transition-shadow duration-150',
        isSelected && 'ring-2 ring-primary-500 ring-offset-2',
        isEditing && 'ring-2 ring-blue-500',
        !disabled && (isFullWidth ? 'cursor-ns-resize' : 'cursor-move'),
        disabled && 'pointer-events-none',
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="element-content w-full h-full"
        style={{
          transform: posicion.rotacion ? `rotate(${posicion.rotacion}deg)` : undefined,
        }}
      >
        {children}
      </div>
    </Rnd>
  );
}

ElementWrapper.propTypes = {
  elemento: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    posicion: PropTypes.object,
    responsive: PropTypes.object,
    capa: PropTypes.number,
  }).isRequired,
  isSelected: PropTypes.bool,
  isEditing: PropTypes.bool,
  onSelect: PropTypes.func,
  onMove: PropTypes.func,
  onResize: PropTypes.func,
  onDoubleClick: PropTypes.func,
  breakpoint: PropTypes.oneOf(['desktop', 'tablet', 'mobile']),
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  zoom: PropTypes.number,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

export default memo(ElementWrapper);
