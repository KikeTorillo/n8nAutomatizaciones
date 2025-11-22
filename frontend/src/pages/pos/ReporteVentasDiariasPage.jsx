import { useState } from 'react';
import { BarChart3, Calendar, DollarSign, Package, TrendingUp, Download, Receipt } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useVentasDiarias } from '@/hooks/useVentas';

/**
 * Página de Reporte de Ventas Diarias
 * Muestra análisis detallado de ventas de un día específico
 */
export default function ReporteVentasDiariasPage() {
  const toast = useToast();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    fecha: new Date().toISOString().split('T')[0], // Hoy
    profesional_id: '',
    usuario_id: '',
  });

  // Query
  const { data: reporteData, isLoading, isError } = useVentasDiarias(filtros);
  const resumen = reporteData?.resumen || {};
  const ventasPorHora = reporteData?.ventas_por_hora || [];
  const topProductos = reporteData?.top_productos || [];
  const detalle = reporteData?.detalle || [];

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleExportarExcel = () => {
    toast.info('Funcionalidad de exportación Excel en desarrollo');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Reporte de Ventas Diarias
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Análisis detallado de ventas por día
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportarExcel}
          icon={Download}
          disabled={!reporteData}
        >
          Exportar Excel
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => handleFiltroChange('fecha', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profesional (Opcional)
            </label>
            <input
              type="text"
              value={filtros.profesional_id}
              onChange={(e) => handleFiltroChange('profesional_id', e.target.value)}
              placeholder="ID del profesional"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario (Opcional)
            </label>
            <input
              type="text"
              value={filtros.usuario_id}
              onChange={(e) => handleFiltroChange('usuario_id', e.target.value)}
              placeholder="ID del usuario"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando reporte...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-red-600">
          <p>Error al cargar el reporte. Verifica la fecha seleccionada.</p>
        </div>
      ) : !reporteData ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Selecciona una fecha para generar el reporte</p>
        </div>
      ) : (
        <>
          {/* Cards de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ventas del Día</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {resumen.total_ventas || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ingresos</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ${parseFloat(resumen.total_ingresos || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${parseFloat(resumen.ticket_promedio || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Items Vendidos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {resumen.total_items_vendidos || 0}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráfica de ventas por hora */}
          {ventasPorHora.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Ventas por Hora
                </h2>
              </div>
              <div className="p-6">
                {/* Gráfica de barras simple */}
                <div className="space-y-3">
                  {ventasPorHora.map((hora) => {
                    const maxTotal = Math.max(...ventasPorHora.map((h) => parseFloat(h.total || 0)));
                    const porcentaje = maxTotal > 0 ? (parseFloat(hora.total || 0) / maxTotal) * 100 : 0;

                    return (
                      <div key={hora.hora} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{hora.hora}:00 hrs</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">{hora.cantidad_ventas} ventas</span>
                            <span className="font-semibold text-gray-900 w-24 text-right">
                              ${parseFloat(hora.total || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tabla detallada */}
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Hora
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Ventas
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Promedio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ventasPorHora.map((hora) => (
                        <tr key={hora.hora}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {hora.hora}:00 hrs
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {hora.cantidad_ventas}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            ${parseFloat(hora.total || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            $
                            {hora.cantidad_ventas > 0
                              ? (parseFloat(hora.total || 0) / hora.cantidad_ventas).toFixed(2)
                              : '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Top productos */}
          {topProductos.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Productos Más Vendidos del Día
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topProductos.map((producto, index) => (
                        <tr
                          key={producto.producto_id}
                          className={index < 3 ? 'bg-orange-50' : ''}
                        >
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>
                              <p className="font-medium">{producto.producto_nombre}</p>
                              {producto.producto_sku && (
                                <p className="text-xs text-gray-500">
                                  SKU: {producto.producto_sku}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                            {producto.cantidad_vendida}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            ${parseFloat(producto.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Detalle de ventas */}
          {detalle.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-gray-600" />
                  Detalle de Ventas del Día
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Folio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Método Pago
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detalle.map((venta) => (
                        <tr key={venta.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {venta.folio}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(venta.fecha_venta).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {venta.cliente_nombre || 'Venta directa'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {venta.metodo_pago}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            ${parseFloat(venta.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
