import { Button, Modal } from '@/components/ui';
import { useAsiento } from '@/hooks/useContabilidad';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

// Colores de estado
const ESTADO_COLORS = {
  borrador: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400',
  publicado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
  anulado: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400',
};

/**
 * Modal para ver detalle de asiento contable
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal esta abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.asiento - Asiento a mostrar
 */
export default function AsientoDetailModal({ isOpen, onClose, asiento }) {
  const { data: asientoDetalle, isLoading } = useAsiento(
    asiento?.id,
    asiento?.fecha
  );

  if (!asiento) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Asiento #${asiento.numero_asiento}`} size="lg">
      {isLoading ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Cargando detalle...</div>
      ) : (
        <div className="space-y-4">
          {/* Info general */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Fecha</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(asientoDetalle?.fecha || asiento.fecha), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Tipo</span>
              <p className="font-medium capitalize text-gray-900 dark:text-gray-100">
                {(asientoDetalle?.tipo || asiento.tipo)?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Estado</span>
              <p>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    ESTADO_COLORS[asientoDetalle?.estado || asiento.estado]
                  }`}
                >
                  {asientoDetalle?.estado || asiento.estado}
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Creado por</span>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {asientoDetalle?.creado_por_nombre || 'Sistema'}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Concepto</span>
            <p className="font-medium text-gray-900 dark:text-gray-100">{asientoDetalle?.concepto || asiento.concepto}</p>
          </div>

          {/* Movimientos */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Movimientos</h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Cuenta
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Concepto
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                      Debe
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                      Haber
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {asientoDetalle?.movimientos?.map((mov, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-sm">
                        <span className="font-mono text-gray-600 dark:text-gray-400">{mov.cuenta_codigo}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">{mov.cuenta_nombre}</span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{mov.concepto || '-'}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {mov.debe > 0 ? formatCurrency(mov.debe) : ''}
                      </td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {mov.haber > 0 ? formatCurrency(mov.haber) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                      Total:
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(asientoDetalle?.total_debe || asiento.total_debe || 0)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(asientoDetalle?.total_haber || asiento.total_haber || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notas */}
          {(asientoDetalle?.notas || asiento.notas) && (
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Notas</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg mt-1">
                {asientoDetalle?.notas || asiento.notas}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
