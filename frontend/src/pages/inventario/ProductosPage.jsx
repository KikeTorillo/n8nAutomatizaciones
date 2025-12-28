import { useState } from 'react';
import { Package, Plus, Edit, Trash2, TrendingDown, Upload, FileBarChart, ImageIcon, ScanLine } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
import {
  useProductos,
  useEliminarProducto,
} from '@/hooks/useProductos';
import { useCategorias } from '@/hooks/useCategorias';
import { useProveedores } from '@/hooks/useProveedores';
import ProductoFormModal from '@/components/inventario/ProductoFormModal';
import BulkProductosModal from '@/components/inventario/BulkProductosModal';
import AjustarStockModal from '@/components/inventario/AjustarStockModal';
import BarcodeScanner from '@/components/common/BarcodeScanner';

/**
 * Página principal de Gestión de Productos
 */
function ProductosPage() {
  const { success: showSuccess, error: showError } = useToast();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria_id: '',
    proveedor_id: '',
    activo: true,
    stock_bajo: false,
    stock_agotado: false,
  });

  // Estado de modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAjustarStockModalOpen, setIsAjustarStockModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

  // Estado del scanner
  const [showScanner, setShowScanner] = useState(false);

  // Queries
  const { data: productosData, isLoading: cargandoProductos } = useProductos(filtros);
  const productos = productosData?.productos || [];
  const total = productosData?.total || 0;

  const { data: categoriasData } = useCategorias({ activo: true });
  const categorias = categoriasData?.categorias || [];

  const { data: proveedoresData } = useProveedores({ activo: true });
  const proveedores = proveedoresData?.proveedores || [];

  // Mutations
  const eliminarMutation = useEliminarProducto();

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      categoria_id: '',
      proveedor_id: '',
      activo: true,
      stock_bajo: false,
      stock_agotado: false,
    });
  };

  // Handler de escaneo
  const handleScan = (code) => {
    setShowScanner(false);
    handleFiltroChange('busqueda', code);
    showSuccess(`Buscando: ${code}`);
  };

  // Handlers de acciones
  const handleNuevoProducto = () => {
    setProductoSeleccionado(null);
    setModalMode('create');
    setIsFormModalOpen(true);
  };

  const handleEditarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setModalMode('edit');
    setIsFormModalOpen(true);
  };

  const handleAjustarStock = (producto) => {
    setProductoSeleccionado(producto);
    setIsAjustarStockModalOpen(true);
  };

  const handleAbrirModalEliminar = (producto) => {
    setProductoSeleccionado(producto);
    setModalEliminarAbierto(true);
  };

  const handleEliminar = () => {
    eliminarMutation.mutate(productoSeleccionado.id, {
      onSuccess: () => {
        showSuccess('Producto eliminado correctamente');
        setModalEliminarAbierto(false);
        setProductoSeleccionado(null);
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

  const obtenerEstadoStock = (producto) => {
    if (producto.stock_actual === 0) {
      return { texto: 'Agotado', color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30' };
    }
    if (producto.stock_actual <= producto.stock_minimo) {
      return { texto: 'Stock bajo', color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30' };
    }
    if (producto.stock_actual >= producto.stock_maximo) {
      return { texto: 'Stock alto', color: 'text-primary-600 bg-primary-100 dark:text-primary-400 dark:bg-primary-900/30' };
    }
    return { texto: 'Normal', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona productos, proveedores y stock
        </p>
      </div>

      {/* Tabs de navegación */}
      <InventarioNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header de sección - Mobile First */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Package className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Productos</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {total} producto{total !== 1 ? 's' : ''} en total
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsBulkModalOpen(true)}
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
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre, SKU o código..."
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Escanear código de barras"
                >
                  <ScanLine className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              <select
                value={filtros.categoria_id}
                onChange={(e) => handleFiltroChange('categoria_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proveedor
              </label>
              <select
                value={filtros.proveedor_id}
                onChange={(e) => handleFiltroChange('proveedor_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtros adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filtros.stock_bajo}
                    onChange={(e) => handleFiltroChange('stock_bajo', e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Stock bajo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filtros.stock_agotado}
                    onChange={(e) => handleFiltroChange('stock_agotado', e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Agotados</span>
                </label>
              </div>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="secondary"
              onClick={handleLimpiarFiltros}
              size="sm"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>

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
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No se encontraron productos.
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleNuevoProducto}
                        icon={Plus}
                        className="mt-4"
                      >
                        Crear Primer Producto
                      </Button>
                    </td>
                  </tr>
                ) : (
                  productos.map((producto) => {
                    const estadoStock = obtenerEstadoStock(producto);
                    return (
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
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoStock.color}`}
                          >
                            {estadoStock.texto}
                          </span>
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
                              onClick={() => handleAbrirModalEliminar(producto)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Formulario Producto */}
        {isFormModalOpen && (
          <ProductoFormModal
            isOpen={isFormModalOpen}
            onClose={() => {
              setIsFormModalOpen(false);
              setProductoSeleccionado(null);
            }}
            mode={modalMode}
            producto={productoSeleccionado}
          />
        )}

        {/* Modal Carga Masiva */}
        {isBulkModalOpen && (
          <BulkProductosModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
          />
        )}

        {/* Modal Ajustar Stock */}
        {isAjustarStockModalOpen && (
          <AjustarStockModal
            isOpen={isAjustarStockModalOpen}
            onClose={() => {
              setIsAjustarStockModalOpen(false);
              setProductoSeleccionado(null);
            }}
            producto={productoSeleccionado}
          />
        )}

        {/* Modal Confirmar Eliminación */}
        <Modal
          isOpen={modalEliminarAbierto}
          onClose={() => setModalEliminarAbierto(false)}
          title="Confirmar Eliminación"
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              ¿Estás seguro de que deseas eliminar el producto{' '}
              <span className="font-semibold">{productoSeleccionado?.nombre}</span>?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta acción marcará el producto como inactivo. Podrás reactivarlo después si lo necesitas.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setModalEliminarAbierto(false)}
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
      </div>
    </div>
  );
}

export default ProductosPage;
