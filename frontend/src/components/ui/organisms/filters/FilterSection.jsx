import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  FILTER_SECTION_TITLE,
  FILTER_CHECKBOX_STYLES,
  FILTER_SELECT_STYLES,
} from '@/lib/uiConstants';

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
        <h4 className={FILTER_SECTION_TITLE}>
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
        FILTER_CHECKBOX_STYLES.container,
        disabled && FILTER_CHECKBOX_STYLES.containerDisabled
      )}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className={FILTER_CHECKBOX_STYLES.input}
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
            ? FILTER_CHECKBOX_STYLES.labelActive
            : FILTER_CHECKBOX_STYLES.labelInactive
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
        <label htmlFor={id} className={FILTER_SELECT_STYLES.label}>
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          {label}
        </label>
      )}
      <select
        id={id}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className={FILTER_SELECT_STYLES.select}
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
