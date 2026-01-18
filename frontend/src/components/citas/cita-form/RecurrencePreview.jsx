import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * RecurrencePreview - Muestra el preview de fechas disponibles para citas recurrentes
 *
 * @param {Object} previewData - Datos del preview (fechas_disponibles, fechas_no_disponibles, etc.)
 */
function RecurrencePreview({ previewData }) {
  if (!previewData) return null;

  return (
    <div className="mt-4 space-y-3">
      {/* Resumen */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {previewData.descripcion_patron}
        </span>
        <span className={`font-medium ${
          previewData.porcentaje_disponibilidad >= 80 ? 'text-green-600' :
          previewData.porcentaje_disponibilidad >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {previewData.porcentaje_disponibilidad}% disponible
        </span>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-bold">{previewData.total_disponibles}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Disponibles</span>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            <span className="font-bold">{previewData.total_no_disponibles}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Conflictos</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="font-bold">{previewData.total_solicitadas}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
        </div>
      </div>

      {/* Lista expandible de fechas */}
      <details className="text-sm">
        <summary className="cursor-pointer text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
          Ver detalle de fechas
        </summary>
        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
          {previewData.fechas_disponibles?.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="w-3 h-3" />
              <span>{new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
          ))}
          {previewData.fechas_no_disponibles?.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <XCircle className="w-3 h-3" />
              <span>{new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} - {f.motivo}</span>
            </div>
          ))}
        </div>
      </details>

      {/* Advertencia si hay muchos conflictos */}
      {previewData.porcentaje_disponibilidad < 50 && (
        <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <span className="text-yellow-700 dark:text-yellow-300">
            Muchas fechas no están disponibles. Considera ajustar el horario o el profesional.
          </span>
        </div>
      )}
    </div>
  );
}

export default RecurrencePreview;
