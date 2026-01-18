import { Repeat, Calendar } from 'lucide-react';
import { Button } from '@/components/ui';
import { FRECUENCIAS, DIAS_SEMANA, TERMINA_EN } from '@/hooks/agendamiento/citas';
import RecurrencePreview from './RecurrencePreview';

/**
 * RecurrencePanel - Panel completo de configuración de citas recurrentes
 *
 * @param {Object} props
 * @param {boolean} props.esRecurrente - Si la cita es recurrente
 * @param {Function} props.onToggleRecurrencia - Callback al cambiar toggle
 * @param {string} props.frecuencia - Frecuencia seleccionada
 * @param {Function} props.onFrecuenciaChange - Callback al cambiar frecuencia
 * @param {Array} props.diasSemana - Días de semana seleccionados
 * @param {Function} props.onToggleDiaSemana - Callback al toggle día
 * @param {number} props.intervalo - Intervalo de semanas
 * @param {Function} props.onIntervaloChange - Callback al cambiar intervalo
 * @param {string} props.terminaEn - Tipo de terminación (cantidad/fecha)
 * @param {Function} props.onTerminaEnChange - Callback al cambiar terminación
 * @param {number} props.cantidadCitas - Número de citas
 * @param {Function} props.onCantidadCitasChange - Callback al cambiar cantidad
 * @param {string} props.fechaFinRecurrencia - Fecha de fin
 * @param {Function} props.onFechaFinChange - Callback al cambiar fecha fin
 * @param {Function} props.onPreview - Callback para generar preview
 * @param {boolean} props.isLoadingPreview - Si está cargando preview
 * @param {boolean} props.mostrarPreview - Si mostrar el preview
 * @param {Object} props.previewData - Datos del preview
 */
function RecurrencePanel({
  esRecurrente,
  onToggleRecurrencia,
  frecuencia,
  onFrecuenciaChange,
  diasSemana,
  onToggleDiaSemana,
  intervalo,
  onIntervaloChange,
  terminaEn,
  onTerminaEnChange,
  cantidadCitas,
  onCantidadCitasChange,
  fechaFinRecurrencia,
  onFechaFinChange,
  onPreview,
  isLoadingPreview,
  mostrarPreview,
  previewData,
}) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      {/* Toggle de recurrencia */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cita Recurrente
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={esRecurrente}
            onChange={(e) => onToggleRecurrencia(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {/* Panel de configuración de recurrencia */}
      {esRecurrente && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
          {/* Frecuencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frecuencia
            </label>
            <select
              value={frecuencia}
              onChange={(e) => onFrecuenciaChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {FRECUENCIAS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Días de la semana (solo para semanal/quincenal) */}
          {(frecuencia === 'semanal' || frecuencia === 'quincenal') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Días de la semana (opcional)
              </label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((dia) => (
                  <button
                    key={dia.value}
                    type="button"
                    onClick={() => onToggleDiaSemana(dia.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      diasSemana.includes(dia.value)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {dia.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Si no seleccionas días, se usará el mismo día de la semana que la fecha inicial
              </p>
            </div>
          )}

          {/* Intervalo (solo para semanal) */}
          {frecuencia === 'semanal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cada cuántas semanas
              </label>
              <select
                value={intervalo}
                onChange={(e) => onIntervaloChange(parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={1}>Cada semana</option>
                <option value={2}>Cada 2 semanas</option>
                <option value={3}>Cada 3 semanas</option>
                <option value={4}>Cada 4 semanas</option>
              </select>
            </div>
          )}

          {/* Terminación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Termina
              </label>
              <select
                value={terminaEn}
                onChange={(e) => onTerminaEnChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {TERMINA_EN.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {terminaEn === 'cantidad' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de citas
                </label>
                <input
                  type="number"
                  min={2}
                  max={52}
                  value={cantidadCitas}
                  onChange={(e) => onCantidadCitasChange(parseInt(e.target.value) || 12)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  value={fechaFinRecurrencia}
                  onChange={(e) => onFechaFinChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}
          </div>

          {/* Botón de Preview */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreview}
            isLoading={isLoadingPreview}
            className="w-full"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Ver fechas disponibles
          </Button>

          {/* Preview de fechas */}
          {mostrarPreview && previewData && (
            <RecurrencePreview previewData={previewData} />
          )}
        </div>
      )}
    </div>
  );
}

export default RecurrencePanel;
