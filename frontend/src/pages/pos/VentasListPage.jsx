import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Receipt, Eye, XCircle, RefreshCw, Filter, Search, Calendar, DollarSign, FileSpreadsheet, TrendingUp, Package } from 'lucide-react';
import {
  BackButton,
  Button,
  Input,
  Select,
  StatCardGrid
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useExportCSV } from '@/hooks/useExportCSV';
import { useModalManager } from '@/hooks/useModalManager';
import { useVentas } from '@/hooks/useVentas';
import VentaDetalleModal from '@/components/pos/VentaDetalleModal';
import CancelarVentaModal from '@/components/pos/CancelarVentaModal';
import DevolverItemsModal from '@/components/pos/DevolverItemsModal';
import POSNavTabs from '@/components/pos/POSNavTabs';

/**
 * Página de lista de ventas POS con filtros
 * Permite ver, cancelar y procesar devoluciones
 */
export default function VentasListPage() {
  const toast = useToast();
  const { exportCSV } = useExportCSV();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    estado_pago: '',
    metodo_pago: '',
    tipo_venta: '',
    fecha_desde: '',
    fecha_hasta: '',
    limit: 50,
    offset: 0,
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de modales centralizados con useModalManager
  const {
    openModal,
    closeModal,
    isOpen,
    getModalData,
  } = useModalManager({
    detalle: { isOpen: false, data: null },
    cancelar: { isOpen: false, data: null },
    devolver: { isOpen: false, data: null },
  });

  // Query
  const { data: ventasData, isLoading } = useVentas(filtros);
  const ventas = ventasData?.ventas || [];
  const total = ventasData?.totales?.total_ventas || ventas.length;

  // Calcular métricas desde los datos
  const metricas = useMemo(() => {
    const ventasCompletadas = ventas.filter((v) => v.estado === 'completada');
    const totalIngresos = ventasCompletadas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const ticketPromedio = ventasCompletadas.length > 0 ? totalIngresos / ventasCompletadas.length : 0;
    const ventasCanceladas = ventas.filter((v) => v.estado === 'cancelada').length;

    return {
      totalVentas: ventas.length,
      totalIngresos,
      ticketPromedio,
      ventasCanceladas,
    };
  }, [ventas]);

  // Configuración de StatCards
  const statsConfig = useMemo(() => [
    { key: 'total', icon: Receipt, label: 'Total Ventas', value: metricas.totalVentas, color: 'primary' },
    { key: 'ingresos', icon: DollarSign, label: 'Ingresos', value: `$${metricas.totalIngresos.toFixed(2)}`, color: 'green' },
    { key: 'ticket', icon: TrendingUp, label: 'Ticket Promedio', value: `$${metricas.ticketPromedio.toFixed(2)}`, color: 'blue' },
    { key: 'canceladas', icon: XCircle, label: 'Canceladas', value: metricas.ventasCanceladas, color: 'red' },
  ], [metricas]);

  // Handler para exportar CSV usando hook centralizado
  const handleExportarCSV = () => {
    const datosExportar = ventas.map((v) => ({
      folio: v.folio || '',
      fecha: v.fecha_venta ? format(new Date(v.fecha_venta), 'dd/MM/yyyy HH:mm') : '',
      cliente: v.cliente_nombre || 'Venta directa',
      total: `$${parseFloat(v.total || 0).toFixed(2)}`,
      metodo_pago: formatearMetodoPago(v.metodo_pago),
      estado: v.estado || '',
      estado_pago: v.estado_pago || '',
    }));

    exportCSV(datosExportar, [
      { key: 'folio', header: 'Folio' },
      { key: 'fecha', header: 'Fecha' },
      { key: 'cliente', header: 'Cliente' },
      { key: 'total', header: 'Total' },
      { key: 'metodo_pago', header: 'Método Pago' },
      { key: 'estado', header: 'Estado' },
      { key: 'estado_pago', header: 'Estado Pago' },
    ], `ventas_${format(new Date(), 'yyyyMMdd_HHmm')}`);
  };

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor, offset: 0 }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: '',
      estado_pago: '',
      metodo_pago: '',
      tipo_venta: '',
      fecha_desde: '',
      fecha_hasta: '',
      limit: 50,
      offset: 0,
    });
  };

  // Handlers de acciones usando useModalManager
  const handleVerDetalle = (ventaId) => {
    openModal('detalle', { id: ventaId });
  };

  const handleCancelar = (venta) => {
    if (venta.estado === 'cancelada') {
      toast.error('Esta venta ya está cancelada');
      return;
    }
    openModal('cancelar', venta);
  };

  const handleDevolver = (venta) => {
    if (venta.estado === 'cancelada') {
      toast.error('No se pueden devolver items de una venta cancelada');
      return;
    }
    if (venta.estado === 'devolucion_total') {
      toast.error('Esta venta ya tiene devolución total');
      return;
    }
    openModal('devolver', venta);
  };

  // Helpers de visualización
  const getBadgeEstado = (estado) => {
    const badges = {
      cotizacion: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      apartado: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      completada: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      cancelada: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
      devolucion_parcial: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
      devolucion_total: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    };
    return badges[estado] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  const getBadgeEstadoPago = (estadoPago) => {
    const badges = {
      pendiente: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      pagado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      parcial: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
      cancelado: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    };
    return badges[estadoPago] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              Historial de Ventas
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Consulta y gestiona las ventas realizadas
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExportarCSV}
              disabled={!ventas?.length}
              aria-label="Exportar ventas a CSV"
            >
              <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            <Button
              variant={mostrarFiltros ? 'primary' : 'outline'}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
              <Filter className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros</span>
              <span className="sm:hidden">Filtros</span>
            </Button>
          </div>
        </div>

        {/* Métricas rápidas */}
        <StatCardGrid stats={statsConfig} columns={4} />

      {/* Panel de filtros */}
      {mostrarFiltros && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda por folio */}
            <Input
              label="Buscar por folio"
              type="text"
              value={filtros.busqueda}
              onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
              placeholder="POS-2025-0001"
            />

            {/* Estado */}
            <Select
              label="Estado"
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              placeholder="Todos"
              options={[
                { value: 'cotizacion', label: 'Cotización' },
                { value: 'apartado', label: 'Apartado' },
                { value: 'completada', label: 'Completada' },
                { value: 'cancelada', label: 'Cancelada' },
                { value: 'devolucion_parcial', label: 'Devolución Parcial' },
                { value: 'devolucion_total', label: 'Devolución Total' },
              ]}
            />

            {/* Estado de pago */}
            <Select
              label="Estado de Pago"
              value={filtros.estado_pago}
              onChange={(e) => handleFiltroChange('estado_pago', e.target.value)}
              placeholder="Todos"
              options={[
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'pagado', label: 'Pagado' },
                { value: 'parcial', label: 'Parcial' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />

            {/* Método de pago */}
            <Select
              label="Método de Pago"
              value={filtros.metodo_pago}
              onChange={(e) => handleFiltroChange('metodo_pago', e.target.value)}
              placeholder="Todos"
              options={[
                { value: 'efectivo', label: 'Efectivo' },
                { value: 'tarjeta', label: 'Tarjeta' },
                { value: 'transferencia', label: 'Transferencia' },
                { value: 'qr', label: 'QR Mercado Pago' },
                { value: 'mixto', label: 'Mixto' },
              ]}
            />

            {/* Fecha desde */}
            <Input
              label="Fecha Desde"
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
            />

            {/* Fecha hasta */}
            <Input
              label="Fecha Hasta"
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
            />

            {/* Tipo de venta */}
            <Select
              label="Tipo de Venta"
              value={filtros.tipo_venta}
              onChange={(e) => handleFiltroChange('tipo_venta', e.target.value)}
              placeholder="Todos"
              options={[
                { value: 'directa', label: 'Directa' },
                { value: 'cita', label: 'Cita' },
                { value: 'apartado', label: 'Apartado' },
                { value: 'cotizacion', label: 'Cotización' },
              ]}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleLimpiarFiltros}>
              Limpiar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Tabla de ventas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            Cargando ventas...
          </div>
        ) : ventas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron ventas</p>
            <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Folio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Método Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado Pago
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {ventas.map((venta) => (
                    <tr key={venta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{venta.folio}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(venta.fecha_venta).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {venta.cliente_nombre || 'Venta directa'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          ${parseFloat(venta.total || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatearMetodoPago(venta.metodo_pago)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeEstado(
                            venta.estado
                          )}`}
                        >
                          {venta.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeEstadoPago(
                            venta.estado_pago
                          )}`}
                        >
                          {venta.estado_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleVerDetalle(venta.id)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                            title="Ver detalle"
                            aria-label={`Ver detalle de venta ${venta.folio}`}
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {venta.estado !== 'cancelada' && venta.estado !== 'devolucion_total' && (
                            <>
                              <button
                                onClick={() => handleDevolver(venta)}
                                className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300"
                                title="Procesar devolución"
                                aria-label={`Procesar devolución de venta ${venta.folio}`}
                              >
                                <RefreshCw className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleCancelar(venta)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                title="Cancelar venta"
                                aria-label={`Cancelar venta ${venta.folio}`}
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando <span className="font-medium">{ventas.length}</span> de{' '}
                  <span className="font-medium">{total}</span> ventas
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      {/* Modales usando useModalManager */}
      <VentaDetalleModal
        isOpen={isOpen('detalle')}
        onClose={() => closeModal('detalle')}
        ventaId={getModalData('detalle')?.id}
      />

      <CancelarVentaModal
        isOpen={isOpen('cancelar')}
        onClose={() => closeModal('cancelar')}
        venta={getModalData('cancelar')}
      />

      <DevolverItemsModal
        isOpen={isOpen('devolver')}
        onClose={() => closeModal('devolver')}
        venta={getModalData('devolver')}
      />
    </div>
  );
}
