import { useState, useMemo } from 'react';
import { Package, Plus, Edit, Trash2, TrendingDown, Upload, ImageIcon, ScanLine, Tag, Search, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { AdvancedFilterPanel, FilterChip, SavedSearchModal } from '@/components/ui/filters';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import { useFilters } from '@/hooks/useFilters';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useProductos,
  useEliminarProducto,
} from '@/hooks/useProductos';
import { useCategorias } from '@/hooks/useCategorias';
import { useProveedores } from '@/hooks/useProveedores';
import ProductoFormModal from '@/components/inventario/ProductoFormModal';
import BulkProductosModal from '@/components/inventario/BulkProductosModal';
import AjustarStockModal from '@/components/inventario/AjustarStockModal';
import GenerarEtiquetaModal from '@/components/inventario/GenerarEtiquetaModal';
import BarcodeScanner from '@/components/common/BarcodeScanner';

/**
 * Página principal de Gestión de Productos
 */
function ProductosPage() {
  const { success: showSuccess, error: showError } = useToast();

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

  // Modal para guardar búsqueda
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);

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

  return (
    <InventarioPageLayout
      icon={Package}
      title="Productos"
      subtitle={`${total} producto${total !== 1 ? 's' : ''} en total`}
      actions={
        <>
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
          onGuardarBusqueda={() => setShowSaveSearchModal(true)}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SKU / Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Venta
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cargandoProductos ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Cargando productos...
                    </td>
                  </tr>
                ) : productos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8">
                      <EmptyState
                        icon={Package}
                        title="No se encontraron productos"
                        description="Crea tu primer producto para comenzar a gestionar el inventario"
                        action={
                          <Button variant="primary" onClick={handleNuevoProducto} icon={Plus}>
                            Crear Primer Producto
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  productos.map((producto) => (
                      <tr key={producto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {/* Imagen del producto */}
                            <div className="flex-shrink-0 h-10 w-10">
                              {producto.imagen_url ? (
                                <img
                                  src={producto.imagen_url}
                                  alt={producto.nombre}
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
                                {producto.nombre}
                              </div>
                              {producto.descripcion && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {producto.descripcion}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{producto.sku || '-'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{producto.codigo_barras || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {obtenerNombreCategoria(producto.categoria_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {obtenerNombreProveedor(producto.proveedor_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {producto.stock_actual} {producto.unidad_medida || 'unid'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Min: {producto.stock_minimo} | Max: {producto.stock_maximo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge variant={getStockVariant(producto)} size="sm">
                            {getStockLabel(producto)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditarProducto(producto)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAjustarStock(producto)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                              title="Ajustar Stock"
                            >
                              <TrendingDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleGenerarEtiqueta(producto)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                              title="Generar Etiqueta"
                            >
                              <Tag className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAbrirModalEliminar(producto)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Formulario Producto */}
        {isOpen('form') && (
          <ProductoFormModal
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
        <Modal
          isOpen={isOpen('eliminar')}
          onClose={() => closeModal('eliminar')}
          title="Confirmar Eliminación"
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              ¿Estás seguro de que deseas eliminar el producto{' '}
              <span className="font-semibold">{getModalData('eliminar')?.producto?.nombre}</span>?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta acción marcará el producto como inactivo. Podrás reactivarlo después si lo necesitas.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => closeModal('eliminar')}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleEliminar}
                loading={eliminarMutation.isPending}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Guardar Búsqueda */}
        <SavedSearchModal
          isOpen={showSaveSearchModal}
          onClose={() => setShowSaveSearchModal(false)}
          filtrosActuales={filtros}
          onSave={handleGuardarBusqueda}
          existeNombre={existeNombre}
        />
    </InventarioPageLayout>
  );
}

export default ProductosPage;
