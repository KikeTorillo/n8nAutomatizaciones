import { useState } from 'react';
import { X, Filter, Building2 } from 'lucide-react';
import { Button, Select, SearchInput, FormGroup } from '@/components/ui';
import useSucursalStore, { selectSucursalesDisponibles } from '@/store/sucursalStore';

/**
 * Componente de filtros para el módulo de citas
 * Refactorizado para usar componentes reutilizables (SearchInput, FormGroup, Select)
 */
function CitaFilters({
  filtros,
  onFiltrosChange,
  profesionales = [],
  servicios = [],
  onLimpiarFiltros,
}) {
  // Multi-sucursal: Obtener sucursales disponibles
  const sucursalesDisponibles = useSucursalStore(selectSucursalesDisponibles);
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  // Estados disponibles
  const estadosDisponibles = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'en_curso', label: 'En curso' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'no_show', label: 'No Show' },
  ];

  // Opciones de profesionales
  const profesionalesOpciones = [
    { value: '', label: 'Todos los profesionales' },
    ...profesionales.map((prof) => ({
      value: prof.id.toString(),
      label: `${prof.nombre} ${prof.apellidos || ''}`.trim(),
    })),
  ];

  // Opciones de servicios
  const serviciosOpciones = [
    { value: '', label: 'Todos los servicios' },
    ...servicios.map((serv) => ({
      value: serv.id.toString(),
      label: serv.nombre,
    })),
  ];

  // Multi-sucursal: Opciones de sucursales
  const tieneMultiplesSucursales = sucursalesDisponibles.length > 1;
  const sucursalesOpciones = [
    { value: '', label: 'Todas las sucursales' },
    ...sucursalesDisponibles.map((suc) => ({
      value: suc.id.toString(),
      label: suc.nombre + (suc.es_matriz ? ' (Matriz)' : ''),
    })),
  ];

  const handleInputChange = (campo, valor) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor,
    });
  };

  const contarFiltrosActivos = () => {
    let count = 0;
    if (filtros.busqueda) count++;
    if (filtros.estado) count++;
    if (filtros.profesional_id) count++;
    if (filtros.servicio_id) count++;
    if (filtros.sucursal_id) count++;
    if (filtros.fecha_desde) count++;
    if (filtros.fecha_hasta) count++;
    return count;
  };

  const filtrosActivos = contarFiltrosActivos();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      {/* Fila Principal - Siempre visible */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Búsqueda */}
        <div className="md:col-span-5">
          <FormGroup label="Buscar cita">
            <SearchInput
              value={filtros.busqueda || ''}
              onChange={(e) => handleInputChange('busqueda', e.target.value)}
              placeholder="Buscar por código o nombre de cliente..."
              size="md"
            />
          </FormGroup>
        </div>

        {/* Estado */}
        <div className={tieneMultiplesSucursales ? 'md:col-span-2' : 'md:col-span-3'}>
          <FormGroup label="Estado">
            <Select
              value={filtros.estado || ''}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              options={estadosDisponibles}
            />
          </FormGroup>
        </div>

        {/* Multi-sucursal: Selector de sucursal (solo si hay múltiples) */}
        {tieneMultiplesSucursales && (
          <div className="md:col-span-2">
            <FormGroup
              label={
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Sucursal
                </span>
              }
            >
              <Select
                value={filtros.sucursal_id || ''}
                onChange={(e) => handleInputChange('sucursal_id', e.target.value)}
                options={sucursalesOpciones}
              />
            </FormGroup>
          </div>
        )}

        {/* Botón Filtros Avanzados */}
        <div className="md:col-span-2">
          <FormGroup label={<span className="invisible">Acciones</span>}>
            <Button
              variant={mostrarFiltrosAvanzados ? 'primary' : 'secondary'}
              onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
              className="w-full relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {filtrosActivos > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {filtrosActivos}
                </span>
              )}
            </Button>
          </FormGroup>
        </div>

        {/* Botón Limpiar */}
        <div className="md:col-span-2">
          <FormGroup label={<span className="invisible">Limpiar</span>}>
            <Button
              variant="ghost"
              onClick={onLimpiarFiltros}
              disabled={filtrosActivos === 0}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          </FormGroup>
        </div>
      </div>

      {/* Filtros Avanzados - Expandible */}
      {mostrarFiltrosAvanzados && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fecha Desde */}
            <FormGroup label="Fecha desde">
              <input
                type="date"
                value={filtros.fecha_desde || ''}
                onChange={(e) => handleInputChange('fecha_desde', e.target.value)}
                className="w-full px-4 h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </FormGroup>

            {/* Fecha Hasta */}
            <FormGroup label="Fecha hasta">
              <input
                type="date"
                value={filtros.fecha_hasta || ''}
                onChange={(e) => handleInputChange('fecha_hasta', e.target.value)}
                className="w-full px-4 h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </FormGroup>

            {/* Profesional */}
            <FormGroup label="Profesional">
              <Select
                value={filtros.profesional_id || ''}
                onChange={(e) => handleInputChange('profesional_id', e.target.value)}
                options={profesionalesOpciones}
              />
            </FormGroup>

            {/* Servicio */}
            <FormGroup label="Servicio">
              <Select
                value={filtros.servicio_id || ''}
                onChange={(e) => handleInputChange('servicio_id', e.target.value)}
                options={serviciosOpciones}
              />
            </FormGroup>
          </div>

          {/* Info de filtros activos */}
          {filtrosActivos > 0 && (
            <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <p className="text-sm text-primary-800 dark:text-primary-300">
                <span className="font-semibold">{filtrosActivos}</span> filtro
                {filtrosActivos !== 1 ? 's' : ''} activo{filtrosActivos !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {filtros.busqueda && (
                  <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-700">
                    Búsqueda: {filtros.busqueda}
                    <button
                      onClick={() => handleInputChange('busqueda', '')}
                      className="ml-1 hover:text-primary-600 dark:hover:text-primary-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtros.estado && (
                  <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-700">
                    Estado:{' '}
                    {estadosDisponibles.find((e) => e.value === filtros.estado)?.label}
                    <button
                      onClick={() => handleInputChange('estado', '')}
                      className="ml-1 hover:text-primary-600 dark:hover:text-primary-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtros.profesional_id && (
                  <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-700">
                    Profesional:{' '}
                    {
                      profesionalesOpciones.find(
                        (p) => p.value === filtros.profesional_id
                      )?.label
                    }
                    <button
                      onClick={() => handleInputChange('profesional_id', '')}
                      className="ml-1 hover:text-primary-600 dark:hover:text-primary-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtros.servicio_id && (
                  <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-700">
                    Servicio:{' '}
                    {serviciosOpciones.find((s) => s.value === filtros.servicio_id)?.label}
                    <button
                      onClick={() => handleInputChange('servicio_id', '')}
                      className="ml-1 hover:text-primary-600 dark:hover:text-primary-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtros.sucursal_id && (
                  <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-700">
                    <Building2 className="w-3 h-3 mr-1" />
                    Sucursal:{' '}
                    {sucursalesOpciones.find((s) => s.value === filtros.sucursal_id)?.label}
                    <button
                      onClick={() => handleInputChange('sucursal_id', '')}
                      className="ml-1 hover:text-primary-600 dark:hover:text-primary-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtros.fecha_desde && (
                  <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-700">
                    Desde: {filtros.fecha_desde}
                    <button
                      onClick={() => handleInputChange('fecha_desde', '')}
                      className="ml-1 hover:text-primary-600 dark:hover:text-primary-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtros.fecha_hasta && (
                  <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-700">
                    Hasta: {filtros.fecha_hasta}
                    <button
                      onClick={() => handleInputChange('fecha_hasta', '')}
                      className="ml-1 hover:text-primary-600 dark:hover:text-primary-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CitaFilters;
