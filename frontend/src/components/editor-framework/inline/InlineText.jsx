/**
 * ====================================================================
 * INLINE TEXT
 * ====================================================================
 * Componente para edición inline de texto simple.
 * Usa contentEditable nativo para máxima performance.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente para edición inline de texto simple
 * Usa contentEditable nativo para máxima performance
 *
 * @param {Object} props
 * @param {string} props.value - Texto actual
 * @param {Function} props.onChange - Callback al cambiar
 * @param {string} props.placeholder - Placeholder cuando está vacío
 * @param {string} props.className - Clases adicionales
 * @param {boolean} props.multiline - Permitir múltiples líneas
 * @param {boolean} props.disabled - Deshabilitar edición
 * @param {string} props.as - Tag HTML a usar (span, h1, h2, p, etc.)
 */
export const InlineText = memo(function InlineText({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  className = '',
  multiline = false,
  disabled = false,
  as: Component = 'span',
}) {
  const elementRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  // Track el valor local para evitar conflictos durante edición
  const lastValueRef = useRef(value);

  // Sincronizar valor externo con el contenido del elemento
  // Solo cuando no está enfocado y el valor realmente cambió desde afuera
  useEffect(() => {
    if (elementRef.current && !isFocused) {
      // Solo actualizar si el valor cambió desde el exterior (no por nuestra propia edición)
      if (value !== lastValueRef.current) {
        elementRef.current.innerText = value || '';
        lastValueRef.current = value;
      }
    }
  }, [value, isFocused]);

  // Inicializar el contenido solo en el primer render
  useEffect(() => {
    if (elementRef.current && elementRef.current.innerText === '') {
      elementRef.current.innerText = value || '';
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Manejar blur - guardar cambios
   */
  const handleBlur = useCallback(
    (e) => {
      setIsFocused(false);
      const newValue = e.target.innerText;
      if (newValue !== lastValueRef.current) {
        lastValueRef.current = newValue;
        onChange(newValue);
      }
    },
    [onChange]
  );

  /**
   * Manejar focus
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  /**
   * Prevenir Enter en modo single-line
   */
  const handleKeyDown = useCallback(
    (e) => {
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
      // ESC para salir de edición
      if (e.key === 'Escape') {
        e.preventDefault();
        e.target.blur();
      }
    },
    [multiline]
  );

  /**
   * Prevenir pegar HTML formateado
   */
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <Component
      ref={elementRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      data-placeholder={placeholder}
      className={cn(
        'outline-none transition-colors cursor-text',
        'focus:bg-primary-50/50 dark:focus:bg-primary-900/20',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500',
        disabled && 'cursor-default pointer-events-none',
        className
      )}
    />
  );
});

export default InlineText;
