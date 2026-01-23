/**
 * Label - Atom para etiquetas de formulario
 * Fase 2 del Plan de Mejoras Frontend - Enero 2026
 */
import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente Label reutilizable
 * @param {string|React.ReactNode} label - Texto o nodo React para la etiqueta
 * @param {boolean} required - Si el campo es obligatorio
 * @param {string} htmlFor - ID del elemento asociado
 * @param {string} className - Clases adicionales
 */
const Label = memo(function Label({ label, required = false, htmlFor, className }) {
  if (!label) return null;

  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
        className
      )}
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
});

Label.displayName = 'Label';

export default Label;
