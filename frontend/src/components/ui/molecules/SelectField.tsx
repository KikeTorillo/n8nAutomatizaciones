import { forwardRef, memo } from 'react';
import { FormGroup } from './FormGroup';
import { Select, type SelectProps } from '../atoms/Select';

export interface SelectFieldProps extends Omit<SelectProps, 'hasError' | 'hasHelper'> {
  /** Etiqueta del campo */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Texto de ayuda */
  helper?: string;
  /** Si el campo es obligatorio */
  required?: boolean;
  /** Clases CSS para el contenedor FormGroup */
  groupClassName?: string;
}

/**
 * SelectField - FormGroup + Select en un solo componente
 *
 * @example
 * <SelectField
 *   label="Pais"
 *   options={paises}
 *   error={errors.pais?.message}
 *   {...register('pais')}
 * />
 */
const SelectField = memo(
  forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
    { label, error, helper, required, groupClassName, ...selectProps },
    ref
  ) {
    return (
      <FormGroup
        label={label}
        error={error}
        helper={helper}
        required={required}
        className={groupClassName}
      >
        <Select
          ref={ref}
          hasError={!!error}
          hasHelper={!!helper}
          required={required}
          {...selectProps}
        />
      </FormGroup>
    );
  })
);

SelectField.displayName = 'SelectField';

export { SelectField };
