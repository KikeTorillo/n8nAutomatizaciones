import { Loader2, BarChart3, Calendar, Hash, DollarSign, Clock } from 'lucide-react';
import { Modal, StatCardGrid } from '@/components/ui';
import { useEstadisticasPromocion } from '@/hooks/pos';

/**
 * Modal para mostrar estadísticas de una promoción
 */
export default function PromocionStatsModal({ isOpen, onClose, promocion }) {
  const { data: estadisticas, isLoading } = useEstadisticasPromocion(
    isOpen ? promocion?.id : null
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estadísticas de Promoción"
      subtitle={promocion?.nombre}
      size="md"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : estadisticas ? (
        <div className="space-y-6 p-4">
          {/* Grid principal de métricas */}
          <StatCardGrid
            stats={[
              {
                key: 'usos',
                icon: Hash,
                label: 'Veces usada',
                value: estadisticas.total_usos || 0,
                color: 'amber',
              },
              {
                key: 'descuento',
                icon: DollarSign,
                label: 'Descuento total',
                value: `$${parseFloat(estadisticas.descuento_total || 0).toFixed(2)}`,
                color: 'green',
              },
            ]}
            columns={2}
          />

          {/* Promedio por uso */}
          {estadisticas.promedio_descuento && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Promedio por uso
                </p>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                ${parseFloat(estadisticas.promedio_descuento).toFixed(2)}
              </p>
            </div>
          )}

          {/* Último uso */}
          {estadisticas.ultimo_uso && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Último uso
                </p>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {new Date(estadisticas.ultimo_uso).toLocaleString('es-MX', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
            </div>
          )}

          {/* Información de vigencia */}
          {promocion && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Vigencia
                </p>
              </div>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {new Date(promocion.fecha_inicio).toLocaleDateString('es-MX')}
                {promocion.fecha_fin
                  ? ` → ${new Date(promocion.fecha_fin).toLocaleDateString('es-MX')}`
                  : ' → Sin fecha fin'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay estadísticas disponibles
          </p>
        </div>
      )}
    </Modal>
  );
}
