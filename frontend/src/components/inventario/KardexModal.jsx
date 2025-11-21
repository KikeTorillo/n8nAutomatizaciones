import { useState } from 'react';
import { FileBarChart, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useKardex } from '@/hooks/useInventario';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Modal para visualizar el kardex detallado de un producto
 */
function KardexModal({ isOpen, onClose, producto }) {
  const [filtros, setFiltros] = useState({
    tipo_movimiento: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  // Query
  const { data: kardexData, isLoading } = useKardex(
    producto?.id,
    filtros,
    { enabled: isOpen && !!producto }
  );
  const kardex = kardexData?.kardex || [];
  const productoInfo = kardexData?.producto || producto;

  // Handlers
  const handleExportarCSV = () => {
    if (kardex.length === 0) return;

    const headers = ['Fecha', 'Tipo', 'Cantidad', 'Stock Resultante', 'Costo', 'Referencia', 'Motivo'];
    const rows = kardex.map((mov) => [
      format(new Date(mov.creado_en), 'dd/MM/yyyy HH:mm', { locale: es }),
      mov.tipo_movimiento,
      mov.cantidad,
      mov.stock_resultante,
      mov.costo_unitario || '',
      mov.referencia || '',
      mov.motivo || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kardex_${producto?.nombre?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Helpers
  const getTipoMovimientoColor = (tipo) => {
    if (tipo.startsWith('entrada')) {
      return 'text-green-600 bg-green-100';
    }
    return 'text-red-600 bg-red-100';
  };

  const getTipoMovimientoLabel = (tipo) => {
    const labels = {
      entrada_compra: 'Entrada - Compra',
      entrada_devolucion: 'Entrada - Devolución',
      entrada_ajuste: 'Entrada - Ajuste',
      salida_venta: 'Salida - Venta',
      salida_uso_servicio: 'Salida - Uso en Servicio',
      salida_merma: 'Salida - Merma',
      salida_robo: 'Salida - Robo',
      salida_devolucion: 'Salida - Devolución',
      salida_ajuste: 'Salida - Ajuste',
    };
    return labels[tipo] || tipo;
  };

  if (!producto) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kardex - ${productoInfo?.nombre || ''}`}
      size="4xl"
    >
      <div className="space-y-6">
        {/* Información del Producto */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-600">Producto:</span>
              <p className="text-sm font-medium text-gray-900">{productoInfo?.nombre}</p>
            </div>
            {productoInfo?.sku && (
              <div>
                <span className="text-sm text-gray-600">SKU:</span>
                <p className="text-sm font-medium text-gray-900">{productoInfo.sku}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-600">Stock Actual:</span>
              <p className="text-lg font-bold text-indigo-600">
                {productoInfo?.stock_actual || 0} {productoInfo?.unidad_medida || 'unid'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Rango:</span>
              <p className="text-sm text-gray-900">
                Min: {productoInfo?.stock_minimo || 0} | Max: {productoInfo?.stock_maximo || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Filtros</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tipo de Movimiento</label>
              <select
                value={filtros.tipo_movimiento}
                onChange={(e) => setFiltros({ ...filtros, tipo_movimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <optgroup label="Entradas">
                  <option value="entrada_compra">Compra</option>
                  <option value="entrada_devolucion">Devolución</option>
                  <option value="entrada_ajuste">Ajuste</option>
                </optgroup>
                <optgroup label="Salidas">
                  <option value="salida_venta">Venta</option>
                  <option value="salida_uso_servicio">Uso en Servicio</option>
                  <option value="salida_merma">Merma</option>
                  <option value="salida_robo">Robo</option>
                  <option value="salida_devolucion">Devolución</option>
                  <option value="salida_ajuste">Ajuste</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFiltros({ tipo_movimiento: '', fecha_desde: '', fecha_hasta: '' })}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>

        {/* Tabla de Movimientos */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Cargando kardex...</span>
            </div>
          ) : kardex.length === 0 ? (
            <div className="text-center py-12">
              <FileBarChart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay movimientos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron movimientos con los filtros aplicados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Costo Unit.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {kardex.map((movimiento, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {/* Fecha */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(movimiento.creado_en), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(movimiento.creado_en), 'HH:mm', { locale: es })}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoMovimientoColor(
                            movimiento.tipo_movimiento
                          )}`}
                        >
                          {getTipoMovimientoLabel(movimiento.tipo_movimiento)}
                        </span>
                      </td>

                      {/* Cantidad */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {movimiento.cantidad > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              movimiento.cantidad > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {movimiento.cantidad > 0 ? '+' : ''}
                            {movimiento.cantidad}
                          </span>
                        </div>
                      </td>

                      {/* Stock Resultante */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-indigo-600">
                          {movimiento.stock_resultante}
                        </span>
                      </td>

                      {/* Costo Unitario */}
                      <td className="px-4 py-3 text-right">
                        {movimiento.costo_unitario ? (
                          <span className="text-sm text-gray-900">
                            ${movimiento.costo_unitario.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      {/* Referencia */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {movimiento.referencia || '-'}
                        </span>
                      </td>

                      {/* Motivo */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {movimiento.motivo || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="secondary"
            onClick={handleExportarCSV}
            icon={Download}
            disabled={kardex.length === 0}
          >
            Exportar CSV
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default KardexModal;
