/**
 * FormGroup - Molecule para agrupar campos de formulario
 * Fase 2 del Plan de Mejoras Frontend - Enero 2026
 *
 * Combina Label + children + helper/error text
 * Compatible con los atoms existentes (Input, Select, Textarea)
 */
import { cn } from '@/lib/utils';
import Label from '../atoms/Label';

/**
 * Componente FormGroup reutilizable
 * @param {string} label - Etiqueta del campo
 * @param {boolean} required - Si el campo es obligatorio
 * @param {string} error - Mensaje de error
 * @param {string} helper - Texto de ayuda
 * @param {string} htmlFor - ID del elemento asociado
 * @param {React.ReactNode} children - Contenido (Input, Select, etc.)
 * @param {string} className - Clases adicionales para el contenedor
 */
function FormGroup({
  label,
  required = false,
  error,
  helper,
  htmlFor,
  children,
  className,
}) {
  return (
    <div className={cn('w-full', className)}>
      <Label label={label} required={required} htmlFor={htmlFor} />
      {children}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helper}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export default FormGroup;
