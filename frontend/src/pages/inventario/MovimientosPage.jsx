import { useMemo, useCallback } from 'react';
import { FileBarChart, TrendingUp, TrendingDown, ArrowLeftRight, FileSpreadsheet, MapPin } from 'lucide-react';
import { useModalManager, useToast, useExportCSV, useFilters } from '@/hooks/utils';
import {
  Badge,
  Button,
  DataTable,
  DataTableActionButton,
  DataTableActions,
  FilterPanel,
  Pagination
} from '@/components/ui';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import { useMovimientos, useProductos, useProveedores, useUbicacionesAlmacen } from '@/hooks/inventario';
import KardexModal from '@/components/inventario/KardexModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== CONSTANTES ====================

const ITEMS_PER_PAGE = 25;

const INITIAL_FILTERS = {
  tipo_movimiento: '',
  categoria: '',
  producto_id: '',
  proveedor_id: '',
  ubicacion_id: '', // Ene 2026: Filtro por ubicación
  fecha_desde: '',
  fecha_hasta: '',
  limit: ITEMS_PER_PAGE,
  offset: 0,
};

const TIPOS_MOVIMIENTO_LABELS = {
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

const TIPOS_MOVIMIENTO_OPTIONS = Object.entries(TIPOS_MOVIMIENTO_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ==================== HELPERS ====================

const getTipoMovimientoVariant = (tipo) => tipo?.startsWith('entrada') ? 'success' : 'error';
const getTipoMovimientoLabel = (tipo) => TIPOS_MOVIMIENTO_LABELS[tipo] || tipo;

// ==================== COLUMNAS ====================

const createColumns = (onVerKardex) => [
  {
    key: 'fecha',
    header: 'Fecha',
    render: (row) => (
      <div>
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {format(new Date(row.creado_en), 'dd/MM/yyyy', { locale: es })}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {format(new Date(row.creado_en), 'HH:mm', { locale: es })}
        </div>
      </div>
    ),
  },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (row) => (
      <Badge variant={getTipoMovimientoVariant(row.tipo_movimiento)} size="sm">
        {getTipoMovimientoLabel(row.tipo_movimiento)}
      </Badge>
    ),
  },
  {
    key: 'producto',
    header: 'Producto',
    width: 'lg',
    render: (row) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {row.producto_nombre}
        </div>
        {row.producto_sku && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            SKU: {row.producto_sku}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'cantidad',
    header: 'Cantidad',
    align: 'center',
    render: (row) => (
      <div className="flex items-center justify-center space-x-1">
        {row.cantidad > 0 ? (
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
        <span
          className={`text-sm font-medium ${
            row.cantidad > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {row.cantidad > 0 ? '+' : ''}{row.cantidad}
        </span>
      </div>
    ),
  },
  {
    key: 'stock',
    header: 'Stock',
    align: 'center',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
        {row.stock_resultante}
      </span>
    ),
  },
  {
    key: 'costo',
    header: 'Costo Unit.',
    align: 'right',
    hideOnMobile: true,
    render: (row) => (
      row.costo_unitario ? (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          ${row.costo_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
      )
    ),
  },
  {
    key: 'ubicacion',
    header: 'Ubicación',
    hideOnMobile: true,
    render: (row) => {
      const ubicacion = row.ubicacion_destino_codigo || row.ubicacion_origen_codigo;
      const ubicacionNombre = row.ubicacion_destino_nombre || row.ubicacion_origen_nombre;
      if (!ubicacion) return <span className="text-sm text-gray-400 dark:text-gray-500">-</span>;
      return (
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{ubicacion}</div>
            {ubicacionNombre && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{ubicacionNombre}</div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    key: 'referencia',
    header: 'Referencia',
    hideOnMobile: true,
    render: (row) => (
      <div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.referencia || '-'}
        </div>
        {row.motivo && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {row.motivo}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (row) => (
      <DataTableActions>
        <DataTableActionButton
          icon={FileBarChart}
          label="Ver Kardex"
          onClick={() => onVerKardex({
            id: row.producto_id,
            nombre: row.nombre_producto,
            sku: row.sku
          })}
          variant="primary"
        />
      </DataTableActions>
    ),
  },
];

// ==================== PÁGINA PRINCIPAL ====================

function MovimientosPage() {
  const { showToast } = useToast();
  const { exportCSV } = useExportCSV();

  // Filtros con persistencia
  const { filtros, filtrosQuery, setFiltros, limpiarFiltros } = useFilters(
    INITIAL_FILTERS,
    { moduloId: 'inventario.movimientos' }
  );

  // Modales
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    kardex: { isOpen: false, data: null },
  });

  // Queries
  const { data: movimientosData, isLoading } = useMovimientos(filtrosQuery);
  const movimientos = movimientosData?.movimientos || [];
  const total = movimientosData?.totales?.total_movimientos || movimientosData?.total || 0;

  const { data: productosData } = useProductos({ activo: true });
  const productos = productosData?.productos || [];

  const { data: proveedoresData } = useProveedores({ activo: true });
  const proveedores = proveedoresData?.proveedores || [];

  // Ene 2026: Query de ubicaciones para filtro
  const { data: ubicacionesData } = useUbicacionesAlmacen({ activo: true });
  const ubicaciones = ubicacionesData?.ubicaciones || [];

  // Paginación
  const page = Math.floor(filtrosQuery.offset / ITEMS_PER_PAGE) + 1;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const pagination = {
    page,
    limit: ITEMS_PER_PAGE,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  // Config de filtros
  const filterConfig = useMemo(() => [
    {
      key: 'tipo_movimiento',
      label: 'Tipo',
      type: 'select',
      options: TIPOS_MOVIMIENTO_OPTIONS,
    },
    {
      key: 'categoria',
      label: 'Categoría',
      type: 'select',
      options: [
        { value: 'entrada', label: 'Entradas' },
        { value: 'salida', label: 'Salidas' },
      ],
    },
    {
      key: 'producto_id',
      label: 'Producto',
      type: 'select',
      options: productos.map((p) => ({
        value: p.id,
        label: `${p.nombre}${p.sku ? ` (${p.sku})` : ''}`,
      })),
    },
    {
      key: 'proveedor_id',
      label: 'Proveedor',
      type: 'select',
      options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    },
    {
      key: 'ubicacion_id',
      label: 'Ubicación',
      type: 'select',
      options: ubicaciones.map((u) => ({
        value: u.id,
        label: `${u.codigo}${u.nombre ? ` - ${u.nombre}` : ''}`,
      })),
    },
    { key: 'fecha_desde', label: 'Desde', type: 'date' },
    { key: 'fecha_hasta', label: 'Hasta', type: 'date' },
  ], [productos, proveedores, ubicaciones]);

  // Handlers
  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor, offset: 0 }));
  }, [setFiltros]);

  const handlePageChange = useCallback((newPage) => {
    setFiltros((prev) => ({ ...prev, offset: (newPage - 1) * ITEMS_PER_PAGE }));
  }, [setFiltros]);

  const handleVerKardex = useCallback((producto) => {
    openModal('kardex', producto);
  }, [openModal]);

  const handleExportarCSV = useCallback(() => {
    if (!movimientos || movimientos.length === 0) {
      showToast('No hay datos para exportar', 'warning');
      return;
    }

    const datosExportar = movimientos.map((m) => ({
      fecha: format(new Date(m.creado_en), 'dd/MM/yyyy'),
      hora: format(new Date(m.creado_en), 'HH:mm'),
      tipo: getTipoMovimientoLabel(m.tipo_movimiento),
      producto: m.producto_nombre || '',
      sku: m.producto_sku || '',
      cantidad: m.cantidad || 0,
      stock_despues: m.stock_despues || 0,
      costo_unitario: parseFloat(m.costo_unitario || 0).toFixed(2),
      referencia: m.referencia || '',
      motivo: m.motivo || '',
    }));

    exportCSV(datosExportar, [
      { key: 'fecha', header: 'Fecha' },
      { key: 'hora', header: 'Hora' },
      { key: 'tipo', header: 'Tipo' },
      { key: 'producto', header: 'Producto' },
      { key: 'sku', header: 'SKU' },
      { key: 'cantidad', header: 'Cantidad' },
      { key: 'stock_despues', header: 'Stock Después' },
      { key: 'costo_unitario', header: 'Costo Unit.' },
      { key: 'referencia', header: 'Referencia' },
      { key: 'motivo', header: 'Motivo' },
    ], `kardex_${format(new Date(), 'yyyyMMdd')}`);
  }, [movimientos, exportCSV, showToast]);

  // Columnas memoizadas
  const columns = useMemo(() => createColumns(handleVerKardex), [handleVerKardex]);

  return (
    <InventarioPageLayout
      icon={ArrowLeftRight}
      title="Kardex"
      subtitle={`${total} movimiento${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`}
      actions={
        <Button
          variant="secondary"
          onClick={handleExportarCSV}
          disabled={movimientos.length === 0}
          icon={FileSpreadsheet}
        >
          Exportar CSV
        </Button>
      }
    >
      {/* Filtros */}
      <FilterPanel
        filters={filtros}
        onFilterChange={handleFiltroChange}
        onClearFilters={limpiarFiltros}
        filterConfig={filterConfig}
        showSearch={false}
        defaultExpanded={false}
        className="mb-6"
      />

      {/* Tabla de Movimientos */}
      <DataTable
        columns={columns}
        data={movimientos}
        isLoading={isLoading}
        emptyState={{
          icon: ArrowLeftRight,
          title: 'No hay movimientos',
          description: 'No se encontraron movimientos con los filtros aplicados',
        }}
        skeletonRows={8}
      />

      {/* Paginación */}
      {!isLoading && total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          showInfo={true}
          size="md"
          className="mt-4"
        />
      )}

      {/* Modal de Kardex */}
      <KardexModal
        isOpen={isOpen('kardex')}
        onClose={() => closeModal('kardex')}
        producto={getModalData('kardex')}
      />
    </InventarioPageLayout>
  );
}

export default MovimientosPage;
