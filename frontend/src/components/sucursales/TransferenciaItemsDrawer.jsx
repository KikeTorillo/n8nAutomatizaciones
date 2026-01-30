import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import {
  Button,
  Drawer,
  Input,
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useProductos, useUbicacionesAlmacen } from '@/hooks/inventario';
import {
  useTransferencia,
  useAgregarItemTransferencia,
  useEliminarItemTransferencia,
} from '@/hooks/sistema';

/**
 * Drawer para editar items de una transferencia en estado borrador
 * Permite agregar y eliminar productos de la transferencia
 */
function TransferenciaItemsDrawer({ isOpen, onClose, transferenciaId }) {
  const toast = useToast();

  // Estado local
  const [searchProducto, setSearchProducto] = useState('');
  const [showProductoSearch, setShowProductoSearch] = useState(false);
  const [cantidadesNuevas, setCantidadesNuevas] = useState({});
  const [ubicacionesNuevas, setUbicacionesNuevas] = useState({});

  // Fetch transferencia
  const { data: transferencia, isLoading: loadingTransferencia } = useTransferencia(transferenciaId);

  // Fetch ubicaciones de la sucursal origen (solo las que permiten despacho)
  const { data: ubicacionesData } = useUbicacionesAlmacen({
    sucursal_id: transferencia?.sucursal_origen_id,
    activo: true,
    bloqueada: false,
  });
  const ubicaciones = ubicacionesData?.ubicaciones || [];

  // Fetch productos para busqueda
  const { data: productosData } = useProductos({
    busqueda: searchProducto,
    activo: true,
    limit: 20,
  });
  const productos = productosData?.productos || [];

  // Mutations
  const agregarMutation = useAgregarItemTransferencia();
  const eliminarMutation = useEliminarItemTransferencia();

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearchProducto('');
      setShowProductoSearch(false);
      setCantidadesNuevas({});
      setUbicacionesNuevas({});
    }
  }, [isOpen]);

  // Productos ya en la transferencia
  const productosExistentes = transferencia?.items?.map((i) => i.producto_id) || [];

  // Filtrar productos (excluir los ya agregados)
  const productosFiltrados = productos.filter(
    (p) => !productosExistentes.includes(p.id)
  );

  // Handler para cambiar cantidad de nuevo producto
  const handleCantidadChange = (productoId, cantidad) => {
    setCantidadesNuevas((prev) => ({
      ...prev,
      [productoId]: Math.max(1, parseInt(cantidad) || 1),
    }));
  };

  // Handler para cambiar ubicación de nuevo producto
  const handleUbicacionChange = (productoId, ubicacionId) => {
    setUbicacionesNuevas((prev) => ({
      ...prev,
      [productoId]: ubicacionId ? parseInt(ubicacionId) : undefined,
    }));
  };

  // Handler para agregar producto
  const handleAgregarProducto = async (producto) => {
    const cantidad = cantidadesNuevas[producto.id] || 1;
    const ubicacionOrigenId = ubicacionesNuevas[producto.id];

    // Validar stock
    if (cantidad > (producto.stock_actual || 0)) {
      toast.error(`Stock insuficiente. Disponible: ${producto.stock_actual || 0}`);
      return;
    }

    try {
      await agregarMutation.mutateAsync({
        transferenciaId,
        data: {
          producto_id: producto.id,
          cantidad_enviada: cantidad,
          ubicacion_origen_id: ubicacionOrigenId,
        },
      });
      toast.success(`${producto.nombre} agregado`);
      setSearchProducto('');
      setShowProductoSearch(false);
      setCantidadesNuevas((prev) => {
        const newState = { ...prev };
        delete newState[producto.id];
        return newState;
      });
      setUbicacionesNuevas((prev) => {
        const newState = { ...prev };
        delete newState[producto.id];
        return newState;
      });
    } catch (error) {
      toast.error(error.message || 'Error al agregar producto');
    }
  };

  // Handler para eliminar item
  const handleEliminarItem = async (item) => {
    try {
      await eliminarMutation.mutateAsync({
        transferenciaId,
        itemId: item.id,
      });
      toast.success(`${item.producto_nombre} eliminado`);
    } catch (error) {
      toast.error(error.message || 'Error al eliminar producto');
    }
  };

  // Calcular totales
  const totalItems = transferencia?.items?.length || 0;
  const totalUnidades = transferencia?.items?.reduce(
    (sum, i) => sum + (i.cantidad_enviada || 0),
    0
  ) || 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Productos"
      subtitle={`Transferencia ${transferencia?.codigo || ''}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Info de la transferencia */}
          {transferencia && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 dark:text-gray-400">Origen:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {transferencia.sucursal_origen_nombre}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Destino:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {transferencia.sucursal_destino_nombre}
                </span>
              </div>
            </div>
          )}

          {/* Seccion de agregar productos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Productos ({totalItems})
              </h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowProductoSearch(!showProductoSearch)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            {/* Buscador de productos */}
            {showProductoSearch && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar producto por nombre o SKU..."
                    value={searchProducto}
                    onChange={(e) => setSearchProducto(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>

                {searchProducto && productosFiltrados.length > 0 && (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {productosFiltrados.slice(0, 10).map((producto) => (
                      <div
                        key={producto.id}
                        className="p-2 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {producto.nombre}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {producto.sku} | Stock: {producto.stock_actual || 0}
                            </p>
                          </div>
                        </div>
                        {/* Selector de ubicación origen (opcional) */}
                        {ubicaciones.length > 0 && (
                          <div className="mb-2">
                            <div className="relative">
                              <MapPin className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                              <select
                                value={ubicacionesNuevas[producto.id] || ''}
                                onChange={(e) => handleUbicacionChange(producto.id, e.target.value)}
                                className="pl-7 w-full text-xs rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              >
                                <option value="">Ubicacion por defecto</option>
                                {ubicaciones.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.codigo || u.nombre}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={producto.stock_actual || 0}
                            value={cantidadesNuevas[producto.id] || 1}
                            onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                            className="w-20 text-center text-sm"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleAgregarProducto(producto)}
                            disabled={agregarMutation.isPending || (producto.stock_actual || 0) === 0}
                            className="flex-1"
                          >
                            {agregarMutation.isPending ? 'Agregando...' : 'Agregar'}
                          </Button>
                        </div>
                        {(producto.stock_actual || 0) === 0 && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Sin stock disponible
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {searchProducto && productosFiltrados.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No se encontraron productos
                  </p>
                )}

                {!searchProducto && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    Escribe para buscar productos
                  </p>
                )}
              </div>
            )}

            {/* Lista de items actuales */}
            {loadingTransferencia ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Cargando...</p>
              </div>
            ) : totalItems === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay productos agregados
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Usa el boton "Agregar" para buscar productos
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transferencia?.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.producto_nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SKU: {item.producto_sku}
                        {item.ubicacion_origen_codigo && (
                          <span className="ml-2 inline-flex items-center text-primary-600 dark:text-primary-400">
                            <MapPin className="w-3 h-3 mr-0.5" />
                            {item.ubicacion_origen_codigo}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {item.cantidad_enviada} uds
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarItem(item)}
                        disabled={eliminarMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Resumen */}
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total productos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {totalItems}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Total unidades:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {totalUnidades}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            className="w-full"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default TransferenciaItemsDrawer;
