/**
 * ====================================================================
 * CANVAS SECTION
 * ====================================================================
 * Componente de sección para el canvas de posición libre.
 * Representa un contenedor con fondo donde se colocan elementos.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

// ========== HELPERS ==========

/**
 * Genera estilos CSS para el fondo de la sección
 */
function generateBackgroundStyles(fondo, tema) {
  if (!fondo) return {};

  const styles = {};

  switch (fondo.tipo) {
    case 'color':
      styles.backgroundColor = fondo.valor || tema?.color_primario || '#ffffff';
      break;

    case 'imagen':
      if (fondo.valor) {
        styles.backgroundImage = `url(${fondo.valor})`;
        styles.backgroundSize = 'cover';
        styles.backgroundPosition = fondo.posicion || 'center center';
        styles.backgroundRepeat = 'no-repeat';
      }
      break;

    case 'gradiente':
      styles.background = fondo.valor || `linear-gradient(135deg, ${tema?.color_primario || '#753572'}, ${tema?.color_secundario || '#F59E0B'})`;
      break;

    case 'video':
      // Video se maneja con un elemento separado
      break;

    default:
      break;
  }

  return styles;
}

/**
 * Genera estilos para el overlay
 */
function generateOverlayStyles(overlay) {
  if (!overlay || !overlay.color) return null;

  return {
    backgroundColor: overlay.color,
    opacity: overlay.opacidad ?? 0.4,
  };
}

// ========== COMPONENT ==========

const CanvasSection = forwardRef(function CanvasSection({
  seccion,
  tema,
  isSelected,
  isEditorMode = true,
  onSelect,
  onClick,
  children,
  className,
  style,
}, ref) {
  const { config = {} } = seccion;
  const {
    altura = { valor: 100, unidad: 'vh' },
    padding = { top: 40, bottom: 40 },
    fondo = {},
  } = config;

  // Calcular altura
  const alturaStyle = useMemo(() => {
    if (altura.unidad === 'auto') {
      return 'auto';
    }
    return `${altura.valor}${altura.unidad}`;
  }, [altura]);

  // Estilos de fondo
  const backgroundStyles = useMemo(
    () => generateBackgroundStyles(fondo, tema),
    [fondo, tema]
  );

  // Estilos de overlay
  const overlayStyles = useMemo(
    () => generateOverlayStyles(fondo.overlay),
    [fondo.overlay]
  );

  // Estilos de padding
  const paddingStyles = useMemo(() => ({
    paddingTop: `${padding.top}px`,
    paddingBottom: `${padding.bottom}px`,
  }), [padding]);

  // Manejar click en la sección (no en elementos)
  const handleClick = (e) => {
    // Solo si el click es directamente en la sección
    if (e.target === e.currentTarget || e.target.classList.contains('section-content')) {
      onSelect?.();
      onClick?.(e);
    }
  };

  return (
    <section
      ref={ref}
      className={cn(
        'canvas-section relative w-full',
        isEditorMode && 'transition-shadow duration-200',
        isSelected && isEditorMode && 'ring-2 ring-primary-500 ring-inset',
        className
      )}
      style={{
        minHeight: alturaStyle,
        ...backgroundStyles,
        ...paddingStyles,
        ...style,
      }}
      onClick={handleClick}
      data-section-id={seccion.id}
    >
      {/* Overlay */}
      {overlayStyles && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={overlayStyles}
        />
      )}

      {/* Video de fondo */}
      {fondo.tipo === 'video' && fondo.valor && (
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          src={fondo.valor}
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {/* Contenido (elementos posicionados) */}
      <div className="section-content relative w-full h-full z-10">
        {children}
      </div>

      {/* Indicador de sección vacía (solo en editor) */}
      {isEditorMode && (!children || (Array.isArray(children) && children.length === 0)) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 dark:text-gray-500 text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-sm">Arrastra elementos aquí</p>
          </div>
        </div>
      )}
    </section>
  );
});

CanvasSection.propTypes = {
  seccion: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tipo: PropTypes.string,
    preset: PropTypes.string,
    config: PropTypes.shape({
      altura: PropTypes.shape({
        valor: PropTypes.number,
        unidad: PropTypes.oneOf(['vh', 'px', 'auto']),
      }),
      padding: PropTypes.shape({
        top: PropTypes.number,
        bottom: PropTypes.number,
      }),
      fondo: PropTypes.shape({
        tipo: PropTypes.oneOf(['color', 'imagen', 'gradiente', 'video']),
        valor: PropTypes.string,
        posicion: PropTypes.string,
        overlay: PropTypes.shape({
          color: PropTypes.string,
          opacidad: PropTypes.number,
        }),
      }),
    }),
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    color_secundario: PropTypes.string,
  }),
  isSelected: PropTypes.bool,
  isEditorMode: PropTypes.bool,
  onSelect: PropTypes.func,
  onClick: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default memo(CanvasSection);
