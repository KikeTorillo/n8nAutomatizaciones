import { Clock, User, Calendar } from 'lucide-react';

/**
 * Lista de citas del día
 */
function CitasDelDia({ citas, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!citas || citas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No hay citas programadas para hoy</p>
      </div>
    );
  }

  // Función para color según estado
  const getEstadoColor = (estado) => {
    const colores = {
      programada: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200',
      confirmada: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200',
      en_curso: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
      completada: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      cancelada: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
    };
    return colores[estado] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {citas.map((cita) => (
        <div
          key={cita.id}
          className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-4 transition-colors border border-gray-200 dark:border-gray-600"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {cita.cliente_nombre}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {cita.servicio_nombre}
              </p>
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(
                cita.estado
              )}`}
            >
              {cita.estado.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{cita.hora_inicio}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{cita.profesional_nombre}</span>
            </div>
          </div>

          {cita.notas && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
              "{cita.notas}"
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default CitasDelDia;
