import { useState } from 'react';
import { BarChart3, Calendar, DollarSign, Package, TrendingUp, Download, Receipt } from 'lucide-react';
import {
  BackButton,
  Button,
  Input,
  StatCardGrid
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useVentasDiarias } from '@/hooks/pos';
import POSNavTabs from '@/components/pos/POSNavTabs';
import { exportarReporteVentasDiarias } from '@/utils/exportToExcel';

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
    try {
      exportarReporteVentasDiarias(
        {
          resumen,
          ventasPorHora,
          topProductos,
          detalle
        },
        filtros.fecha
      );
      toast.success('Reporte exportado correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar el reporte');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Punto de Venta</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona ventas, historial y reportes
        </p>
      </div>

      {/* Tabs de navegación POS */}
      <POSNavTabs />

      {/* Contenido */}
      <div className="p-6 space-y-6">
        {/* Header de sección */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              Reporte de Ventas Diarias
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha"
            type="date"
            value={filtros.fecha}
            onChange={(e) => handleFiltroChange('fecha', e.target.value)}
            required
          />

          <Input
            label="Profesional (Opcional)"
            type="text"
            value={filtros.profesional_id}
            onChange={(e) => handleFiltroChange('profesional_id', e.target.value)}
            placeholder="ID del profesional"
          />

          <Input
            label="Usuario (Opcional)"
            type="text"
            value={filtros.usuario_id}
            onChange={(e) => handleFiltroChange('usuario_id', e.target.value)}
            placeholder="ID del usuario"
          />
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Cargando reporte...</p>
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-red-600 dark:text-red-400">
          <p>Error al cargar el reporte. Verifica la fecha seleccionada.</p>
        </div>
      ) : !reporteData ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium">Selecciona una fecha para generar el reporte</p>
        </div>
      ) : (
        <>
          {/* Cards de resumen */}
          <StatCardGrid
            stats={[
              {
                key: 'ventas',
                icon: Receipt,
                label: 'Ventas del Día',
                value: resumen.total_ventas || 0,
                color: 'primary',
              },
              {
                key: 'ingresos',
                icon: DollarSign,
                label: 'Ingresos',
                value: `$${parseFloat(resumen.total_ingresos || 0).toFixed(2)}`,
                color: 'green',
              },
              {
                key: 'ticket',
                icon: TrendingUp,
                label: 'Ticket Promedio',
                value: `$${parseFloat(resumen.ticket_promedio || 0).toFixed(2)}`,
                color: 'purple',
              },
              {
                key: 'items',
                icon: Package,
                label: 'Items Vendidos',
                value: resumen.total_items_vendidos || 0,
                color: 'yellow',
              },
            ]}
            columns={4}
          />

          {/* Gráfica de ventas por hora */}
          {ventasPorHora.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
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
                          <span className="font-medium text-gray-700 dark:text-gray-300">{hora.hora}:00 hrs</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600 dark:text-gray-400">{hora.cantidad_ventas} ventas</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100 w-24 text-right">
                              ${parseFloat(hora.total || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tabla detallada */}
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Hora
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Ventas
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Promedio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {ventasPorHora.map((hora) => (
                        <tr key={hora.hora}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {hora.hora}:00 hrs
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100">
                            {hora.cantidad_ventas}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                            ${parseFloat(hora.total || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Productos Más Vendidos del Día
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {topProductos.map((producto, index) => (
                        <tr
                          key={producto.producto_id}
                          className={index < 3 ? 'bg-orange-50 dark:bg-orange-900/20' : ''}
                        >
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-100">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            <div>
                              <p className="font-medium">{producto.producto_nombre}</p>
                              {producto.producto_sku && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  SKU: {producto.producto_sku}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-gray-100">
                            {producto.cantidad_vendida}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Detalle de Ventas del Día
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Folio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Método Pago
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {detalle.map((venta) => (
                        <tr key={venta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {venta.folio}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {new Date(venta.fecha_venta).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {venta.cliente_nombre || 'Venta directa'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {venta.metodo_pago}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
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
    </div>
  );
}
