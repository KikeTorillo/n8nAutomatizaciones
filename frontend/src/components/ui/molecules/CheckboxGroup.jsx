import { cn } from '@/lib/utils';
import CheckboxField from './CheckboxField';

/**
 * CheckboxGroup - Grupo de checkboxes con título opcional
 * Reutilizable en filtros, formularios y configuraciones
 *
 * @param {Object} props
 * @param {Array} props.options - Configuración de opciones
 * @param {string} props.options[].field - Nombre del campo (requerido)
 * @param {string} props.options[].label - Etiqueta visible (requerido)
 * @param {string} [props.options[].description] - Descripción secundaria
 * @param {React.ComponentType} [props.options[].icon] - Icono (lucide-react)
 * @param {boolean} [props.options[].disabled] - Deshabilitado
 * @param {Object} props.values - Estado actual { [fieldName]: boolean }
 * @param {Function} props.onChange - Callback (fieldName, checked) => void
 * @param {string} [props.title] - Título del grupo
 * @param {string} [props.layout] - 'vertical' | 'horizontal' | 'grid'
 * @param {number} [props.columns] - Columnas para layout grid (default: 2)
 * @param {string} [props.className] - Clases adicionales
 */
export function CheckboxGroup({
  options = [],
  values = {},
  onChange,
  title,
  layout = 'vertical',
  columns = 2,
  className,
}) {
  if (!options.length) return null;

  const layoutClasses = {
    vertical: 'flex flex-col space-y-2',
    horizontal: 'flex flex-wrap gap-4',
    grid: `grid gap-2`,
  };

  const gridStyle = layout === 'grid'
    ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </label>
      )}

      <div
        className={layoutClasses[layout]}
        style={gridStyle}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const fieldKey = option.field || option.value;

          return (
            <div
              key={fieldKey}
              className={cn(
                'flex items-start gap-2',
                option.disabled && 'opacity-50'
              )}
            >
              {Icon && (
                <Icon
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              <CheckboxField
                id={fieldKey}
                label={option.label}
                description={option.description}
                checked={!!values[fieldKey]}
                onChange={(e) => onChange?.(fieldKey, e.target.checked)}
                disabled={option.disabled}
                className="flex-1"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

CheckboxGroup.displayName = 'CheckboxGroup';

export default CheckboxGroup;
