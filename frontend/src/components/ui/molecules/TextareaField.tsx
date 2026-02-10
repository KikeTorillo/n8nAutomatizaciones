import { forwardRef, memo } from 'react';
import { FormGroup } from './FormGroup';
import { Textarea, type TextareaProps } from '../atoms/Textarea';

export interface TextareaFieldProps extends Omit<TextareaProps, 'hasError' | 'hasHelper'> {
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
 * TextareaField - FormGroup + Textarea en un solo componente
 *
 * @example
 * <TextareaField
 *   label="Descripcion"
 *   rows={4}
 *   error={errors.descripcion?.message}
 *   {...register('descripcion')}
 * />
 */
const TextareaField = memo(
  forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
    { label, error, helper, required, groupClassName, ...textareaProps },
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
        <Textarea
          ref={ref}
          hasError={!!error}
          hasHelper={!!helper}
          required={required}
          {...textareaProps}
        />
      </FormGroup>
    );
  })
);

TextareaField.displayName = 'TextareaField';

export { TextareaField };
