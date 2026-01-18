import { Controller } from 'react-hook-form';
import { Input, Select, FormGroup } from '@/components/ui';

/**
 * Componente FormField integrado con React Hook Form
 * Wrapper para Input y Select con validación automática
 * Usa FormGroup para label/error/helper siguiendo Atomic Design
 */
function FormField({
  name,
  control,
  type = 'text',
  label,
  placeholder,
  required = false,
  options,
  helper,
  ...rest
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Si tiene options, renderizar Select
        if (options) {
          return (
            <FormGroup
              label={label}
              error={error?.message}
              helper={helper}
              required={required}
            >
              <Select
                {...field}
                placeholder={placeholder}
                options={options}
                hasError={!!error}
                {...rest}
              />
            </FormGroup>
          );
        }

        // Sino, renderizar Input
        // Para type="number", convertir el valor a número
        const fieldValue = type === 'number' && field.value ? Number(field.value) : field.value;

        return (
          <FormGroup
            label={label}
            error={error?.message}
            helper={helper}
            required={required}
          >
            <Input
              {...field}
              value={fieldValue}
              onChange={(e) => {
                // Convertir a número si es type="number"
                const value = type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value;
                field.onChange(value);
              }}
              type={type}
              placeholder={placeholder}
              hasError={!!error}
              {...rest}
            />
          </FormGroup>
        );
      }}
    />
  );
}

export default FormField;
