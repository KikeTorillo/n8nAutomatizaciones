import { useState } from 'react';
import {
  Search, X, RefreshCw, Package, AlertTriangle, Clock,
  CheckCircle, XCircle, Eye, History,
  BarChart3
} from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import StatCardGrid from '@/components/ui/StatCardGrid';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
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
  const getEstadoBadge = (estado) => {
    const config = ESTADOS_NUMERO_SERIE[estado] || { label: estado, color: 'gray' };
    const colorClasses = {
      green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona productos, proveedores y stock
        </p>

        <InventarioNavTabs activeTab="numeros-serie" />
      </div>

      {/* Contenido */}
      <div className="p-6">
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
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200 font-medium mb-2">
              <AlertTriangle size={20} />
              {proximosVencer.length} productos por vencer en los proximos 30 dias
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">
              {proximosVencer.slice(0, 3).map((item, idx) => (
                <span key={item.id}>
                  {item.producto_nombre} ({item.numero_serie})
                  {idx < Math.min(2, proximosVencer.length - 1) ? ', ' : ''}
                </span>
              ))}
              {proximosVencer.length > 3 && ` y ${proximosVencer.length - 3} mas...`}
            </div>
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
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Cargando...
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
                          {getEstadoBadge(ns.estado)}
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
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleVerHistorial(ns.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Ver historial"
                            >
                              <History size={16} />
                            </button>
                            {ns.estado === 'disponible' && (
                              <button
                                onClick={() => handleAbrirDefectuoso(ns.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                title="Marcar defectuoso"
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
                <p>{getEstadoBadge(detalleNumeroSerie.estado)}</p>
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
    </div>
  );
}

export default NumerosSeriesPage;
