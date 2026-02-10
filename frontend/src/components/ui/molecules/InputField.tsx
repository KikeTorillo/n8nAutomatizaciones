import { forwardRef, memo } from 'react';
import { FormGroup } from './FormGroup';
import { Input, type InputProps } from '../atoms/Input';

export interface InputFieldProps extends Omit<InputProps, 'hasError' | 'hasHelper'> {
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
 * InputField - FormGroup + Input en un solo componente
 *
 * @example
 * <InputField
 *   label="Email"
 *   error={errors.email?.message}
 *   {...register('email')}
 * />
 */
const InputField = memo(
  forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
    { label, error, helper, required, groupClassName, ...inputProps },
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
        <Input
          ref={ref}
          hasError={!!error}
          hasHelper={!!helper}
          required={required}
          {...inputProps}
        />
      </FormGroup>
    );
  })
);

InputField.displayName = 'InputField';

export { InputField };
