import { useState, useMemo } from 'react';
import { Package, Plus, Edit, Trash2, TrendingDown, Upload, ImageIcon, ScanLine, Tag, Search, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import {
  AdvancedFilterPanel,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableActionButton,
  DataTableActions,
  FilterChip,
  SavedSearchModal
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';
import { useFilters } from '@/hooks/utils';
import { useSavedFilters } from '@/hooks/utils';
import { useExportCSV } from '@/hooks/utils';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useProductos,
  useEliminarProducto,
} from '@/hooks/inventario';
import { useCategorias } from '@/hooks/inventario';
import { useProveedores } from '@/hooks/inventario';
import ProductoFormDrawer from '@/components/inventario/ProductoFormDrawer';
import BulkProductosModal from '@/components/inventario/BulkProductosModal';
import AjustarStockModal from '@/components/inventario/AjustarStockModal';
import GenerarEtiquetaModal from '@/components/inventario/GenerarEtiquetaModal';
import { BarcodeScanner } from '@/components/ui';

/**
 * Página principal de Gestión de Productos
 */
function ProductosPage() {
  const { success: showSuccess, error: showError } = useToast();
  const { exportCSV } = useExportCSV();

  // Estado de filtros con hook reutilizable
  const INITIAL_FILTERS = {
    busqueda: '',
    categoria_id: '',
    proveedor_id: '',
    activo: true,
    stock_bajo: false,
    stock_agotado: false,
  };

  const {
    filtros,
    filtrosQuery,
    filtrosActivos,
    filtrosActivosArray,
    setFiltro,
    setFiltros,
    limpiarFiltros,
    aplicarBusqueda,
  } = useFilters(INITIAL_FILTERS, { moduloId: 'inventario.productos' });

  // Búsquedas guardadas
  const {
    busquedas,
    guardarBusqueda,
    eliminarBusqueda,
    toggleDefault,
    existeNombre,
  } = useSavedFilters('inventario.productos');

  // Estado de modales con useModalManager
  const { isOpen, getModalData, openModal, closeModal } = useModalManager();

  // Estado del scanner
  const [showScanner, setShowScanner] = useState(false);

  // Queries - usar filtrosQuery (debounced)
  const { data: productosData, isLoading: cargandoProductos } = useProductos(filtrosQuery);
  const productos = productosData?.productos || [];
  const total = productosData?.total || 0;

  const { data: categoriasData } = useCategorias({ activo: true });
  const categorias = categoriasData?.categorias || [];

  const { data: proveedoresData } = useProveedores({ activo: true });
  const proveedores = proveedoresData?.proveedores || [];

  // Mutations
  const eliminarMutation = useEliminarProducto();

  // Configuración de filtros para AdvancedFilterPanel
  const filterConfig = useMemo(() => [
    {
      id: 'stock',
      label: 'Estado de Stock',
      type: 'checkbox-group',
      options: [
        { field: 'stock_bajo', label: 'Stock bajo', icon: TrendingDown },
        { field: 'stock_agotado', label: 'Agotados', icon: AlertTriangle },
      ],
    },
    {
      id: 'categoria_id',
      label: 'Categoría',
      type: 'select',
      placeholder: 'Todas las categorías',
      options: categorias.map((c) => ({ value: c.id, label: c.nombre })),
    },
    {
      id: 'proveedor_id',
      label: 'Proveedor',
      type: 'select',
      placeholder: 'Todos los proveedores',
      options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    },
  ], [categorias, proveedores]);

  // Handler de escaneo
  const handleScan = (code) => {
    setShowScanner(false);
    setFiltro('busqueda', code);
    showSuccess(`Buscando: ${code}`);
  };

  // Handler para guardar búsqueda
  const handleGuardarBusqueda = (nombre, esDefault) => {
    guardarBusqueda(nombre, filtros, esDefault);
    showSuccess('Búsqueda guardada correctamente');
  };

  // Handlers de acciones
  const handleNuevoProducto = () => {
    openModal('form', { producto: null, mode: 'create' });
  };

  const handleEditarProducto = (producto) => {
    openModal('form', { producto, mode: 'edit' });
  };

  const handleAjustarStock = (producto) => {
    openModal('ajustarStock', { producto });
  };

  const handleGenerarEtiqueta = (producto) => {
    openModal('etiqueta', { producto });
  };

  const handleAbrirModalEliminar = (producto) => {
    openModal('eliminar', { producto });
  };

  const handleEliminar = () => {
    const { producto } = getModalData('eliminar');
    eliminarMutation.mutate(producto.id, {
      onSuccess: () => {
        showSuccess('Producto eliminado correctamente');
        closeModal('eliminar');
      },
      onError: (error) => {
        showError(
          error.response?.data?.mensaje || 'Error al eliminar producto'
        );
      },
    });
  };

  // Helpers
  const obtenerNombreCategoria = (categoriaId) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria?.nombre || 'Sin categoría';
  };

  const obtenerNombreProveedor = (proveedorId) => {
    const proveedor = proveedores.find((p) => p.id === proveedorId);
    return proveedor?.nombre || 'Sin proveedor';
  };

  const getStockVariant = (producto) => {
    if (producto.stock_actual === 0) return 'error';
    if (producto.stock_actual <= producto.stock_minimo) return 'warning';
    if (producto.stock_actual >= producto.stock_maximo) return 'primary';
    return 'success';
  };

  const getStockLabel = (producto) => {
    if (producto.stock_actual === 0) return 'Agotado';
    if (producto.stock_actual <= producto.stock_minimo) return 'Stock bajo';
    if (producto.stock_actual >= producto.stock_maximo) return 'Stock alto';
    return 'Normal';
  };

  // Exportar CSV usando hook centralizado
  const handleExportarCSV = () => {
    const datosExportar = productos.map(p => ({
      nombre: p.nombre || '',
      sku: p.sku || '',
      codigo_barras: p.codigo_barras || '',
      categoria: p.categoria_nombre || 'Sin categoría',
      proveedor: p.proveedor_nombre || 'Sin proveedor',
      stock: p.stock_actual || 0,
      stock_minimo: p.stock_minimo || 0,
      stock_maximo: p.stock_maximo || 0,
      precio_compra: parseFloat(p.precio_compra || 0).toFixed(2),
      precio_venta: parseFloat(p.precio_venta || 0).toFixed(2),
      estado: getStockLabel(p),
    }));

    exportCSV(datosExportar, [
      { key: 'nombre', header: 'Nombre' },
      { key: 'sku', header: 'SKU' },
      { key: 'codigo_barras', header: 'Código Barras' },
      { key: 'categoria', header: 'Categoría' },
      { key: 'proveedor', header: 'Proveedor' },
      { key: 'stock', header: 'Stock' },
      { key: 'stock_minimo', header: 'Mínimo' },
      { key: 'stock_maximo', header: 'Máximo' },
      { key: 'precio_compra', header: 'Precio Compra' },
      { key: 'precio_venta', header: 'Precio Venta' },
      { key: 'estado', header: 'Estado' },
    ], `productos_${format(new Date(), 'yyyyMMdd')}`);
  };

  return (
    <InventarioPageLayout
      icon={Package}
      title="Productos"
      subtitle={`${total} producto${total !== 1 ? 's' : ''} en total`}
      actions={
        <>
          <Button
            variant="secondary"
            onClick={handleExportarCSV}
            disabled={productos.length === 0}
            icon={FileSpreadsheet}
            className="flex-1 sm:flex-none text-sm"
          >
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => openModal('bulk')}
            icon={Upload}
            className="flex-1 sm:flex-none text-sm"
          >
            <span className="hidden sm:inline">Carga Masiva</span>
            <span className="sm:hidden">Carga</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleNuevoProducto}
            icon={Plus}
            className="flex-1 sm:flex-none text-sm"
          >
            <span className="hidden sm:inline">Nuevo Producto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </>
      }
    >

        {/* Panel de Filtros Avanzados */}
        <AdvancedFilterPanel
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onLimpiarFiltros={limpiarFiltros}
          filterConfig={filterConfig}
          moduloId="inventario.productos"
          busquedasGuardadas={busquedas}
          onAplicarBusqueda={aplicarBusqueda}
          onEliminarBusqueda={eliminarBusqueda}
          onToggleDefault={toggleDefault}
          onGuardarBusqueda={() => openModal('saveSearch')}
          filtrosActivos={filtrosActivos}
          className="mb-6"
          searchBar={
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre, SKU o código..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltro('busqueda', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex-shrink-0 p-2.5 border-2 border-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors bg-white dark:bg-gray-700"
                title="Escanear código de barras"
                aria-label="Escanear código de barras"
              >
                <ScanLine className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </button>
            </div>
          }
        />

        {/* Chips de filtros activos */}
        {filtrosActivosArray.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filtrosActivosArray.map(({ key, value }) => {
              // Obtener label legible
              let label = key;
              let displayValue = String(value);

              if (key === 'categoria_id') {
                label = 'Categoría';
                displayValue = categorias.find(c => c.id === value)?.nombre || value;
              } else if (key === 'proveedor_id') {
                label = 'Proveedor';
                displayValue = proveedores.find(p => p.id === value)?.nombre || value;
              } else if (key === 'stock_bajo') {
                label = 'Stock bajo';
                displayValue = '';
              } else if (key === 'stock_agotado') {
                label = 'Agotados';
                displayValue = '';
              } else if (key === 'busqueda') {
                label = 'Búsqueda';
                displayValue = value;
              }

              return (
                <FilterChip
                  key={key}
                  label={label}
                  value={displayValue || undefined}
                  onRemove={() => setFiltro(key, key.includes('stock') ? false : '')}
                />
              );
            })}
          </div>
        )}

        {/* Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <BarcodeScanner
                onScan={handleScan}
                onClose={() => setShowScanner(false)}
                title="Buscar Producto"
                subtitle="Escanea el código de barras del producto"
                formats="PRODUCTOS"
              />
            </div>
          </div>
        )}

        {/* Tabla de Productos */}
        <DataTable
          columns={[
            {
              key: 'nombre',
              header: 'Producto',
              width: 'xl',
              render: (row) => (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    {row.imagen_url ? (
                      <img
                        src={row.imagen_url}
                        alt={row.nombre}
                        className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {row.nombre}
                    </div>
                    {row.descripcion && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {row.descripcion}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'sku',
              header: 'SKU / Código',
              hideOnMobile: true,
              render: (row) => (
                <div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{row.sku || '-'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{row.codigo_barras || '-'}</div>
                </div>
              ),
            },
            {
              key: 'categoria_id',
              header: 'Categoría',
              hideOnMobile: true,
              render: (row) => obtenerNombreCategoria(row.categoria_id),
            },
            {
              key: 'proveedor_id',
              header: 'Proveedor',
              hideOnMobile: true,
              render: (row) => obtenerNombreProveedor(row.proveedor_id),
            },
            {
              key: 'stock_actual',
              header: 'Stock',
              align: 'right',
              render: (row) => (
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {row.stock_actual} {row.unidad_medida || 'unid'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Min: {row.stock_minimo} | Max: {row.stock_maximo}
                  </div>
                </div>
              ),
            },
            {
              key: 'precio_venta',
              header: 'Precio',
              align: 'right',
              hideOnMobile: true,
              render: (row) => `$${parseFloat(row.precio_venta || 0).toFixed(2)}`,
            },
            {
              key: 'estado',
              header: 'Estado',
              align: 'center',
              render: (row) => (
                <Badge variant={getStockVariant(row)} size="sm">
                  {getStockLabel(row)}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <DataTableActions>
                  <DataTableActionButton
                    icon={Edit}
                    label="Editar"
                    onClick={() => handleEditarProducto(row)}
                    variant="primary"
                  />
                  <DataTableActionButton
                    icon={TrendingDown}
                    label="Ajustar Stock"
                    onClick={() => handleAjustarStock(row)}
                    variant="primary"
                  />
                  <DataTableActionButton
                    icon={Tag}
                    label="Generar Etiqueta"
                    onClick={() => handleGenerarEtiqueta(row)}
                    variant="primary"
                  />
                  <DataTableActionButton
                    icon={Trash2}
                    label="Eliminar"
                    onClick={() => handleAbrirModalEliminar(row)}
                    variant="danger"
                  />
                </DataTableActions>
              ),
            },
          ]}
          data={productos}
          isLoading={cargandoProductos}
          emptyState={{
            icon: Package,
            title: 'No se encontraron productos',
            description: 'Crea tu primer producto para comenzar a gestionar el inventario',
            actionLabel: 'Crear Primer Producto',
            onAction: handleNuevoProducto,
          }}
        />

        {/* Modal Formulario Producto */}
        {isOpen('form') && (
          <ProductoFormDrawer
            isOpen={isOpen('form')}
            onClose={() => closeModal('form')}
            mode={getModalData('form')?.mode || 'create'}
            producto={getModalData('form')?.producto}
          />
        )}

        {/* Modal Carga Masiva */}
        {isOpen('bulk') && (
          <BulkProductosModal
            isOpen={isOpen('bulk')}
            onClose={() => closeModal('bulk')}
          />
        )}

        {/* Modal Ajustar Stock */}
        {isOpen('ajustarStock') && (
          <AjustarStockModal
            isOpen={isOpen('ajustarStock')}
            onClose={() => closeModal('ajustarStock')}
            producto={getModalData('ajustarStock')?.producto}
          />
        )}

        {/* Modal Generar Etiqueta */}
        {isOpen('etiqueta') && (
          <GenerarEtiquetaModal
            isOpen={isOpen('etiqueta')}
            onClose={() => closeModal('etiqueta')}
            producto={getModalData('etiqueta')?.producto}
          />
        )}

        {/* Modal Confirmar Eliminación */}
        <ConfirmDialog
          isOpen={isOpen('eliminar')}
          onClose={() => closeModal('eliminar')}
          onConfirm={handleEliminar}
          title="Eliminar Producto"
          message={`¿Estás seguro de que deseas eliminar el producto "${getModalData('eliminar')?.producto?.nombre}"? Esta acción marcará el producto como inactivo. Podrás reactivarlo después si lo necesitas.`}
          confirmText="Eliminar"
          variant="danger"
          isLoading={eliminarMutation.isPending}
        />

        {/* Modal Guardar Búsqueda */}
        <SavedSearchModal
          isOpen={isOpen('saveSearch')}
          onClose={() => closeModal('saveSearch')}
          filtrosActuales={filtros}
          onSave={handleGuardarBusqueda}
          existeNombre={existeNombre}
        />
    </InventarioPageLayout>
  );
}

export default ProductosPage;
