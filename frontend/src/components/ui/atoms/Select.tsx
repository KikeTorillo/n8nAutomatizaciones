import { forwardRef, memo, useId, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  getSelectStyles,
  SELECT_ARROW,
  SELECT_SIZE_CLASSES,
  getAriaDescribedBy,
} from '@/lib/uiConstants';
import type { UISize, SelectOption } from '@/types/ui';

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Array de opciones {value, label} */
  options?: SelectOption[];
  /** Texto de placeholder */
  placeholder?: string;
  /** Tamaño del select */
  size?: UISize;
  /** Si tiene error (borde rojo) */
  hasError?: boolean;
  /** Si es campo requerido */
  required?: boolean;
  /** Si tiene texto de ayuda asociado */
  hasHelper?: boolean;
  /** Opciones como children (alternativa a options) */
  children?: ReactNode;
  /** ID del elemento */
  id?: string;
  /** Clases CSS adicionales para el <select> */
  className?: string;
  /** Clases CSS para el wrapper <div> contenedor */
  wrapperClassName?: string;
}

/**
 * Select - Componente select puro accesible compatible con React Hook Form
 *
 * DEBE usarse con FormGroup para label/error/helper:
 * <FormGroup label="País" error={errors.pais?.message}>
 *   <Select hasError={!!errors.pais} options={paises} {...field} />
 * </FormGroup>
 *
 * @example
 * <Select
 *   options={[{ value: '1', label: 'Opción 1' }]}
 *   hasError={!!errors.campo}
 *   {...register('campo')}
 * />
 */
const Select = memo(
  forwardRef<HTMLSelectElement, SelectProps>(function Select(
    {
      options = [],
      placeholder = 'Selecciona una opción',
      size = 'md',
      hasError = false,
      required = false,
      hasHelper = false,
      children,
      className,
      wrapperClassName,
      id,
      ...props
    },
    ref
  ) {
    // Generar ID único con useId (estable en SSR/hydration)
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={cn("relative", wrapperClassName)}>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={hasError || undefined}
          aria-required={required || undefined}
          aria-describedby={
            selectId ? getAriaDescribedBy(selectId, { hasError, hasHelper }) : undefined
          }
          className={cn(getSelectStyles(hasError), (SELECT_SIZE_CLASSES as Record<string, string>)[size], className)}
          {...props}
        >
          {children ? (
            children
          ) : (
            <>
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>

        {/* Flecha personalizada */}
        <div className={SELECT_ARROW.container} aria-hidden="true">
          <svg className={SELECT_ARROW.icon} viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  })
);

Select.displayName = 'Select';

export { Select };
