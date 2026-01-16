import { useState, useMemo } from 'react';
import { FileBarChart, TrendingUp, TrendingDown, ArrowLeftRight, FileSpreadsheet } from 'lucide-react';
import { useModalManager } from '@/hooks/useModalManager';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { DataTable, DataTableActions, DataTableActionButton } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { useToast } from '@/hooks/useToast';
import { useExportCSV } from '@/hooks/useExportCSV';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import { useMovimientos } from '@/hooks/useInventario';
import { useProductos } from '@/hooks/useProductos';
import { useProveedores } from '@/hooks/useProveedores';
import KardexModal from '@/components/inventario/KardexModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ITEMS_PER_PAGE = 25;

/**
 * Página principal de Movimientos de Inventario
 */
function MovimientosPage() {
  const { showToast } = useToast();
  const { exportCSV } = useExportCSV();

  // Estado de filtros y paginación
  const [filtros, setFiltros] = useState({
    tipo_movimiento: '',
    categoria: '',
    producto_id: '',
    proveedor_id: '',
    fecha_desde: '',
    fecha_hasta: '',
  });
  const [page, setPage] = useState(1);

  // Estado de modales unificado
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    kardex: { isOpen: false, data: null },
  });

  // Query params con paginación
  const queryParams = useMemo(() => ({
    ...filtros,
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  }), [filtros, page]);

  // Queries
  const { data: movimientosData, isLoading: cargandoMovimientos } = useMovimientos(queryParams);
  const movimientos = movimientosData?.movimientos || [];
  const total = movimientosData?.totales?.total_movimientos || movimientosData?.total || 0;

  // Calcular paginación
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const pagination = {
    page,
    limit: ITEMS_PER_PAGE,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  const { data: productosData } = useProductos({ activo: true });
  const productos = productosData?.productos || [];

  const { data: proveedoresData } = useProveedores({ activo: true });
  const proveedores = proveedoresData?.proveedores || [];

  // Config de filtros para FilterPanel
  const filterConfig = useMemo(() => [
    {
      key: 'tipo_movimiento',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: 'entrada_compra', label: 'Entrada - Compra' },
        { value: 'entrada_devolucion', label: 'Entrada - Devolución' },
        { value: 'entrada_ajuste', label: 'Entrada - Ajuste' },
        { value: 'salida_venta', label: 'Salida - Venta' },
        { value: 'salida_uso_servicio', label: 'Salida - Uso en Servicio' },
        { value: 'salida_merma', label: 'Salida - Merma' },
        { value: 'salida_robo', label: 'Salida - Robo' },
        { value: 'salida_devolucion', label: 'Salida - Devolución' },
        { value: 'salida_ajuste', label: 'Salida - Ajuste' },
      ],
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
      options: proveedores.map((p) => ({
        value: p.id,
        label: p.nombre,
      })),
    },
    { key: 'fecha_desde', label: 'Desde', type: 'date' },
    { key: 'fecha_hasta', label: 'Hasta', type: 'date' },
  ], [productos, proveedores]);

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPage(1); // Reset página al cambiar filtros
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      tipo_movimiento: '',
      categoria: '',
      producto_id: '',
      proveedor_id: '',
      fecha_desde: '',
      fecha_hasta: '',
    });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handlers de acciones
  const handleVerKardex = (producto) => {
    openModal('kardex', producto);
  };

  // Helpers
  const getTipoMovimientoVariant = (tipo) => {
    return tipo.startsWith('entrada') ? 'success' : 'error';
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

  // Exportar CSV usando hook centralizado
  const handleExportarCSV = () => {
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
  };

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
          onClearFilters={handleLimpiarFiltros}
          filterConfig={filterConfig}
          showSearch={false}
          defaultExpanded={false}
          className="mb-6"
        />

        {/* Tabla de Movimientos */}
        <DataTable
          columns={[
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
                    onClick={() => handleVerKardex({
                      id: row.producto_id,
                      nombre: row.nombre_producto,
                      sku: row.sku
                    })}
                    variant="primary"
                  />
                </DataTableActions>
              ),
            },
          ]}
          data={movimientos}
          isLoading={cargandoMovimientos}
          emptyState={{
            icon: ArrowLeftRight,
            title: 'No hay movimientos',
            description: 'No se encontraron movimientos con los filtros aplicados',
          }}
          skeletonRows={8}
        />

        {/* Paginación */}
        {!cargandoMovimientos && total > 0 && (
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
