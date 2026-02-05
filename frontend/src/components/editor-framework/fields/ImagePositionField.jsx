/**
 * ====================================================================
 * IMAGE POSITION FIELD
 * ====================================================================
 * Campo para seleccionar el punto focal de una imagen mediante drag.
 * Permite arrastrar un marcador sobre un preview de la imagen.
 * La posición se guarda en porcentajes (X%, Y%) para CSS.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useRef, useState, useCallback, useEffect } from 'react';
import { Move, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Parsea una posición CSS a objeto { x, y }
 * @param {string} value - Valor CSS (ej: "50% 30%", "center center")
 * @returns {{ x: number, y: number }}
 */
function parsePosition(value) {
  if (!value) return { x: 50, y: 50 };

  // Parsear formato "50% 30%"
  const match = value.match(/(\d+)%\s*(\d+)%/);
  if (match) return { x: parseInt(match[1]), y: parseInt(match[2]) };

  // Fallback para valores tipo "center center", "left top", etc.
  const keywords = {
    left: 0,
    center: 50,
    right: 100,
    top: 0,
    bottom: 100,
  };

  const parts = value.split(' ');
  return {
    x: keywords[parts[0]] ?? 50,
    y: keywords[parts[1]] ?? 50,
  };
}

/**
 * Formatea objeto { x, y } a string CSS
 * @param {{ x: number, y: number }} pos
 * @returns {string}
 */
function formatPosition({ x, y }) {
  return `${Math.round(x)}% ${Math.round(y)}%`;
}

/**
 * ImagePositionField - Campo para seleccionar punto focal de imagen
 *
 * @param {Object} props
 * @param {Object} [props.field] - Config del campo (para FieldRenderer)
 * @param {string} [props.label] - Etiqueta del campo
 * @param {string} [props.value='50% 50%'] - Posición actual
 * @param {Function} props.onChange - Callback al cambiar
 * @param {string} props.imageUrl - URL de la imagen para preview
 */
function ImagePositionField({
  field,
  label: labelProp,
  value = '50% 50%',
  onChange,
  imageUrl,
}) {
  const label = field?.label ?? labelProp ?? 'Punto focal de la imagen';
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => parsePosition(value));

  // Sincronizar con value externo
  useEffect(() => {
    setPosition(parsePosition(value));
  }, [value]);

  // Calcular nueva posición desde evento
  const updatePosition = useCallback((clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    setPosition({ x, y });
  }, []);

  // Guardar al soltar
  const commitPosition = useCallback(() => {
    onChange?.(formatPosition(position));
  }, [position, onChange]);

  // Handlers de mouse
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      updatePosition(e.clientX, e.clientY);
    },
    [isDragging, updatePosition]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      commitPosition();
    }
  }, [isDragging, commitPosition]);

  // Handlers de touch
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    updatePosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    },
    [isDragging, updatePosition]
  );

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      commitPosition();
    }
  }, [isDragging, commitPosition]);

  // Event listeners globales para drag fuera del área
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Reset al centro
  const handleReset = () => {
    setPosition({ x: 50, y: 50 });
    onChange?.('50% 50%');
  };

  // Si no hay imagen, no mostrar el campo
  if (!imageUrl) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {/* Preview con marcador */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full aspect-video rounded-lg overflow-hidden cursor-crosshair',
          'bg-gray-200 dark:bg-gray-700 border-2',
          isDragging ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'
        )}
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: formatPosition(position),
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Overlay para mejor visibilidad del marcador */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Marcador arrastrable */}
        <div
          className={cn(
            'absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2',
            'rounded-full border-2 border-white shadow-lg',
            'flex items-center justify-center',
            'pointer-events-none transition-transform',
            isDragging ? 'bg-primary-500 scale-110' : 'bg-primary-600'
          )}
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
        >
          <Move className="w-3 h-3 text-white" />
        </div>

        {/* Guías visuales (crosshair) mientras arrastra */}
        {isDragging && (
          <>
            <div
              className="absolute w-px h-full bg-white/50 pointer-events-none"
              style={{ left: `${position.x}%` }}
            />
            <div
              className="absolute w-full h-px bg-white/50 pointer-events-none"
              style={{ top: `${position.y}%` }}
            />
          </>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Arrastra el marcador al punto de interés
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          <RotateCcw className="w-3 h-3" />
          Centrar
        </button>
      </div>
    </div>
  );
}

export default memo(ImagePositionField);
