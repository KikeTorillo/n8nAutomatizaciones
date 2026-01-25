import { forwardRef, useMemo } from 'react';
import { Select } from '@/components/ui';
import { useProfesionales } from '@/hooks/personas';
import { UserCheck } from 'lucide-react';

/**
 * Selector de Supervisor
 * Muestra profesionales que pueden ser supervisores.
 * La capacidad de supervisar se determina por el ROL del usuario vinculado:
 * - admin y propietario pueden supervisar
 * - empleado NO puede supervisar
 *
 * @param {number} excludeId - ID de profesional a excluir (evita seleccionarse a sí mismo)
 * @param {number} departamentoId - Filtrar por departamento (opcional)
 * @param {boolean} soloActivos - Solo mostrar profesionales activos (default: true)
 */
const SupervisorSelect = forwardRef(
  (
    {
      className,
      error,
      label = 'Supervisor',
      placeholder = 'Selecciona un supervisor',
      helper = 'Profesional que supervisará a este empleado',
      required = false,
      excludeId = null,
      departamentoId = null,
      soloActivos = true,
      includeEmpty = true,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Params para filtrar profesionales
    const params = useMemo(() => {
      const p = {};
      if (soloActivos) p.estado = 'activo';
      if (departamentoId) p.departamento_id = departamentoId;
      // Solo profesionales con usuario vinculado y rol que permite supervisar
      p.con_usuario = true;
      p.rol_usuario = ['admin'];
      return p;
    }, [soloActivos, departamentoId]);

    // Fetch profesionales
    const { data: profesionalesData, isLoading } = useProfesionales(params);
    const profesionales = profesionalesData?.profesionales || [];

    // Construir opciones (excluyendo el profesional actual si aplica)
    const options = useMemo(() => {
      let filtered = profesionales;

      // Excluir al profesional que estamos editando
      if (excludeId) {
        filtered = filtered.filter(p => p.id !== excludeId);
      }

      return filtered.map(p => ({
        value: p.id,
        label: p.nombre_completo,
        puesto: p.puesto?.nombre,
        departamento: p.departamento?.nombre,
      }));
    }, [profesionales, excludeId]);

    return (
      <div className="w-full">
        {label && (
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <UserCheck className="w-4 h-4" />
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
              {option.puesto && ` - ${option.puesto}`}
            </option>
          ))}
        </Select>

        {helper && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helper}</p>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

SupervisorSelect.displayName = 'SupervisorSelect';

export default SupervisorSelect;
