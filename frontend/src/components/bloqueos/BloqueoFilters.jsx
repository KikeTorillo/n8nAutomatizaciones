import PropTypes from 'prop-types';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { LABELS_TIPO_BLOQUEO } from '@/utils/bloqueoHelpers';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

/**
 * BloqueoFilters - Componente de filtros para bloqueos
 */
function BloqueoFilters({
  filtros,
  onFiltrosChange,
  onLimpiar,
  profesionales,
  isLoadingProfesionales,
}) {
  const [mostrarAvanzados, setMostrarAvanzados] = useState(false);

  // Tipos de bloqueo disponibles
  const tiposBloqueo = [
    { value: '', label: 'Todos los tipos' },
    { value: 'vacaciones', label: LABELS_TIPO_BLOQUEO.vacaciones },
    { value: 'feriado', label: LABELS_TIPO_BLOQUEO.feriado },
    { value: 'mantenimiento', label: LABELS_TIPO_BLOQUEO.mantenimiento },
    { value: 'evento_especial', label: LABELS_TIPO_BLOQUEO.evento_especial },
    { value: 'emergencia', label: LABELS_TIPO_BLOQUEO.emergencia },
    { value: 'personal', label: LABELS_TIPO_BLOQUEO.personal },
    { value: 'organizacional', label: LABELS_TIPO_BLOQUEO.organizacional },
  ];

  // Opciones de profesionales
  const opcionesProfesionales = [
    { value: '', label: 'Todos los profesionales' },
    ...(profesionales || []).map((prof) => ({
      value: prof.id.toString(),
      label: prof.nombre_completo || `${prof.nombres} ${prof.apellidos}`,
    })),
  ];

  // Contar filtros activos
  const contarFiltrosActivos = () => {
    let count = 0;
    if (filtros.busqueda) count++;
    if (filtros.tipo_bloqueo) count++;
    if (filtros.profesional_id) count++;
    if (filtros.fecha_desde) count++;
    if (filtros.fecha_hasta) count++;
    if (filtros.solo_activos !== undefined) count++;
    return count;
  };

  const filtrosActivos = contarFiltrosActivos();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Fila principal: Búsqueda y Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Búsqueda */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={filtros.busqueda || ''}
              onChange={(e) =>
                onFiltrosChange({
                  ...filtros,
                  busqueda: e.target.value,
                })
              }
              className="pl-10"
            />
          </div>
        </div>

        {/* Tipo de bloqueo */}
        <div>
          <Select
            value={filtros.tipo_bloqueo || ''}
            onChange={(e) =>
              onFiltrosChange({
                ...filtros,
                tipo_bloqueo: e.target.value,
              })
            }
            options={tiposBloqueo}
          />
        </div>
      </div>

      {/* Botón filtros avanzados */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMostrarAvanzados(!mostrarAvanzados)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filtros avanzados</span>
          {filtrosActivos > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              {filtrosActivos}
            </span>
          )}
          {mostrarAvanzados ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Botón limpiar */}
        {filtrosActivos > 0 && (
          <button
            onClick={onLimpiar}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Filtros avanzados expandibles */}
      {mostrarAvanzados && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Profesional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profesional
              </label>
              <Select
                value={filtros.profesional_id || ''}
                onChange={(e) =>
                  onFiltrosChange({
                    ...filtros,
                    profesional_id: e.target.value,
                  })
                }
                options={opcionesProfesionales}
                disabled={isLoadingProfesionales}
              />
            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <Input
                type="date"
                value={filtros.fecha_desde || ''}
                onChange={(e) =>
                  onFiltrosChange({
                    ...filtros,
                    fecha_desde: e.target.value,
                  })
                }
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <Input
                type="date"
                value={filtros.fecha_hasta || ''}
                onChange={(e) =>
                  onFiltrosChange({
                    ...filtros,
                    fecha_hasta: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Solo activos */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="solo_activos"
              checked={filtros.solo_activos !== false}
              onChange={(e) =>
                onFiltrosChange({
                  ...filtros,
                  solo_activos: e.target.checked,
                })
              }
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="solo_activos" className="text-sm text-gray-700">
              Mostrar solo bloqueos activos
            </label>
          </div>
        </div>
      )}

      {/* Badges de filtros activos */}
      {filtrosActivos > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          {filtros.busqueda && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              Búsqueda: {filtros.busqueda}
              <button
                onClick={() => onFiltrosChange({ ...filtros, busqueda: '' })}
                className="hover:text-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filtros.tipo_bloqueo && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              Tipo: {LABELS_TIPO_BLOQUEO[filtros.tipo_bloqueo]}
              <button
                onClick={() => onFiltrosChange({ ...filtros, tipo_bloqueo: '' })}
                className="hover:text-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filtros.profesional_id && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              Profesional seleccionado
              <button
                onClick={() => onFiltrosChange({ ...filtros, profesional_id: '' })}
                className="hover:text-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filtros.fecha_desde && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              Desde: {filtros.fecha_desde}
              <button
                onClick={() => onFiltrosChange({ ...filtros, fecha_desde: '' })}
                className="hover:text-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filtros.fecha_hasta && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              Hasta: {filtros.fecha_hasta}
              <button
                onClick={() => onFiltrosChange({ ...filtros, fecha_hasta: '' })}
                className="hover:text-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

BloqueoFilters.propTypes = {
  filtros: PropTypes.object.isRequired,
  onFiltrosChange: PropTypes.func.isRequired,
  onLimpiar: PropTypes.func.isRequired,
  profesionales: PropTypes.array,
  isLoadingProfesionales: PropTypes.bool,
};

BloqueoFilters.defaultProps = {
  profesionales: [],
  isLoadingProfesionales: false,
};

export default BloqueoFilters;
