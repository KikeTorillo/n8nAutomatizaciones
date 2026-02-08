import { DollarSign, Package, Layers, TrendingUp, Download } from 'lucide-react';
import {
  Button,
  SkeletonCard,
  SkeletonTable,
  StatCardGrid,
} from '@/components/ui';
import { useValorInventario } from '@/hooks/inventario';

/**
 * Reporte: Valor de Inventario
 */
function ReporteValorInventario() {
  const { data, isLoading } = useValorInventario();
  const reporte = data || {};

  const handleExportar = () => {
    // TODO: Implementar exportación a CSV/Excel
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  // Calcular valores para mostrar
  const valorVenta = parseFloat(reporte.valor_venta) || 0;
  const valorCompra = parseFloat(reporte.valor_compra) || 0;
  const totalProductos = parseInt(reporte.total_productos) || 0;
  const totalUnidades = parseInt(reporte.total_unidades) || 0;
  const margenPotencial = parseFloat(reporte.margen_potencial) || 0;
  const porcentajeMargen = parseFloat(reporte.porcentaje_margen) || 0;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <StatCardGrid
        stats={[
          {
            icon: DollarSign,
            label: 'Valor Venta',
            value: `$${valorVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            color: 'primary',
            subtext: `Costo: $${valorCompra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          },
          {
            icon: Package,
            label: 'Total Productos',
            value: totalProductos.toLocaleString('es-MX'),
            color: 'blue',
          },
          {
            icon: Layers,
            label: 'Unidades Totales',
            value: totalUnidades.toLocaleString('es-MX'),
            color: 'purple',
          },
          {
            icon: TrendingUp,
            label: 'Margen Potencial',
            value: `$${margenPotencial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            color: 'green',
            subtext: `${porcentajeMargen.toFixed(1)}% de margen`,
          },
        ]}
      />

      {/* Botón Exportar */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleExportar} icon={Download}>
          Exportar Reporte
        </Button>
      </div>

      {/* Tabla de Productos */}
      {reporte.productos && reporte.productos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Venta
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    % del Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reporte.productos.map((producto) => (
                  <tr key={producto.id || producto.sku || producto.nombre} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {producto.nombre}
                      </div>
                      {producto.sku && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {producto.sku}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{producto.stock_actual}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        ${producto.precio_venta.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        ${producto.valor_total.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {producto.porcentaje_total?.toFixed(2)}%
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

export default ReporteValorInventario;
