import { Controller } from 'react-hook-form';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

/**
 * Componente FormField integrado con React Hook Form
 * Wrapper para Input y Select con validación automática
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
            <Select
              {...field}
              label={label}
              placeholder={placeholder}
              options={options}
              error={error?.message}
              helper={helper}
              required={required}
              {...rest}
            />
          );
        }

        // Sino, renderizar Input
        // Para type="number", convertir el valor a número
        const fieldValue = type === 'number' && field.value ? Number(field.value) : field.value;

        return (
          <Input
            {...field}
            value={fieldValue}
            onChange={(e) => {
              // Convertir a número si es type="number"
              const value = type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value;
              field.onChange(value);
            }}
            type={type}
            label={label}
            placeholder={placeholder}
            error={error?.message}
            helper={helper}
            required={required}
            {...rest}
          />
        );
      }}
    />
  );
}

export default FormField;
