/**
 * ====================================================================
 * CANVAS ELEMENT
 * ====================================================================
 * Componente wrapper para elementos del canvas con posicionamiento libre.
 * Combina ElementWrapper (drag/resize) con el renderer apropiado.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import ElementWrapper from '../elements/ElementWrapper';

// ========== LAZY LOADED RENDERERS ==========

const TextoElementRenderer = lazy(() => import('../elements/renderers/TextoElementRenderer'));
const ImagenElementRenderer = lazy(() => import('../elements/renderers/ImagenElementRenderer'));
const BotonElementRenderer = lazy(() => import('../elements/renderers/BotonElementRenderer'));
const FormaElementRenderer = lazy(() => import('../elements/renderers/FormaElementRenderer'));
const SeparadorElementRenderer = lazy(() => import('../elements/renderers/SeparadorElementRenderer'));

// ========== RENDERER MAP ==========

const RENDERER_MAP = {
  texto: TextoElementRenderer,
  imagen: ImagenElementRenderer,
  boton: BotonElementRenderer,
  forma: FormaElementRenderer,
  separador: SeparadorElementRenderer,
};

// ========== FALLBACK ==========

function ElementFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse rounded">
      <span className="text-gray-400 text-sm">Cargando...</span>
    </div>
  );
}

function UnknownElement({ tipo }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 border-2 border-dashed border-yellow-300 rounded">
      <span className="text-yellow-600 dark:text-yellow-400 text-sm">
        Elemento desconocido: {tipo}
      </span>
    </div>
  );
}

// ========== COMPONENT ==========

function CanvasElement({
  elemento,
  isSelected,
  isEditing,
  onSelect,
  onMove,
  onResize,
  onDoubleClick,
  onContentChange,
  breakpoint,
  containerWidth,
  containerHeight,
  zoom,
  tema,
  disabled = false,
  customRenderers = {},
  evento, // Datos del evento para renderers específicos
}) {
  const { tipo } = elemento;

  // Obtener el renderer apropiado (custom o built-in)
  const Renderer = useMemo(() => {
    // Primero verificar si hay un renderer personalizado registrado
    if (customRenderers[tipo]) {
      return customRenderers[tipo];
    }
    // Usar renderer built-in
    return RENDERER_MAP[tipo] || null;
  }, [tipo, customRenderers]);

  // Handler para cambios en el contenido (edición inline)
  const handleContentChange = useCallback((changes) => {
    onContentChange?.(elemento.id, changes);
  }, [elemento.id, onContentChange]);

  // Si no hay renderer, mostrar elemento desconocido
  if (!Renderer) {
    return (
      <ElementWrapper
        elemento={elemento}
        isSelected={isSelected}
        isEditing={false}
        onSelect={onSelect}
        onMove={onMove}
        onResize={onResize}
        breakpoint={breakpoint}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        zoom={zoom}
        disabled={disabled}
      >
        <UnknownElement tipo={tipo} />
      </ElementWrapper>
    );
  }

  return (
    <ElementWrapper
      elemento={elemento}
      isSelected={isSelected}
      isEditing={isEditing}
      onSelect={onSelect}
      onMove={onMove}
      onResize={onResize}
      onDoubleClick={onDoubleClick}
      breakpoint={breakpoint}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      zoom={zoom}
      disabled={disabled}
    >
      <Suspense fallback={<ElementFallback />}>
        <Renderer
          elemento={elemento}
          tema={tema}
          isEditing={isEditing}
          onTextChange={handleContentChange}
          evento={evento}
        />
      </Suspense>
    </ElementWrapper>
  );
}

CanvasElement.propTypes = {
  elemento: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    contenido: PropTypes.object,
    posicion: PropTypes.object,
    estilos: PropTypes.object,
    responsive: PropTypes.object,
    capa: PropTypes.number,
  }).isRequired,
  isSelected: PropTypes.bool,
  isEditing: PropTypes.bool,
  onSelect: PropTypes.func,
  onMove: PropTypes.func,
  onResize: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onContentChange: PropTypes.func,
  breakpoint: PropTypes.oneOf(['desktop', 'tablet', 'mobile']),
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  zoom: PropTypes.number,
  tema: PropTypes.object,
  disabled: PropTypes.bool,
  customRenderers: PropTypes.object,
  evento: PropTypes.object, // Datos del evento para renderers específicos
};

export default memo(CanvasElement);
