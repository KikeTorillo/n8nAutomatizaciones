import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { useActualizarProfesional } from '@/hooks/useProfesionales';
import { useToast } from '@/hooks/useToast';

/**
 * Drawer para edición rápida de campos del profesional
 * Soporta diferentes tipos de campos: text, email, tel, select, textarea, date, number
 */
function QuickEditDrawer({
  isOpen,
  onClose,
  profesionalId,
  title,
  subtitle,
  fields = [],
  initialValues = {},
}) {
  const toast = useToast();
  const actualizarMutation = useActualizarProfesional();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: initialValues,
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
