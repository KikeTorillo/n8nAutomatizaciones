import { memo, useId, forwardRef, type ChangeEvent, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { Checkbox } from '../atoms/Checkbox';
import {
  FILTER_INPUT_STYLES,
  FILTER_LABEL_STYLES,
  FILTER_CONTAINER_STYLES,
  FILTER_ICON_STYLES,
} from '@/lib/uiConstants';
import type { FilterFieldType } from '@/types/organisms';
import type { SelectOption } from '@/types/ui';

/**
 * Props del componente FilterField
 */
export interface FilterFieldProps {
  /** Tipo de campo */
  type?: FilterFieldType;
  /** Label del campo */
  label?: string;
  /** Valor actual */
  value?: string | boolean | number;
  /** Callback cuando cambia el valor */
  onChange?: (value: string | boolean) => void;
  /** Opciones para select */
  options?: SelectOption[];
  /** Placeholder del input */
  placeholder?: string;
  /** Icono (componente Lucide) */
  icon?: ComponentType<{ className?: string }>;
  /** Valor mínimo (date/number) */
  min?: string;
  /** Valor máximo (date/number) */
  max?: string;
  /** Incremento (number) */
  step?: number;
  /** ID del campo */
  id?: string;
  /** Clases adicionales */
  className?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
}

/**
 * FilterField - Campo de filtro unificado que combina FilterTextField, FilterSelectField y FilterDateField
 *
 * Componente versátil que renderiza diferentes tipos de campos según la prop `type`:
 * - text: Input de texto
 * - select: Dropdown con opciones
 * - date: Date picker
 * - number: Input numérico
 * - checkbox: Checkbox simple
 */
const FilterField = memo(
  forwardRef<HTMLInputElement | HTMLSelectElement, FilterFieldProps>(function FilterField(
    {
      type = 'text',
      label,
      value,
      onChange,
      options = [],
      placeholder,
      icon: Icon,
      min,
      max,
      step,
      id,
      className,
      disabled = false,
    },
    ref
  ) {
    const generatedId = useId();
    const fieldId = id || generatedId;

    // Renderizar checkbox (caso especial)
    if (type === 'checkbox') {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <Checkbox
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            checked={!!value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked)}
            disabled={disabled}
          />
          {label && (
            <label
              htmlFor={fieldId}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {Icon && <Icon className={cn(FILTER_ICON_STYLES, 'inline mr-1.5')} />}
              {label}
            </label>
          )}
        </div>
      );
    }

    // Handler genérico para onChange
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className={cn(FILTER_CONTAINER_STYLES, className)}>
        {label && (
          <label htmlFor={fieldId} className={FILTER_LABEL_STYLES}>
            {Icon && <Icon className={FILTER_ICON_STYLES} />}
            {label}
          </label>
        )}

        {type === 'select' ? (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            id={fieldId}
            value={(value as string) || ''}
            onChange={handleChange}
            disabled={disabled}
            className={FILTER_INPUT_STYLES}
          >
            <option value="">{placeholder || 'Seleccionar...'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            type={type}
            value={(value as string | number) ?? ''}
            onChange={handleChange}
            disabled={disabled}
            className={FILTER_INPUT_STYLES}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
          />
        )}
      </div>
    );
  })
);

FilterField.displayName = 'FilterField';

export { FilterField };
