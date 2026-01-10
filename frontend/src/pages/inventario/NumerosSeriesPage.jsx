import { useState } from 'react';
import {
  Search, X, RefreshCw, Package, AlertTriangle, Clock,
  CheckCircle, XCircle, Eye, History, BarChart3, FileSpreadsheet
} from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import StatCardGrid from '@/components/ui/StatCardGrid';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useNumerosSerie,
  useBuscarNumeroSerie,
  useNumeroSerie,
  useHistorialNumeroSerie,
  useEstadisticasNumerosSerie,
  useProximosVencer,
  useMarcarDefectuoso,
  ESTADOS_NUMERO_SERIE,
  ACCIONES_HISTORIAL,
  formatearFechaVencimiento,
} from '@/hooks/useNumerosSerie';
import { useSucursales } from '@/hooks/useSucursales';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Pagina de Numeros de Serie / Lotes
 * Gap Media Prioridad - Dic 2025
 */
function NumerosSeriesPage() {
  const { showToast } = useToast();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    estado: '',
    sucursal_id: '',
    busqueda: '',
    page: 1,
    limit: 20,
  });

  // Estado de modales unificado
  const { isOpen, getModalData, openModal, closeModal } = useModalManager();
  const [motivoDefectuoso, setMotivoDefectuoso] = useState('');

  // Queries
  const { data: numerosSerieData, isLoading, refetch } = useNumerosSerie(filtros);
  const numerosSerie = numerosSerieData?.data || [];
  const pagination = numerosSerieData?.pagination || { total: 0, totalPages: 1 };

  const { data: estadisticas } = useEstadisticasNumerosSerie();
  const { data: proximosVencer } = useProximosVencer(30);
  const { data: sucursalesData } = useSucursales();
  const sucursales = sucursalesData?.sucursales || [];

  // Obtener ID seleccionado de cualquier modal
  const selectedId = getModalData('detalle')?.id || getModalData('historial')?.id || getModalData('defectuoso')?.id;
  const { data: detalleNumeroSerie } = useNumeroSerie(selectedId);
  const { data: historial } = useHistorialNumeroSerie(selectedId);

  // Mutations
  const marcarDefectuosoMutation = useMarcarDefectuoso();

  // Handlers
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor, page: 1 }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      estado: '',
      sucursal_id: '',
      busqueda: '',
      page: 1,
      limit: 20,
    });
  };

  const handleVerDetalle = (id) => {
    openModal('detalle', { id });
  };

  const handleVerHistorial = (id) => {
    openModal('historial', { id });
  };

  const handleAbrirDefectuoso = (id) => {
    openModal('defectuoso', { id });
  };

  const handleMarcarDefectuoso = async () => {
    if (!motivoDefectuoso.trim()) {
      showToast('Ingresa un motivo', 'error');
      return;
    }

    const { id } = getModalData('defectuoso');
    try {
      await marcarDefectuosoMutation.mutateAsync({
        id,
        motivo: motivoDefectuoso,
      });
      showToast('Marcado como defectuoso', 'success');
      closeModal('defectuoso');
      setMotivoDefectuoso('');
      refetch();
    } catch (error) {
      showToast(error.message || 'Error al procesar', 'error');
    }
  };

  const handlePageChange = (newPage) => {
    setFiltros(prev => ({ ...prev, page: newPage }));
  };

  // Helpers
  const ESTADO_NS_VARIANT = {
    disponible: 'success',
    reservado: 'warning',
    vendido: 'info',
    devuelto: 'default',
    dañado: 'error',
    defectuoso: 'error',
  };

  const getEstadoLabel = (estado) => {
    return ESTADOS_NUMERO_SERIE[estado]?.label || estado;
  };

  // Exportar CSV
  const handleExportarCSV = () => {
    if (!numerosSerie || numerosSerie.length === 0) {
      showToast('No hay datos para exportar', 'warning');
      return;
    }

    try {
      const headers = ['Número Serie', 'Producto', 'SKU', 'Lote', 'Estado', 'Vencimiento', 'Sucursal', 'Costo'];

      const rows = numerosSerie.map(ns => [
        ns.numero_serie || '',
        ns.producto_nombre || '',
        ns.producto_sku || '',
        ns.lote || '',
        getEstadoLabel(ns.estado),
        ns.fecha_vencimiento ? format(new Date(ns.fecha_vencimiento), 'dd/MM/yyyy') : '',
        ns.sucursal_nombre || '',
        parseFloat(ns.costo || 0).toFixed(2)
      ]);

      const BOM = '\uFEFF';
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `numeros_serie_${format(new Date(), 'yyyyMMdd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      showToast('Números de serie exportados exitosamente', 'success');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      showToast('Error al exportar CSV', 'error');
    }
  };

  return (
    <InventarioPageLayout
      icon={Package}
      title="Números de Serie / Lotes"
      subtitle={`${pagination.total} registros en total`}
      actions={
        <Button
          variant="secondary"
          onClick={handleExportarCSV}
          disabled={numerosSerie.length === 0}
          icon={FileSpreadsheet}
        >
          Exportar CSV
        </Button>
      }
    >
        {/* Estadisticas */}
        {estadisticas && (
          <StatCardGrid
            columns={4}
            className="lg:grid-cols-8"
            stats={[
              { icon: BarChart3, label: 'Total', value: estadisticas.total_registrados || 0 },
              { icon: CheckCircle, label: 'Disponibles', value: estadisticas.disponibles || 0, color: 'green' },
              { icon: Clock, label: 'Reservados', value: estadisticas.reservados || 0, color: 'yellow' },
              { icon: Package, label: 'Vendidos', value: estadisticas.vendidos || 0, color: 'blue' },
              { icon: XCircle, label: 'Defectuosos', value: estadisticas.defectuosos || 0, color: 'red' },
              { icon: History, label: 'Devueltos', value: estadisticas.devueltos || 0, color: 'purple' },
              { icon: AlertTriangle, label: 'Por Vencer', value: estadisticas.proximos_vencer_30d || 0, color: 'yellow' },
              { icon: XCircle, label: 'Vencidos', value: estadisticas.vencidos || 0, color: 'red' },
            ]}
          />
        )}

        {/* Alerta de proximos a vencer */}
        {proximosVencer && proximosVencer.length > 0 && (
          <div className="mb-6">
            <Alert
              variant="warning"
              icon={AlertTriangle}
              title={`${proximosVencer.length} productos por vencer en los próximos 30 días`}
            >
              <p className="text-sm">
                {proximosVencer.slice(0, 3).map((item, idx) => (
                  <span key={item.id}>
                    {item.producto_nombre} ({item.numero_serie})
                    {idx < Math.min(2, proximosVencer.length - 1) ? ', ' : ''}
                  </span>
                ))}
                {proximosVencer.length > 3 && ` y ${proximosVencer.length - 3} más...`}
              </p>
            </Alert>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Buscar por NS, lote, producto..."
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              className="w-40"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_NUMERO_SERIE).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>

            <Select
              value={filtros.sucursal_id}
              onChange={(e) => handleFiltroChange('sucursal_id', e.target.value)}
              className="w-40"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </Select>

            <Button variant="ghost" size="sm" onClick={handleLimpiarFiltros}>
              <X size={16} />
              Limpiar
            </Button>

            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Numero de Serie
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Lote
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sucursal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Costo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <SkeletonTable rows={5} columns={8} />
                    </td>
                  </tr>
                ) : numerosSerie.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8">
                      <EmptyState
                        icon={Package}
                        title="No se encontraron números de serie"
                        description="No hay números de serie que coincidan con los filtros aplicados"
                      />
                    </td>
                  </tr>
                ) : (
                  numerosSerie.map((ns) => {
                    const vencimiento = formatearFechaVencimiento(ns.fecha_vencimiento);
                    return (
                      <tr key={ns.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                            {ns.numero_serie}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{ns.producto_nombre}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{ns.producto_sku}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {ns.lote || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ESTADO_NS_VARIANT[ns.estado] || 'default'} size="sm">
                            {getEstadoLabel(ns.estado)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {ns.fecha_vencimiento ? (
                            <span className={
                              vencimiento.status === 'error' ? 'text-red-600 dark:text-red-400' :
                              vencimiento.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-gray-600 dark:text-gray-300'
                            }>
                              {vencimiento.text}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {ns.sucursal_nombre || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {ns.costo_unitario ? `$${Number(ns.costo_unitario).toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleVerDetalle(ns.id)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                              title="Ver detalle"
                              aria-label="Ver detalle del número de serie"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleVerHistorial(ns.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Ver historial"
                              aria-label="Ver historial de movimientos"
                            >
                              <History size={16} />
                            </button>
                            {ns.estado === 'disponible' && (
                              <button
                                onClick={() => handleAbrirDefectuoso(ns.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                title="Marcar defectuoso"
                                aria-label="Marcar como defectuoso"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginacion */}
          {pagination.totalPages > 1 && (
            <div className="px-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                pagination={{
                  page: filtros.page,
                  limit: filtros.limit,
                  total: pagination.total,
                  totalPages: pagination.totalPages,
                  hasNext: filtros.page < pagination.totalPages,
                  hasPrev: filtros.page > 1,
                }}
                onPageChange={handlePageChange}
                size="sm"
              />
            </div>
          )}
        </div>

      {/* Modal Detalle */}
      <Modal
        isOpen={isOpen('detalle')}
        onClose={() => closeModal('detalle')}
        title="Detalle del Numero de Serie"
        size="lg"
      >
        {detalleNumeroSerie && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Numero de Serie</label>
                <p className="font-mono font-medium">{detalleNumeroSerie.numero_serie}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Estado</label>
                <p>
                  <Badge variant={ESTADO_NS_VARIANT[detalleNumeroSerie.estado] || 'default'} size="sm">
                    {getEstadoLabel(detalleNumeroSerie.estado)}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Producto</label>
                <p>{detalleNumeroSerie.producto_nombre}</p>
                <p className="text-xs text-gray-500">{detalleNumeroSerie.producto_sku}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Lote</label>
                <p>{detalleNumeroSerie.lote || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Fecha Vencimiento</label>
                <p>{detalleNumeroSerie.fecha_vencimiento ?
                  format(new Date(detalleNumeroSerie.fecha_vencimiento), 'dd/MM/yyyy', { locale: es }) : '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Costo Unitario</label>
                <p>{detalleNumeroSerie.costo_unitario ? `$${Number(detalleNumeroSerie.costo_unitario).toFixed(2)}` : '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Sucursal</label>
                <p>{detalleNumeroSerie.sucursal_nombre || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Ubicacion</label>
                <p>{detalleNumeroSerie.ubicacion_codigo || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Proveedor</label>
                <p>{detalleNumeroSerie.proveedor_nombre || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Fecha Entrada</label>
                <p>{detalleNumeroSerie.fecha_entrada ?
                  format(new Date(detalleNumeroSerie.fecha_entrada), 'dd/MM/yyyy HH:mm', { locale: es }) : '-'}</p>
              </div>
              {detalleNumeroSerie.cliente_nombre && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Cliente</label>
                  <p>{detalleNumeroSerie.cliente_nombre}</p>
                </div>
              )}
              {detalleNumeroSerie.fecha_salida && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Fecha Salida</label>
                  <p>{format(new Date(detalleNumeroSerie.fecha_salida), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                </div>
              )}
            </div>
            {detalleNumeroSerie.tiene_garantia && (
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="font-medium mb-2">Garantia</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Inicio</label>
                    <p>{detalleNumeroSerie.fecha_inicio_garantia ?
                      format(new Date(detalleNumeroSerie.fecha_inicio_garantia), 'dd/MM/yyyy', { locale: es }) : '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Fin</label>
                    <p>{detalleNumeroSerie.fecha_fin_garantia ?
                      format(new Date(detalleNumeroSerie.fecha_fin_garantia), 'dd/MM/yyyy', { locale: es }) : '-'}</p>
                  </div>
                </div>
              </div>
            )}
            {detalleNumeroSerie.notas && (
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="font-medium mb-2">Notas</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{detalleNumeroSerie.notas}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Historial */}
      <Modal
        isOpen={isOpen('historial')}
        onClose={() => closeModal('historial')}
        title="Historial de Movimientos"
        size="lg"
      >
        {historial && historial.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historial.map((item) => (
              <div key={item.id} className="border dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{item.accion.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(item.creado_en), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {item.estado_anterior && item.estado_nuevo && (
                    <p>Estado: {item.estado_anterior} → {item.estado_nuevo}</p>
                  )}
                  {item.sucursal_nueva && (
                    <p>Sucursal: {item.sucursal_anterior || 'N/A'} → {item.sucursal_nueva}</p>
                  )}
                  {item.usuario_nombre && <p>Usuario: {item.usuario_nombre}</p>}
                  {item.notas && <p>Notas: {item.notas}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Sin historial disponible</p>
        )}
      </Modal>

      {/* Modal Marcar Defectuoso */}
      <Modal
        isOpen={isOpen('defectuoso')}
        onClose={() => {
          closeModal('defectuoso');
          setMotivoDefectuoso('');
        }}
        title="Marcar como Defectuoso"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Esta accion marcara el numero de serie como defectuoso y ya no estara disponible para venta.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo *
            </label>
            <textarea
              value={motivoDefectuoso}
              onChange={(e) => setMotivoDefectuoso(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Describe el motivo del defecto..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                closeModal('defectuoso');
                setMotivoDefectuoso('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleMarcarDefectuoso}
              disabled={marcarDefectuosoMutation.isPending}
            >
              {marcarDefectuosoMutation.isPending ? 'Procesando...' : 'Marcar Defectuoso'}
            </Button>
          </div>
        </div>
      </Modal>
    </InventarioPageLayout>
  );
}

export default NumerosSeriesPage;
