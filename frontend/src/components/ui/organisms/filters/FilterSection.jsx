import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * FilterSection - Sección de filtros con título y contenido
 * Usado dentro de AdvancedFilterPanel para organizar filtros
 *
 * @param {string} title - Título de la sección
 * @param {React.ReactNode} children - Contenido de la sección
 * @param {React.ComponentType} icon - Icono del título (opcional)
 * @param {string} className - Clases adicionales
 */
export const FilterSection = memo(function FilterSection({ title, children, icon: Icon, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <h4
          className={cn(
            'flex items-center gap-2 text-xs font-semibold uppercase tracking-wider',
            'text-gray-500 dark:text-gray-400'
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </h4>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
});

FilterSection.displayName = 'FilterSection';

/**
 * FilterCheckbox - Checkbox individual para filtros
 */
export const FilterCheckbox = memo(function FilterCheckbox({
  id,
  label,
  checked,
  onChange,
  icon: Icon,
  disabled = false,
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className={cn(
          'h-4 w-4 rounded border-gray-300 dark:border-gray-600',
          'text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400',
          'dark:bg-gray-700'
        )}
      />
      {Icon && (
        <Icon
          className={cn(
            'h-4 w-4',
            checked
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-400 dark:text-gray-500'
          )}
        />
      )}
      <span
        className={cn(
          'text-sm',
          checked
            ? 'text-gray-900 dark:text-gray-100 font-medium'
            : 'text-gray-600 dark:text-gray-400'
        )}
      >
        {label}
      </span>
    </label>
  );
});

FilterCheckbox.displayName = 'FilterCheckbox';

/**
 * FilterSelect - Select para filtros con múltiples opciones
 */
export const FilterSelect = memo(function FilterSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  icon: Icon,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'flex items-center gap-2 text-sm font-medium',
            'text-gray-700 dark:text-gray-300'
          )}
        >
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          {label}
        </label>
      )}
      <select
        id={id}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg border',
          'bg-white dark:bg-gray-700',
          'border-gray-300 dark:border-gray-600',
          'text-gray-900 dark:text-gray-100',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'dark:focus:ring-primary-400 dark:focus:border-primary-400'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});

FilterSelect.displayName = 'FilterSelect';

export default FilterSection;
