/**
 * CalendarioDiaVacaciones - Celda individual del calendario de equipo
 * Muestra avatar + nombre del profesional con color según estado
 * Ene 2026: Calendario de Equipo para competir con Odoo
 */
import { format } from 'date-fns';
import { User } from 'lucide-react';
import PropTypes from 'prop-types';

// Colores por estado de solicitud
const obtenerColorEstado = (estado) => {
  const colores = {
    aprobada: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-500',
      text: 'text-green-700 dark:text-green-300',
      dot: 'bg-green-500',
    },
    pendiente: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-500',
      text: 'text-yellow-700 dark:text-yellow-300',
      dot: 'bg-yellow-500',
    },
    rechazada: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-300',
      text: 'text-red-400 dark:text-red-500 line-through',
      dot: 'bg-red-400',
    },
    cancelada: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-300',
      text: 'text-gray-400 line-through',
      dot: 'bg-gray-400',
    },
  };
  return colores[estado] || colores.pendiente;
};

function CalendarioDiaVacaciones({
  dia,
  solicitudes = [],
  esDelMesActual = true,
  esHoy = false,
  onVerSolicitud = () => {},
  isLoading = false,
}) {
  const numeroDia = format(dia, 'd');
  const maxVisibles = 3;
  const visibles = solicitudes.slice(0, maxVisibles);
  const ocultas = solicitudes.length - maxVisibles;

  return (
    <div
      className={`
        min-h-[100px] border border-gray-200 dark:border-gray-700 rounded-lg p-2 transition-all
        ${esDelMesActual ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
        ${esHoy ? 'ring-2 ring-primary-500 dark:ring-primary-400 ring-inset' : ''}
        hover:shadow-md dark:hover:shadow-gray-900/50
        relative group
      `}
    >
      {/* Número del día */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            text-sm font-semibold
            ${esDelMesActual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}
            ${esHoy ? 'text-primary-600 dark:text-primary-400' : ''}
          `}
        >
          {numeroDia}
        </span>

        {/* Badge de cantidad */}
        {solicitudes.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 dark:bg-primary-500 rounded-full">
            {solicitudes.length}
          </span>
        )}
      </div>

      {/* Lista de solicitudes */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {visibles.map((sol) => {
              const colores = obtenerColorEstado(sol.estado);
              return (
                <button
                  key={`${sol.id}-${dia.toISOString()}`}
                  onClick={() => onVerSolicitud(sol)}
                  className={`
                    w-full text-left px-1.5 py-1 rounded text-xs
                    ${colores.bg} ${colores.text}
                    hover:opacity-80 border-l-2 ${colores.border}
                    transition-all truncate flex items-center gap-1
                  `}
                  title={`${sol.profesional_nombre} - ${sol.estado}`}
                >
                  {/* Avatar placeholder */}
                  <div
                    className={`w-4 h-4 rounded-full ${colores.dot} flex items-center justify-center flex-shrink-0`}
                  >
                    <User className="w-2.5 h-2.5 text-white" />
                  </div>
                  {/* Nombre truncado (solo primer nombre) */}
                  <span className="truncate font-medium">
                    {sol.profesional_nombre?.split(' ')[0] || 'Sin nombre'}
                  </span>
                </button>
              );
            })}

            {/* Indicador de más */}
            {ocultas > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium text-center py-0.5">
                +{ocultas} más
              </div>
            )}
          </>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && solicitudes.length === 0 && esDelMesActual && (
        <div className="flex items-center justify-center h-12 text-gray-400 dark:text-gray-500">
          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            Sin vacaciones
          </span>
        </div>
      )}
    </div>
  );
}

CalendarioDiaVacaciones.propTypes = {
  dia: PropTypes.instanceOf(Date).isRequired,
  solicitudes: PropTypes.array,
  esDelMesActual: PropTypes.bool,
  esHoy: PropTypes.bool,
  onVerSolicitud: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default CalendarioDiaVacaciones;
