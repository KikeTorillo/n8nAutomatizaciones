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
      efectivo: 'bg-green-100 text-green-800',
      tarjeta: 'bg-blue-100 text-blue-800',
      transferencia: 'bg-purple-100 text-purple-800',
      qr: 'bg-cyan-100 text-cyan-800',
      mixto: 'bg-orange-100 text-orange-800',
    };
    return colores[metodo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Volver al Inicio</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
        <p className="mt-1 text-sm text-gray-500">
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
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Corte de Caja
            </h2>
            <p className="mt-1 text-sm text-gray-500">
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
      <div className="bg-white rounded-lg shadow p-4">
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
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando corte de caja...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-red-600">
          <p>Error al cargar el corte de caja. Verifica las fechas seleccionadas.</p>
        </div>
      ) : !corteData ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Selecciona un período para generar el corte</p>
        </div>
      ) : (
        <>
          {/* Cards de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Ventas</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {resumen.total_ventas || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Ingresos</p>
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

          {/* Totales por método de pago */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Totales por Método de Pago
              </h2>
            </div>
            <div className="p-6">
              {totalesPorMetodo.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No hay ventas registradas en este período
                </p>
              ) : (
                <div className="space-y-3">
                  {totalesPorMetodo.map((metodo) => (
                    <div
                      key={metodo.metodo_pago}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getColorMetodoPago(
                            metodo.metodo_pago
                          )}`}
                        >
                          {formatearMetodoPago(metodo.metodo_pago)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {metodo.total_ventas} venta{parseInt(metodo.total_ventas) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${parseFloat(metodo.total_monto || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
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
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Ventas por Hora
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ventasPorHora.map((hora) => (
                        <tr key={hora.hora}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {hora.hora}:00 hrs
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {hora.total_ventas}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
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
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Productos Más Vendidos
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Cantidad Vendida
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topProductos.map((producto, index) => (
                        <tr key={`${producto.nombre_producto}-${index}`} className={index < 3 ? 'bg-orange-50' : ''}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>
                              <p className="font-medium">{producto.nombre_producto}</p>
                              {producto.sku && (
                                <p className="text-xs text-gray-500">SKU: {producto.sku}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                            {producto.unidades_vendidas}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
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
