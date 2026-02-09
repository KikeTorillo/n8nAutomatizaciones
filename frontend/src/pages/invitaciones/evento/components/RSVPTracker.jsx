/**
 * RSVPTracker — Resumen visual de confirmaciones RSVP
 */
import { Users, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { memo } from 'react';

const RSVPTracker = memo(function RSVPTracker({ stats }) {
  const total = stats?.total_invitados || 0;
  const confirmados = stats?.total_confirmados || 0;
  const pendientes = stats?.total_pendientes || 0;
  const rechazados = stats?.total_rechazados || 0;

  const porcentaje = total > 0 ? Math.round((confirmados / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Estado de confirmaciones</h3>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600 dark:text-gray-400">Progreso</span>
          <span className="font-semibold text-gray-900 dark:text-white">{porcentaje}%</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{total}</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Total</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{confirmados}</p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">Confirmados</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{pendientes}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Pendientes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{rechazados}</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">Rechazados</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default RSVPTracker;
