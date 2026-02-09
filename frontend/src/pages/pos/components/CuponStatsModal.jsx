import { useState } from 'react';
import {
  Loader2,
  BarChart3,
  History,
  Calendar,
  Hash,
  DollarSign,
  Clock,
  Users,
  ShoppingCart,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Modal, StatCardGrid } from '@/components/ui';
import { useEstadisticasCupon, useHistorialCupon } from '@/hooks/pos';

/**
 * Modal para mostrar estadísticas e historial de un cupón
 * Con tabs para navegar entre Estadísticas e Historial
 */
export default function CuponStatsModal({ isOpen, onClose, cupon }) {
  const [activeTab, setActiveTab] = useState('estadisticas');

  const { data: estadisticas, isLoading: loadingStats } = useEstadisticasCupon(
    isOpen ? cupon?.id : null
  );

  const { data: historial, isLoading: loadingHistorial } = useHistorialCupon(
    isOpen && activeTab === 'historial' ? cupon?.id : null,
    { limit: 20 }
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={estadisticas ? `Estadísticas: ${estadisticas.nombre}` : 'Estadísticas del Cupón'}
      subtitle={estadisticas?.codigo ? `Código: ${estadisticas.codigo}` : undefined}
      size="lg"
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          onClick={() => setActiveTab('estadisticas')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'estadisticas'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Estadísticas
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'historial'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <History className="h-4 w-4" />
          Historial de Uso
        </button>
      </div>

      {/* Tab: Estadísticas */}
      {activeTab === 'estadisticas' && (
        <>
          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : estadisticas ? (
            <div className="space-y-6">
              {/* Grid principal de métricas */}
              <StatCardGrid
                stats={[
                  {
                    key: 'usos',
                    icon: Hash,
                    label: 'Veces usado',
                    value: estadisticas.total_usos || 0,
                    color: 'primary',
                  },
                  {
                    key: 'descuento',
                    icon: DollarSign,
                    label: 'Descuento total dado',
                    value: `$${parseFloat(estadisticas.total_descuento_dado || 0).toFixed(2)}`,
                    color: 'green',
                  },
                  {
                    key: 'ventas',
                    icon: ShoppingCart,
                    label: 'Ventas con cupón',
                    value: `$${parseFloat(estadisticas.total_ventas_con_cupon || 0).toFixed(2)}`,
                    color: 'blue',
                  },
                  {
                    key: 'clientes',
                    icon: Users,
                    label: 'Clientes únicos',
                    value: estadisticas.clientes_unicos || 0,
                    color: 'purple',
                  },
                ]}
                columns={4}
              />

              {/* Detalles adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Promedio por uso */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Descuento promedio por uso
                    </p>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    ${parseFloat(estadisticas.descuento_promedio || 0).toFixed(2)}
                  </p>
                </div>

                {/* Último uso */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Último uso</p>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {estadisticas.ultimo_uso
                      ? new Date(estadisticas.ultimo_uso).toLocaleString('es-MX', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Sin usar aún'}
                  </p>
                </div>
              </div>

              {/* Barra de progreso de uso */}
              {estadisticas.usos_maximos && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Uso del cupón</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {estadisticas.usos_actuales || 0} / {estadisticas.usos_maximos}
                    </p>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (estadisticas.usos_actuales / estadisticas.usos_maximos) >= 0.9
                          ? 'bg-red-500'
                          : (estadisticas.usos_actuales / estadisticas.usos_maximos) >= 0.7
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(100, ((estadisticas.usos_actuales || 0) / estadisticas.usos_maximos) * 100)}%`,
                      }}
                    />
                  </div>
                  {(estadisticas.usos_actuales / estadisticas.usos_maximos) >= 0.9 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      ¡El cupón está por agotar sus usos!
                    </p>
                  )}
                </div>
              )}

              {/* Fechas de vigencia */}
              {(estadisticas.fecha_inicio || estadisticas.fecha_fin) && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vigencia</p>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {estadisticas.fecha_inicio
                      ? new Date(estadisticas.fecha_inicio).toLocaleDateString('es-MX')
                      : 'Sin fecha inicio'}
                    {' → '}
                    {estadisticas.fecha_fin
                      ? new Date(estadisticas.fecha_fin).toLocaleDateString('es-MX')
                      : 'Sin fecha fin'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              No hay estadísticas disponibles
            </div>
          )}
        </>
      )}

      {/* Tab: Historial */}
      {activeTab === 'historial' && (
        <>
          {loadingHistorial ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : historial && historial.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ticket
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Venta
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Descuento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {historial.map((uso, index) => (
                    <tr key={uso.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {uso.aplicado_en
                          ? new Date(uso.aplicado_en).toLocaleString('es-MX', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : uso.fecha_venta
                            ? new Date(uso.fecha_venta).toLocaleString('es-MX', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          {uso.numero_ticket || `#${uso.venta_pos_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {uso.cliente_nombre || 'Público general'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                        ${parseFloat(uso.total_venta || uso.subtotal_antes || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">
                        -${parseFloat(uso.descuento_aplicado || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">Sin historial</p>
              <p className="text-sm">Este cupón aún no ha sido utilizado</p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
