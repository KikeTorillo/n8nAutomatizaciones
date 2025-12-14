import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Filter, X, FileBarChart, TrendingUp, TrendingDown, Search, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
import { useMovimientos } from '@/hooks/useInventario';
import { useProductos } from '@/hooks/useProductos';
import { useProveedores } from '@/hooks/useProveedores';
import KardexModal from '@/components/inventario/KardexModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Página principal de Movimientos de Inventario
 */
function MovimientosPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    tipo_movimiento: '',
    categoria: '',
    producto_id: '',
    proveedor_id: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  // Estado de modales
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Queries
  const { data: movimientosData, isLoading: cargandoMovimientos } = useMovimientos(filtros);
  const movimientos = movimientosData?.movimientos || [];
  const total = movimientosData?.totales?.total_movimientos || 0;

  const { data: productosData } = useProductos({ activo: true });
  const productos = productosData?.productos || [];

  const { data: proveedoresData } = useProveedores({ activo: true });
  const proveedores = proveedoresData?.proveedores || [];

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
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
  };

  // Handlers de acciones
  const handleVerKardex = (producto) => {
    setProductoSeleccionado(producto);
    setIsKardexModalOpen(true);
  };

  // Helpers
  const getTipoMovimientoColor = (tipo) => {
    if (tipo.startsWith('entrada')) {
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40';
    }
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40';
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/home')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Inicio
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona productos, proveedores y stock
        </p>
      </div>

      {/* Tabs de navegación */}
      <InventarioNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header de sección */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <ArrowLeftRight className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Movimientos de Inventario</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {total} movimiento{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Tipo de Movimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <Select
                value={filtros.tipo_movimiento}
                onChange={(e) => handleFiltroChange('tipo_movimiento', e.target.value)}
              >
                <option value="">Todos</option>
                <optgroup label="Entradas">
                  <option value="entrada_compra">Compra</option>
                  <option value="entrada_devolucion">Devolución</option>
                  <option value="entrada_ajuste">Ajuste</option>
                </optgroup>
                <optgroup label="Salidas">
                  <option value="salida_venta">Venta</option>
                  <option value="salida_uso_servicio">Uso en Servicio</option>
                  <option value="salida_merma">Merma</option>
                  <option value="salida_robo">Robo</option>
                  <option value="salida_devolucion">Devolución</option>
                  <option value="salida_ajuste">Ajuste</option>
                </optgroup>
              </Select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <Select
                value={filtros.categoria}
                onChange={(e) => handleFiltroChange('categoria', e.target.value)}
              >
                <option value="">Todas</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
              </Select>
            </div>

            {/* Producto */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Producto
              </label>
              <Select
                value={filtros.producto_id}
                onChange={(e) => handleFiltroChange('producto_id', e.target.value)}
              >
                <option value="">Todos los productos</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} {producto.sku ? `(${producto.sku})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* Proveedor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proveedor
              </label>
              <Select
                value={filtros.proveedor_id}
                onChange={(e) => handleFiltroChange('proveedor_id', e.target.value)}
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </Select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Botón Limpiar */}
            <div className="flex items-end md:col-span-4">
              <Button
                variant="secondary"
                onClick={handleLimpiarFiltros}
                icon={X}
                className="flex-1"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Tabla de Movimientos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {cargandoMovimientos ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando movimientos...</span>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No hay movimientos
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No se encontraron movimientos con los filtros aplicados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Costo Unit.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {movimientos.map((movimiento) => (
                    <tr key={movimiento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {format(new Date(movimiento.creado_en), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(movimiento.creado_en), 'HH:mm', { locale: es })}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoMovimientoColor(
                            movimiento.tipo_movimiento
                          )}`}
                        >
                          {getTipoMovimientoLabel(movimiento.tipo_movimiento)}
                        </span>
                      </td>

                      {/* Producto */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {movimiento.producto_nombre}
                        </div>
                        {movimiento.producto_sku && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            SKU: {movimiento.producto_sku}
                          </div>
                        )}
                      </td>

                      {/* Cantidad */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {movimiento.cantidad > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              movimiento.cantidad > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {movimiento.cantidad > 0 ? '+' : ''}
                            {movimiento.cantidad}
                          </span>
                        </div>
                      </td>

                      {/* Stock Resultante */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {movimiento.stock_resultante}
                        </span>
                      </td>

                      {/* Costo Unitario */}
                      <td className="px-6 py-4 text-right">
                        {movimiento.costo_unitario ? (
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            ${movimiento.costo_unitario.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>

                      {/* Referencia */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {movimiento.referencia || '-'}
                        </div>
                        {movimiento.motivo && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {movimiento.motivo}
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleVerKardex({
                            id: movimiento.producto_id,
                            nombre: movimiento.nombre_producto,
                            sku: movimiento.sku
                          })}
                          icon={FileBarChart}
                        >
                          Kardex
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Kardex */}
      <KardexModal
        isOpen={isKardexModalOpen}
        onClose={() => setIsKardexModalOpen(false)}
        producto={productoSeleccionado}
      />
    </div>
  );
}

export default MovimientosPage;
