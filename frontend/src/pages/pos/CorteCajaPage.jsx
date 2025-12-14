import { useState } from 'react';
import { DollarSign, Calendar, TrendingUp, CreditCard, Package, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { useCorteCaja } from '@/hooks/useVentas';
import POSNavTabs from '@/components/pos/POSNavTabs';

/**
 * Página de Corte de Caja
 * Muestra resumen de ventas por período con totales por método de pago
 */
export default function CorteCajaPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0], // Hoy
    fecha_fin: new Date().toISOString().split('T')[0], // Hoy
    usuario_id: '',
  });

  // Query
  const { data: corteData, isLoading, isError } = useCorteCaja(filtros);
  const resumen = corteData?.resumen_general || {};
  const totalesPorMetodo = corteData?.totales_por_metodo_pago || [];
  const ventasPorHora = corteData?.ventas_por_hora || [];
  const topProductos = corteData?.top_productos || [];

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleExportarPDF = () => {
    toast.info('Funcionalidad de exportación PDF en desarrollo');
  };

  const formatearMetodoPago = (metodo) => {
    const metodos = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      qr: 'QR Mercado Pago',
      mixto: 'Mixto',
    };
    return metodos[metodo] || metodo;
  };

  const getColorMetodoPago = (metodo) => {
    const colores = {
      efectivo: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      tarjeta: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300',
      transferencia: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
      qr: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300',
      mixto: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
    };
    return colores[metodo] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/home')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Inicio
        </Button>

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
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              Corte de Caja
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Resumen de ventas y totales por método de pago
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleExportarPDF}
            icon={Download}
            disabled={!corteData}
          >
            Exportar PDF
          </Button>
        </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha Inicio"
            type="date"
            value={filtros.fecha_inicio}
            onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
            required
          />

          <Input
            label="Fecha Fin"
            type="date"
            value={filtros.fecha_fin}
            onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
            required
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Cargando corte de caja...</p>
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-red-600 dark:text-red-400">
          <p>Error al cargar el corte de caja. Verifica las fechas seleccionadas.</p>
        </div>
      ) : !corteData ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium">Selecciona un período para generar el corte</p>
        </div>
      ) : (
        <>
          {/* Cards de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Ventas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {resumen.total_ventas || 0}
                  </p>
                </div>
                <div className="bg-primary-100 dark:bg-primary-900/40 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Ingresos</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    ${parseFloat(resumen.total_ingresos || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    ${parseFloat(resumen.ticket_promedio || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Items Vendidos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {resumen.total_items_vendidos || 0}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Totales por método de pago */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                Totales por Método de Pago
              </h2>
            </div>
            <div className="p-6">
              {totalesPorMetodo.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No hay ventas registradas en este período
                </p>
              ) : (
                <div className="space-y-3">
                  {totalesPorMetodo.map((metodo) => (
                    <div
                      key={metodo.metodo_pago}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getColorMetodoPago(
                            metodo.metodo_pago
                          )}`}
                        >
                          {formatearMetodoPago(metodo.metodo_pago)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {metodo.total_ventas} venta{parseInt(metodo.total_ventas) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          ${parseFloat(metodo.total_monto || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {((parseFloat(metodo.total_monto || 0) / parseFloat(resumen.total_ingresos || 1)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ventas por hora */}
          {ventasPorHora.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  Ventas por Hora
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
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
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {ventasPorHora.map((hora) => (
                        <tr key={hora.hora}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {hora.hora}:00 hrs
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100">
                            {hora.total_ventas}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                            ${parseFloat(hora.total_monto || 0).toFixed(2)}
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
                  Productos Más Vendidos
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Cantidad Vendida
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {topProductos.map((producto, index) => (
                        <tr key={`${producto.nombre_producto}-${index}`} className={index < 3 ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            <div>
                              <p className="font-medium">{producto.nombre_producto}</p>
                              {producto.sku && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {producto.sku}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-gray-100">
                            {producto.unidades_vendidas}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                            ${parseFloat(producto.total_ventas || 0).toFixed(2)}
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
