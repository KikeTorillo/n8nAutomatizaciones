import { Search, X, Filter } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

/**
 * Componente de filtros para el módulo de citas
 */
function CitaFilters({
  filtros,
  onFiltrosChange,
  profesionales = [],
  servicios = [],
  onLimpiarFiltros,
}) {
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
    if (filtros.fecha_desde) count++;
    if (filtros.fecha_hasta) count++;
    return count;
  };

  const filtrosActivos = contarFiltrosActivos();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      {/* Fila Principal - Siempre visible */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Búsqueda */}
        <div className="md:col-span-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar cita
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Buscar por código o nombre de cliente..."
              value={filtros.busqueda || ''}
              onChange={(e) => handleInputChange('busqueda', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {filtros.busqueda && (
              <button
                onClick={() => handleInputChange('busqueda', '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* Estado */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
          <Select
            value={filtros.estado || ''}
            onChange={(e) => handleInputChange('estado', e.target.value)}
            options={estadosDisponibles}
          />
        </div>

        {/* Botón Filtros Avanzados */}
        <div className="md:col-span-2 flex items-end">
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
        </div>

        {/* Botón Limpiar */}
        <div className="md:col-span-2 flex items-end">
          <Button
            variant="ghost"
            onClick={onLimpiarFiltros}
            disabled={filtrosActivos === 0}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Filtros Avanzados - Expandible */}
      {mostrarFiltrosAvanzados && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde || ''}
                onChange={(e) => handleInputChange('fecha_desde', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta || ''}
                onChange={(e) => handleInputChange('fecha_hasta', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Profesional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profesional
              </label>
              <Select
                value={filtros.profesional_id || ''}
                onChange={(e) => handleInputChange('profesional_id', e.target.value)}
                options={profesionalesOpciones}
              />
            </div>

            {/* Servicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Servicio
              </label>
              <Select
                value={filtros.servicio_id || ''}
                onChange={(e) => handleInputChange('servicio_id', e.target.value)}
                options={serviciosOpciones}
              />
            </div>
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
