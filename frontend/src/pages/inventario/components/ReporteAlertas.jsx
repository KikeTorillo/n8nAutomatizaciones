import { SkeletonTable } from '@/components/ui';
import { useResumenAlertas } from '@/hooks/inventario';

/**
 * Reporte: Resumen de Alertas
 */
function ReporteAlertas() {
  const { data, isLoading } = useResumenAlertas();
  const resumen = data || {};

  return (
    <div className="space-y-6">
      {/* Resumen por Nivel */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-primary-800 dark:text-primary-300 mb-1">Info</p>
          <p className="text-xl sm:text-3xl font-bold text-primary-900 dark:text-primary-200">
            {resumen.total_info || 0}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 mb-1">Warning</p>
          <p className="text-xl sm:text-3xl font-bold text-yellow-900 dark:text-yellow-200">
            {resumen.total_warning || 0}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-red-800 dark:text-red-300 mb-1">Critical</p>
          <p className="text-xl sm:text-3xl font-bold text-red-900 dark:text-red-200">
            {resumen.total_critical || 0}
          </p>
        </div>
      </div>

      {/* Resumen por Tipo */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <SkeletonTable rows={5} columns={3} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo de Alerta
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    No Leídas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {resumen.por_tipo && resumen.por_tipo.map((tipo) => (
                  <tr key={tipo.tipo_alerta} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tipo.tipo_alerta}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{tipo.total}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {tipo.no_leidas}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReporteAlertas;
