import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Drawer,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { useActualizarProfesional } from '@/hooks/personas';
import { useToast } from '@/hooks/utils';

/**
 * Schemas de validación Zod por tipo de campo
 */
const fieldSchemas = {
  text: (field) => {
    let schema = z.string();
    if (field.required) {
      schema = schema.min(1, `${field.label} es requerido`);
    }
    if (field.maxLength) {
      schema = schema.max(field.maxLength, `Máximo ${field.maxLength} caracteres`);
    }
    if (field.minLength) {
      schema = schema.min(field.minLength, `Mínimo ${field.minLength} caracteres`);
    }
    return field.required ? schema : schema.optional();
  },
  email: (field) => {
    let schema = z.string().email('Email inválido');
    return field.required ? schema : schema.optional().or(z.literal(''));
  },
  tel: (field) => {
    let schema = z.string().regex(/^[\d\s\-+()]{7,20}$/, 'Teléfono inválido');
    return field.required ? schema : schema.optional().or(z.literal(''));
  },
  number: (field) => {
    let schema = z.coerce.number();
    if (field.min !== undefined) {
      schema = schema.min(field.min, `Mínimo ${field.min}`);
    }
    if (field.max !== undefined) {
      schema = schema.max(field.max, `Máximo ${field.max}`);
    }
    return field.required ? schema : schema.optional();
  },
  date: (field) => {
    let schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida');
    return field.required ? schema : schema.optional().or(z.literal(''));
  },
  select: (field) => {
    let schema = z.string();
    if (field.required) {
      schema = schema.min(1, `${field.label} es requerido`);
    }
    return field.required ? schema : schema.optional();
  },
  textarea: (field) => {
    let schema = z.string();
    if (field.maxLength) {
      schema = schema.max(field.maxLength, `Máximo ${field.maxLength} caracteres`);
    }
    return field.required ? schema.min(1, `${field.label} es requerido`) : schema.optional();
  },
};

/**
 * Construye un schema Zod dinámico basado en la configuración de fields
 */
function buildDynamicSchema(fields) {
  const schemaShape = {};

  fields.forEach((field) => {
    const type = field.type || 'text';
    const schemaBuilder = fieldSchemas[type] || fieldSchemas.text;
    schemaShape[field.name] = schemaBuilder(field);
  });

  return z.object(schemaShape);
}

/**
 * Drawer para edición rápida de campos del profesional
 * Soporta diferentes tipos de campos: text, email, tel, select, textarea, date, number
 *
 * Ahora con validación Zod integrada automáticamente basada en la configuración de fields
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el drawer está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {number} props.profesionalId - ID del profesional a editar
 * @param {string} props.title - Título del drawer
 * @param {string} [props.subtitle] - Subtítulo opcional
 * @param {Array} props.fields - Configuración de campos
 * @param {string} props.fields[].name - Nombre del campo
 * @param {string} props.fields[].label - Label del campo
 * @param {string} [props.fields[].type] - Tipo: text, email, tel, select, textarea, date, number
 * @param {boolean} [props.fields[].required] - Si es requerido
 * @param {number} [props.fields[].maxLength] - Longitud máxima (text, textarea)
 * @param {number} [props.fields[].minLength] - Longitud mínima (text)
 * @param {number} [props.fields[].min] - Valor mínimo (number)
 * @param {number} [props.fields[].max] - Valor máximo (number)
 * @param {Array} [props.fields[].options] - Opciones para select [{value, label}]
 * @param {Object} props.initialValues - Valores iniciales
 * @param {Object} [props.schema] - Schema Zod personalizado (opcional, se genera automáticamente)
 */
function QuickEditDrawer({
  isOpen,
  onClose,
  profesionalId,
  title,
  subtitle,
  fields = [],
  initialValues = {},
  schema: customSchema,
}) {
  const toast = useToast();
  const actualizarMutation = useActualizarProfesional();

  // Construir schema Zod dinámicamente basado en fields
  const dynamicSchema = useMemo(() => {
    return customSchema || buildDynamicSchema(fields);
  }, [customSchema, fields]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: initialValues,
    mode: 'onSubmit',
  });

  // Reset form cuando cambian los valores iniciales
  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
    }
  }, [isOpen, initialValues, reset]);

  // Submit
  const onSubmit = async (data) => {
    try {
      // Sanitizar valores vacíos y convertir IDs a números
      const sanitized = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
          sanitized[key] = undefined;
        } else if (key.endsWith('_id') && typeof value === 'string') {
          // Convertir IDs de string a número
          const numValue = parseInt(value, 10);
          sanitized[key] = isNaN(numValue) ? undefined : numValue;
        } else if (typeof value === 'string') {
          sanitized[key] = value.trim() || undefined;
        } else {
          sanitized[key] = value;
        }
      });

      await actualizarMutation.mutateAsync({
        id: profesionalId,
        data: sanitized,
      });

      toast.success('Cambios guardados correctamente');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al guardar los cambios');
    }
  };

  // Renderizar campo según tipo
  const renderField = (field) => {
    const { name, label, type = 'text', options = [], placeholder, required, ...rest } = field;

    return (
      <Controller
        key={name}
        name={name}
        control={control}
        rules={required ? { required: `${label} es requerido` } : {}}
        render={({ field: controllerField }) => {
          const fieldError = errors[name];

          switch (type) {
            case 'select':
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <Select
                    {...controllerField}
                    value={controllerField.value || ''}
                    className={fieldError ? 'border-red-500' : ''}
                  >
                    <option value="">Seleccionar...</option>
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  {fieldError && (
                    <p className="mt-1 text-sm text-red-500">{fieldError.message}</p>
                  )}
                </div>
              );

            case 'textarea':
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <Textarea
                    {...controllerField}
                    placeholder={placeholder}
                    rows={3}
                    className={fieldError ? 'border-red-500' : ''}
                    {...rest}
                  />
                  {fieldError && (
                    <p className="mt-1 text-sm text-red-500">{fieldError.message}</p>
                  )}
                </div>
              );

            case 'number':
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <Input
                    {...controllerField}
                    type="number"
                    placeholder={placeholder}
                    className={fieldError ? 'border-red-500' : ''}
                    onChange={(e) => controllerField.onChange(e.target.value ? Number(e.target.value) : '')}
                    {...rest}
                  />
                  {fieldError && (
                    <p className="mt-1 text-sm text-red-500">{fieldError.message}</p>
                  )}
                </div>
              );

            default:
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <Input
                    {...controllerField}
                    type={type}
                    placeholder={placeholder}
                    className={fieldError ? 'border-red-500' : ''}
                    {...rest}
                  />
                  {fieldError && (
                    <p className="mt-1 text-sm text-red-500">{fieldError.message}</p>
                  )}
                </div>
              );
          }
        }}
      />
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map(renderField)}

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={actualizarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={actualizarMutation.isPending}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default QuickEditDrawer;
