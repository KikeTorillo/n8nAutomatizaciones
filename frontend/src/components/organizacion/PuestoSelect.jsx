import { forwardRef, useMemo } from 'react';
import { Select } from '@/components/ui';
import { usePuestos, usePuestosPorDepartamento } from '@/hooks/personas';
import { Briefcase } from 'lucide-react';

/**
 * Selector de Puesto
 * Opcionalmente filtrado por departamento
 *
 * @param {number} departamentoId - Si se proporciona, filtra puestos de ese departamento
 * @param {boolean} includeEmpty - Incluir opción vacía
 */
const PuestoSelect = forwardRef(
  (
    {
      className,
      error,
      label = 'Puesto',
      placeholder = 'Selecciona un puesto',
      required = false,
      departamentoId = null,
      includeEmpty = true,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Fetch puestos (todos o por departamento)
    const { data: todosPuestos = [], isLoading: loadingTodos } = usePuestos(
      { activo: true },
      { enabled: !departamentoId }
    );

    const { data: puestosDpto = [], isLoading: loadingDpto } = usePuestos(
      { activo: true, departamento_id: departamentoId },
      { enabled: !!departamentoId }
    );

    const puestos = departamentoId ? puestosDpto : todosPuestos;
    const isLoading = departamentoId ? loadingDpto : loadingTodos;

    // Construir opciones
    const options = useMemo(() => {
      return puestos.map(p => ({
        value: p.id,
        label: p.nombre,
        codigo: p.codigo,
      }));
    }, [puestos]);

    return (
      <div className="w-full">
        {label && (
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Briefcase className="w-4 h-4" />
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <Select
          ref={ref}
          className={className}
          error={error}
          label={null}
          placeholder={isLoading ? 'Cargando...' : placeholder}
          disabled={disabled || isLoading}
          {...props}
        >
          {includeEmpty && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
              {option.codigo && ` (${option.codigo})`}
            </option>
          ))}
        </Select>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

PuestoSelect.displayName = 'PuestoSelect';

export default PuestoSelect;
