import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { FormGroup, Select } from '@/components/ui';
import { useUbicacionSelector } from '@/hooks/otros';

/**
 * Componente SelectorUbicacion - Selección cascada Estado → Ciudad
 *
 * Integrado con React Hook Form para formularios de onboarding,
 * marketplace y cualquier otro que requiera ubicación geográfica.
 *
 * @param {Object} props
 * @param {Object} props.control - Control de React Hook Form
 * @param {Function} props.setValue - SetValue de React Hook Form
 * @param {Function} props.watch - Watch de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {boolean} props.required - Si los campos son requeridos
 * @param {boolean} props.disabled - Si los campos están deshabilitados
 * @param {string} props.estadoFieldName - Nombre del campo estado (default: 'estado_id')
 * @param {string} props.ciudadFieldName - Nombre del campo ciudad (default: 'ciudad_id')
 * @param {string} props.className - Clases adicionales para el contenedor
 * @param {boolean} props.horizontal - Layout horizontal (2 columnas)
 */
function SelectorUbicacion({
  control,
  setValue,
  watch,
  errors = {},
  required = false,
  disabled = false,
  estadoFieldName = 'estado_id',
  ciudadFieldName = 'ciudad_id',
  className = '',
  horizontal = true,
}) {
  // Observar valores actuales
  const estadoId = watch(estadoFieldName);
  const ciudadId = watch(ciudadFieldName);

  // Hook de ubicaciones con datos en cascada
  const {
    estados,
    ciudades,
    loadingEstados,
    loadingCiudades,
    errorEstados,
    errorCiudades,
  } = useUbicacionSelector({
    estadoId: estadoId ? parseInt(estadoId) : null,
    ciudadId: ciudadId ? parseInt(ciudadId) : null,
  });

  // Limpiar ciudad cuando cambia el estado
  useEffect(() => {
    if (estadoId && ciudadId) {
      // Verificar si la ciudad actual pertenece al nuevo estado
      const ciudadValida = ciudades.some(c => c.id === parseInt(ciudadId));
      if (!ciudadValida && ciudades.length > 0) {
        setValue(ciudadFieldName, '');
      }
    }
  }, [estadoId, ciudades, ciudadId, setValue, ciudadFieldName]);

  // Convertir datos a formato de opciones para Select
  const estadosOptions = estados.map(e => ({
    value: e.id.toString(),
    label: e.nombre_corto || e.nombre,
  }));

  const ciudadesOptions = ciudades.map(c => ({
    value: c.id.toString(),
    label: c.nombre,
  }));

  const containerClass = horizontal
    ? `grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`
    : `space-y-4 ${className}`;

  return (
    <div className={containerClass}>
      {/* Selector de Estado */}
      <FormGroup
        label="Estado"
        required={required}
        error={errors[estadoFieldName]?.message || (errorEstados ? 'Error cargando estados' : null)}
      >
        <Controller
          name={estadoFieldName}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder={loadingEstados ? 'Cargando estados...' : 'Selecciona un estado'}
              options={estadosOptions}
              hasError={!!errors[estadoFieldName] || !!errorEstados}
              disabled={disabled || loadingEstados}
              onChange={(e) => {
                field.onChange(e);
                // Limpiar ciudad al cambiar estado
                setValue(ciudadFieldName, '');
              }}
            />
          )}
        />
      </FormGroup>

      {/* Selector de Ciudad */}
      <FormGroup
        label="Ciudad"
        required={required}
        error={errors[ciudadFieldName]?.message || (errorCiudades ? 'Error cargando ciudades' : null)}
      >
        <Controller
          name={ciudadFieldName}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder={
                !estadoId
                  ? 'Primero selecciona un estado'
                  : loadingCiudades
                    ? 'Cargando ciudades...'
                    : 'Selecciona una ciudad'
              }
              options={ciudadesOptions}
              hasError={!!errors[ciudadFieldName] || !!errorCiudades}
              disabled={disabled || !estadoId || loadingCiudades}
            />
          )}
        />
      </FormGroup>
    </div>
  );
}

/**
 * Versión simplificada sin React Hook Form
 * Para uso directo con useState
 */
export function SelectorUbicacionSimple({
  estadoId,
  ciudadId,
  onEstadoChange,
  onCiudadChange,
  required = false,
  disabled = false,
  horizontal = true,
  className = '',
  errors = {},
}) {
  const {
    estados,
    ciudades,
    loadingEstados,
    loadingCiudades,
  } = useUbicacionSelector({
    estadoId: estadoId ? parseInt(estadoId) : null,
    ciudadId: ciudadId ? parseInt(ciudadId) : null,
  });

  const estadosOptions = estados.map(e => ({
    value: e.id.toString(),
    label: e.nombre_corto || e.nombre,
  }));

  const ciudadesOptions = ciudades.map(c => ({
    value: c.id.toString(),
    label: c.nombre,
  }));

  const containerClass = horizontal
    ? `grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`
    : `space-y-4 ${className}`;

  const handleEstadoChange = (e) => {
    const newEstadoId = e.target.value;
    onEstadoChange(newEstadoId);
    // Limpiar ciudad al cambiar estado
    if (onCiudadChange) {
      onCiudadChange('');
    }
  };

  return (
    <div className={containerClass}>
      <FormGroup
        label="Estado"
        required={required}
        error={errors.estado_id}
      >
        <Select
          value={estadoId || ''}
          onChange={handleEstadoChange}
          placeholder={loadingEstados ? 'Cargando estados...' : 'Selecciona un estado'}
          options={estadosOptions}
          hasError={!!errors.estado_id}
          disabled={disabled || loadingEstados}
        />
      </FormGroup>

      <FormGroup
        label="Ciudad"
        required={required}
        error={errors.ciudad_id}
      >
        <Select
          value={ciudadId || ''}
          onChange={(e) => onCiudadChange(e.target.value)}
          placeholder={
            !estadoId
              ? 'Primero selecciona un estado'
              : loadingCiudades
                ? 'Cargando ciudades...'
                : 'Selecciona una ciudad'
          }
          options={ciudadesOptions}
          hasError={!!errors.ciudad_id}
          disabled={disabled || !estadoId || loadingCiudades}
        />
      </FormGroup>
    </div>
  );
}

export default SelectorUbicacion;
