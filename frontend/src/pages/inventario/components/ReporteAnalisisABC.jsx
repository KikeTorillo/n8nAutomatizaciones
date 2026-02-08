import { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import {
  Alert,
  Badge,
  EmptyState,
  SkeletonTable,
} from '@/components/ui';
import { useAnalisisABC } from '@/hooks/inventario';
import { format } from 'date-fns';

const getCategoriaVariant = (categoria) => {
  const variants = {
    A: 'success',
    B: 'warning',
    C: 'default',
  };
  return variants[categoria] || 'default';
};

/**
 * Reporte: Análisis ABC
 */
function ReporteAnalisisABC() {
  const [fechas, setFechas] = useState({
    fecha_desde: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    fecha_hasta: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data, isLoading } = useAnalisisABC(fechas);
  const productos = data?.productos || [];

  return (
    <div className="space-y-6">
      {/* Filtros de Fecha */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechas.fecha_desde}
              onChange={(e) => setFechas({ ...fechas, fecha_desde: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechas.fecha_hasta}
              onChange={(e) => setFechas({ ...fechas, fecha_hasta: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Explicación ABC */}
      <Alert variant="info" icon={Info} title="Análisis ABC">
        <ul className="text-sm space-y-1">
          <li>
            <strong>Categoría A (80%):</strong> Productos más importantes por ventas
          </li>
          <li>
            <strong>Categoría B (15%):</strong> Productos de importancia media
          </li>
          <li>
            <strong>Categoría C (5%):</strong> Productos de menor importancia
          </li>
        </ul>
      </Alert>

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <SkeletonTable rows={5} columns={5} />
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-8">
          <EmptyState
            icon={BarChart3}
            title="Sin datos de análisis"
            description="No hay datos para el período seleccionado"
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unidades Vendidas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ingresos Totales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    % Acumulado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {productos.map((producto) => (
                  <tr key={producto.id || producto.nombre} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <Badge variant={getCategoriaVariant(producto.categoria_abc)} size="sm">
                        {producto.categoria_abc}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {producto.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {producto.unidades_vendidas}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        ${producto.ingresos_totales.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {producto.porcentaje_acumulado.toFixed(2)}%
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

export default ReporteAnalisisABC;
