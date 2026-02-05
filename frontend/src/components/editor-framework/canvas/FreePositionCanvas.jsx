/**
 * ====================================================================
 * FREE POSITION CANVAS
 * ====================================================================
 * Canvas principal para edición de secciones con elementos posicionados
 * libremente (estilo Wix/Squarespace).
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import CanvasSection from './CanvasSection';
import CanvasElement from './CanvasElement';
import SnapGuides, { calculateSnapGuides } from './SnapGuides';

// ========== CONSTANTS ==========

const CANVAS_MIN_HEIGHT = 400;

// ========== COMPONENT ==========

function FreePositionCanvas({
  secciones = [],
  selectedSectionId,
  selectedElementId,
  editingElementId,
  onSelectSection,
  onSelectElement,
  onDeselectAll,
  onMoveElement,
  onResizeElement,
  onElementDoubleClick,
  onContentChange,
  breakpoint = 'desktop',
  zoom = 100,
  tema,
  isPreviewMode = false,
  customRenderers = {},
  className,
  evento, // Datos del evento para renderers (countdown, calendario, etc.)
}) {
  const canvasRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [activeGuides, setActiveGuides] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Observar cambios de tamaño del canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({
          width: Math.max(width, 100),
          height: Math.max(height, CANVAS_MIN_HEIGHT),
        });
      }
    });

    resizeObserver.observe(canvasRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Escala aplicada al canvas
  const canvasScale = zoom / 100;

  // Handler para click en el canvas (deseleccionar todo)
  const handleCanvasClick = useCallback((e) => {
    // Solo si el click es directamente en el canvas, no en un elemento
    if (e.target === e.currentTarget) {
      onDeselectAll?.();
    }
  }, [onDeselectAll]);

  // Handler para mover elemento con snap
  const handleMoveElement = useCallback((elementId, sectionId, newPosition) => {
    // Encontrar la sección y obtener otros elementos para snap
    const section = secciones.find(s => s.id === sectionId);
    const otherElements = section?.elementos?.filter(e => e.id !== elementId) || [];

    // Calcular guías de snap
    const { guides, snappedPosition } = calculateSnapGuides(
      { x: newPosition.x, y: newPosition.y },
      otherElements,
      { snapThreshold: 3, snapToCenter: true, snapToEdges: true, snapToOtherElements: true }
    );

    // Actualizar guías activas
    setActiveGuides(guides);
    setIsDragging(true);

    // Llamar al handler con la posición ajustada
    onMoveElement?.(elementId, sectionId, snappedPosition);
  }, [secciones, onMoveElement]);

  // Handler para terminar drag
  const handleDragEnd = useCallback(() => {
    setActiveGuides([]);
    setIsDragging(false);
  }, []);

  // Handler para resize
  const handleResizeElement = useCallback((elementId, sectionId, newSize) => {
    onResizeElement?.(elementId, sectionId, newSize);
  }, [onResizeElement]);

  // Renderizar elementos de una sección
  const renderSectionElements = useCallback((seccion) => {
    const elementos = seccion.elementos || [];

    return elementos.map((elemento) => {
      if (!elemento.visible && !isPreviewMode) {
        // En modo editor, mostrar elementos ocultos con opacidad
        // En modo preview, no mostrarlos
      }

      return (
        <CanvasElement
          key={elemento.id}
          elemento={elemento}
          isSelected={elemento.id === selectedElementId}
          isEditing={elemento.id === editingElementId}
          onSelect={() => onSelectElement?.(elemento.id, seccion.id)}
          onMove={(pos) => handleMoveElement(elemento.id, seccion.id, pos)}
          onResize={(size) => handleResizeElement(elemento.id, seccion.id, size)}
          onDoubleClick={() => onElementDoubleClick?.(elemento.id)}
          onContentChange={onContentChange}
          breakpoint={breakpoint}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          zoom={zoom}
          tema={tema}
          disabled={isPreviewMode}
          customRenderers={customRenderers}
          evento={evento}
        />
      );
    });
  }, [
    selectedElementId,
    editingElementId,
    onSelectElement,
    handleMoveElement,
    handleResizeElement,
    onElementDoubleClick,
    onContentChange,
    breakpoint,
    containerSize,
    zoom,
    tema,
    isPreviewMode,
    customRenderers,
    evento,
  ]);

  return (
    <div
      ref={canvasRef}
      className={cn(
        'free-position-canvas relative w-full h-full overflow-auto',
        'bg-gray-100 dark:bg-gray-900',
        className
      )}
      onClick={handleCanvasClick}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Contenedor escalado */}
      <div
        className="canvas-scaler origin-top-left"
        style={{
          transform: `scale(${canvasScale})`,
          width: `${100 / canvasScale}%`,
          minHeight: `${100 / canvasScale}%`,
        }}
      >
        {/* Secciones */}
        {secciones.map((seccion) => (
          <CanvasSection
            key={seccion.id}
            seccion={seccion}
            tema={tema}
            isSelected={seccion.id === selectedSectionId}
            isEditorMode={!isPreviewMode}
            onSelect={() => onSelectSection?.(seccion.id)}
          >
            {/* Elementos de la sección */}
            {renderSectionElements(seccion)}

            {/* Guías de snap (solo para la sección activa) */}
            {seccion.id === selectedSectionId && isDragging && (
              <SnapGuides
                guides={activeGuides}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                visible={isDragging}
              />
            )}
          </CanvasSection>
        ))}

        {/* Mensaje cuando no hay secciones */}
        {secciones.length === 0 && (
          <div className="flex items-center justify-center min-h-[400px] text-gray-400 dark:text-gray-500">
            <div className="text-center p-8">
              <p className="text-lg font-medium">No hay secciones</p>
              <p className="text-sm mt-2">Agrega una sección para comenzar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

FreePositionCanvas.propTypes = {
  secciones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      tipo: PropTypes.string,
      config: PropTypes.object,
      elementos: PropTypes.array,
    })
  ),
  selectedSectionId: PropTypes.string,
  selectedElementId: PropTypes.string,
  editingElementId: PropTypes.string,
  onSelectSection: PropTypes.func,
  onSelectElement: PropTypes.func,
  onDeselectAll: PropTypes.func,
  onMoveElement: PropTypes.func,
  onResizeElement: PropTypes.func,
  onElementDoubleClick: PropTypes.func,
  onContentChange: PropTypes.func,
  breakpoint: PropTypes.oneOf(['desktop', 'tablet', 'mobile']),
  zoom: PropTypes.number,
  tema: PropTypes.object,
  isPreviewMode: PropTypes.bool,
  customRenderers: PropTypes.object,
  className: PropTypes.string,
  evento: PropTypes.object, // Datos del evento para renderers específicos
};

export default memo(FreePositionCanvas);
