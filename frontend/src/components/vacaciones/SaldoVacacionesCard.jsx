/**
 * SaldoVacacionesCard - Tarjeta de saldo de vacaciones
 * Fase 3 del Plan de Empleados Competitivo - Enero 2026
 */
import { Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { formatDias, calcularProgresoNivel } from '@/hooks/useVacaciones';

/**
 * Tarjeta que muestra el saldo de vacaciones del usuario
 * @param {Object} saldo - Datos del saldo de vacaciones
 * @param {Object} nivel - Información del nivel por antigüedad
 * @param {boolean} isLoading - Si está cargando
 */
function SaldoVacacionesCard({ saldo, nivel, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!saldo) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <AlertCircle className="h-5 w-5" />
          <span>No hay información de saldo de vacaciones disponible</span>
        </div>
      </div>
    );
  }

  const diasPendientes = parseFloat(saldo.dias_pendientes) || 0;
  const diasUsados = parseFloat(saldo.dias_usados) || 0;
  const diasEnTramite = parseFloat(saldo.dias_solicitados_pendientes) || 0;
  const diasCorrespondientes = parseFloat(saldo.dias_correspondientes) || 0;
  const diasAcumulados = parseFloat(saldo.dias_acumulados_anterior) || 0;

  const progreso = nivel ? calcularProgresoNivel(nivel) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Mis Vacaciones {saldo.anio}
        </h3>
        {nivel && (
          <p className="text-primary-100 text-sm mt-1">
            {nivel.nivel_nombre} ({formatDias(nivel.dias_correspondientes)} anuales)
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700">
        {/* Saldo Disponible */}
        <div className="p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {formatDias(diasPendientes)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Disponibles
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {formatDias(diasCorrespondientes)} base
            {diasAcumulados > 0 && ` + ${formatDias(diasAcumulados)} acum.`}
          </div>
        </div>

        {/* Días Usados */}
        <div className="p-6 text-center">
          <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
            {formatDias(diasUsados)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Usados
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            este año
          </div>
        </div>

        {/* En Trámite */}
        <div className="p-6 text-center">
          <div className={`text-3xl font-bold ${diasEnTramite > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'}`}>
            {formatDias(diasEnTramite)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            En trámite
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            pendientes de aprobación
          </div>
        </div>
      </div>

      {/* Progreso hacia siguiente nivel */}
      {progreso && progreso.aniosFaltantes && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span>Próximo nivel en {progreso.aniosFaltantes.toFixed(1)} años</span>
            {progreso.diasSiguienteNivel && (
              <span className="text-primary-600 dark:text-primary-400">
                (+{progreso.diasSiguienteNivel - (nivel?.dias_correspondientes || 0)} días)
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progreso.porcentaje}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SaldoVacacionesCard;
