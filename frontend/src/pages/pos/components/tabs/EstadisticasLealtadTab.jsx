import {
  Users,
  Star,
  Gift,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { StatCardGrid } from '@/components/ui';

/**
 * Tab de Estadísticas del Programa de Lealtad
 * Muestra métricas y ranking de clientes
 */
export default function EstadisticasLealtadTab({ estadisticas, clientes, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const stats = estadisticas || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stats cards */}
      <StatCardGrid
        stats={[
          {
            key: 'clientes',
            icon: Users,
            label: 'Clientes en programa',
            value: stats.total_clientes?.toLocaleString() || '0',
            color: 'primary',
          },
          {
            key: 'circulacion',
            icon: Star,
            label: 'Puntos en circulación',
            value: stats.puntos_circulacion?.toLocaleString() || '0',
            color: 'yellow',
          },
          {
            key: 'canjeados',
            icon: Gift,
            label: 'Puntos canjeados (30d)',
            value: stats.puntos_canjeados_mes?.toLocaleString() || '0',
            color: 'green',
          },
          {
            key: 'tasa',
            icon: TrendingUp,
            label: 'Tasa de canje',
            value: `${stats.tasa_canje?.toFixed(1) || '0'}%`,
            color: 'blue',
          },
        ]}
        columns={4}
      />

      {/* Top clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Top 10 Clientes con más Puntos
          </h3>
        </div>
        {clientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aún no hay clientes con puntos acumulados
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {clientes.map((cliente, index) => (
              <div key={cliente.cliente_id} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {cliente.cliente_nombre || 'Cliente'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cliente.cliente_email || cliente.cliente_telefono || ''}
                  </p>
                </div>
                {cliente.nivel_nombre && (
                  <span
                    className="text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: cliente.nivel_color || '#6B7280' }}
                  >
                    {cliente.nivel_nombre}
                  </span>
                )}
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {cliente.puntos_disponibles?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">puntos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
