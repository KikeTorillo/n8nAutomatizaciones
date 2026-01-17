import { useState, useMemo } from 'react';
import {
  RefreshCw, Package, AlertTriangle, Clock,
  CheckCircle, XCircle, Eye, History, BarChart3, FileSpreadsheet
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableActionButton,
  DataTableActions,
  FilterPanel,
  Modal,
  StatCardGrid
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useExportCSV } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';
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
} from '@/hooks/inventario';
import { useSucursales } from '@/hooks/sistema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Pagina de Numeros de Serie / Lotes
 * Gap Media Prioridad - Dic 2025
 */
function NumerosSeriesPage() {
  const { showToast } = useToast();
  const { exportCSV } = useExportCSV();

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

  // Configuración de filtros para FilterPanel
  const filterConfig = useMemo(() => [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: '', label: 'Todos los estados' },
        ...Object.entries(ESTADOS_NUMERO_SERIE).map(([key, { label }]) => ({
          value: key,
          label,
        })),
      ],
    },
    {
      key: 'sucursal_id',
      label: 'Sucursal',
      type: 'select',
      options: [
        { value: '', label: 'Todas las sucursales' },
        ...sucursales.map((s) => ({
          value: s.id.toString(),
          label: s.nombre,
        })),
      ],
    },
  ], [sucursales]);

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

  // Exportar CSV usando hook centralizado
  const handleExportarCSV = () => {
    if (!numerosSerie || numerosSerie.length === 0) {
      showToast('No hay datos para exportar', 'warning');
      return;
    }

    const datosExportar = numerosSerie.map((ns) => ({
      numero_serie: ns.numero_serie || '',
      producto: ns.producto_nombre || '',
      sku: ns.producto_sku || '',
      lote: ns.lote || '',
      estado: getEstadoLabel(ns.estado),
      vencimiento: ns.fecha_vencimiento ? format(new Date(ns.fecha_vencimiento), 'dd/MM/yyyy') : '',
      sucursal: ns.sucursal_nombre || '',
      costo: parseFloat(ns.costo || 0).toFixed(2),
    }));

    exportCSV(datosExportar, [
      { key: 'numero_serie', header: 'Número Serie' },
      { key: 'producto', header: 'Producto' },
      { key: 'sku', header: 'SKU' },
      { key: 'lote', header: 'Lote' },
      { key: 'estado', header: 'Estado' },
      { key: 'vencimiento', header: 'Vencimiento' },
      { key: 'sucursal', header: 'Sucursal' },
      { key: 'costo', header: 'Costo' },
    ], `numeros_serie_${format(new Date(), 'yyyyMMdd')}`);
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
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <FilterPanel
              filters={filtros}
              onFilterChange={handleFiltroChange}
              onClearFilters={handleLimpiarFiltros}
              searchKey="busqueda"
              searchPlaceholder="Buscar por NS, lote, producto..."
              filterConfig={filterConfig}
              defaultExpanded={false}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw size={16} />
          </Button>
        </div>

        {/* Tabla */}
        <DataTable
          columns={[
            {
              key: 'numero_serie',
              header: 'Número de Serie',
              width: 'lg',
              render: (row) => (
                <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                  {row.numero_serie}
                </div>
              ),
            },
            {
              key: 'producto',
              header: 'Producto',
              width: 'xl',
              render: (row) => (
                <div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{row.producto_nombre}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{row.producto_sku}</div>
                </div>
              ),
            },
            {
              key: 'lote',
              header: 'Lote',
              hideOnMobile: true,
              render: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {row.lote || '-'}
                </span>
              ),
            },
            {
              key: 'estado',
              header: 'Estado',
              align: 'center',
              render: (row) => (
                <Badge variant={ESTADO_NS_VARIANT[row.estado] || 'default'} size="sm">
                  {getEstadoLabel(row.estado)}
                </Badge>
              ),
            },
            {
              key: 'vencimiento',
              header: 'Vencimiento',
              hideOnMobile: true,
              render: (row) => {
                if (!row.fecha_vencimiento) return <span className="text-sm text-gray-400">-</span>;
                const vencimiento = formatearFechaVencimiento(row.fecha_vencimiento);
                return (
                  <span className={
                    vencimiento.status === 'error' ? 'text-sm text-red-600 dark:text-red-400' :
                    vencimiento.status === 'warning' ? 'text-sm text-yellow-600 dark:text-yellow-400' :
                    'text-sm text-gray-600 dark:text-gray-300'
                  }>
                    {vencimiento.text}
                  </span>
                );
              },
            },
            {
              key: 'sucursal',
              header: 'Sucursal',
              hideOnMobile: true,
              render: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {row.sucursal_nombre || '-'}
                </span>
              ),
            },
            {
              key: 'costo',
              header: 'Costo',
              hideOnMobile: true,
              align: 'right',
              render: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {row.costo_unitario ? `$${Number(row.costo_unitario).toFixed(2)}` : '-'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <DataTableActions>
                  <DataTableActionButton
                    icon={Eye}
                    label="Ver detalle"
                    onClick={() => handleVerDetalle(row.id)}
                    variant="primary"
                  />
                  <DataTableActionButton
                    icon={History}
                    label="Ver historial"
                    onClick={() => handleVerHistorial(row.id)}
                    variant="ghost"
                  />
                  {row.estado === 'disponible' && (
                    <DataTableActionButton
                      icon={XCircle}
                      label="Marcar defectuoso"
                      onClick={() => handleAbrirDefectuoso(row.id)}
                      variant="danger"
                    />
                  )}
                </DataTableActions>
              ),
            },
          ]}
          data={numerosSerie}
          isLoading={isLoading}
          emptyState={{
            icon: Package,
            title: 'No se encontraron números de serie',
            description: 'No hay números de serie que coincidan con los filtros aplicados',
          }}
          pagination={{
            page: filtros.page,
            limit: filtros.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
            hasNext: filtros.page < pagination.totalPages,
            hasPrev: filtros.page > 1,
          }}
          onPageChange={handlePageChange}
          skeletonRows={8}
        />

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
      <ConfirmDialog
        isOpen={isOpen('defectuoso')}
        onClose={() => {
          closeModal('defectuoso');
          setMotivoDefectuoso('');
        }}
        onConfirm={handleMarcarDefectuoso}
        title="Marcar como Defectuoso"
        message="Esta acción marcará el número de serie como defectuoso y ya no estará disponible para venta."
        confirmText="Marcar Defectuoso"
        variant="danger"
        isLoading={marcarDefectuosoMutation.isPending}
        disabled={!motivoDefectuoso.trim()}
        size="md"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Motivo (requerido)
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
      </ConfirmDialog>
    </InventarioPageLayout>
  );
}

export default NumerosSeriesPage;
