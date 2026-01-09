/**
 * FiltrosCalendarioVacaciones - Barra de filtros para el calendario de equipo
 * Ene 2026: Calendario de Equipo para competir con Odoo
 */
import PropTypes from 'prop-types';
import { Filter, Users, Building } from 'lucide-react';
import { useDepartamentosActivos } from '@/hooks/useDepartamentos';

function FiltrosCalendarioVacaciones({ filtros = {}, onFiltrosChange, soloEquipo = false }) {
  const { data: departamentos = [] } = useDepartamentosActivos();

  const handleEstadoChange = (e) => {
    onFiltrosChange({ ...filtros, estado: e.target.value || null });
  };

  const handleDepartamentoChange = (e) => {
    onFiltrosChange({
      ...filtros,
      departamento_id: e.target.value ? parseInt(e.target.value, 10) : null,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
      <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />

      {/* Indicador Mi Equipo / Todos */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        {soloEquipo ? (
          <>
            <Users className="h-4 w-4" />
            <span>Mi Equipo</span>
          </>
        ) : (
          <>
            <Building className="h-4 w-4" />
            <span>Toda la organización</span>
          </>
        )}
      </div>

      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

      {/* Filtro por estado */}
      <select
        value={filtros.estado || ''}
        onChange={handleEstadoChange}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="">Todos los estados</option>
        <option value="aprobada">Aprobadas</option>
        <option value="pendiente">Pendientes</option>
        <option value="rechazada">Rechazadas</option>
      </select>

      {/* Filtro por departamento (solo si no es "Mi Equipo") */}
      {!soloEquipo && departamentos.length > 0 && (
        <select
          value={filtros.departamento_id || ''}
          onChange={handleDepartamentoChange}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Todos los departamentos</option>
          {departamentos.map((dep) => (
            <option key={dep.id} value={dep.id}>
              {dep.nombre}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

FiltrosCalendarioVacaciones.propTypes = {
  filtros: PropTypes.shape({
    estado: PropTypes.string,
    departamento_id: PropTypes.number,
  }),
  onFiltrosChange: PropTypes.func.isRequired,
  soloEquipo: PropTypes.bool,
};

export default FiltrosCalendarioVacaciones;
