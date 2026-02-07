import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  X,
  Search,
  Package,
  Loader2,
  Percent,
  DollarSign,
} from 'lucide-react';
import { Button, ConfirmDialog, Input, Select } from '@/components/ui';
import { useToast, useModalManager } from '@/hooks/utils';
import { queryKeys } from '@/hooks/config';
import { listasPreciosApi, inventarioApi } from '@/services/api/endpoints';

/**
 * Vista de Items de una Lista
 */
export default function ListaItemsView({ listaId }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [tipoAplicacion, setTipoAplicacion] = useState('producto');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje');
  const [valorDescuento, setValorDescuento] = useState('');
  const [cantidadMinima, setCantidadMinima] = useState('1');

  // Modal para confirmacion de eliminacion de item
  const { openModal: openItemModal, closeModal: closeItemModal, isOpen: isItemOpen, getModalData: getItemModalData } = useModalManager({
    deleteItem: { isOpen: false, data: null },
  });

  // Query: Items de la lista
  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKeys.precios.listas.items(listaId),
    queryFn: async () => {
      const response = await listasPreciosApi.listarItems(listaId);
      return response.data.data || [];
    },
  });

  // Query: Buscar productos
  const { data: productosEncontrados = [], isLoading: buscandoProductos } = useQuery({
    queryKey: ['productos-busqueda', busquedaProducto],
    queryFn: async () => {
      if (busquedaProducto.length < 2) return [];
      const response = await inventarioApi.buscarProductos({ q: busquedaProducto, limit: 10 });
      return response.data.data || [];
    },
    enabled: busquedaProducto.length >= 2,
  });

  // Filtrar productos que ya estan en la lista
  const productosDisponibles = productosEncontrados.filter(
    (p) => !items.some((item) => item.producto_id === p.id)
  );

  // Query: Buscar categorias
  const { data: categoriasEncontradas = [], isLoading: buscandoCategorias } = useQuery({
    queryKey: ['categorias-busqueda', busquedaCategoria],
    queryFn: async () => {
      if (busquedaCategoria.length < 2) return [];
      const response = await inventarioApi.listarCategorias({ busqueda: busquedaCategoria, activo: true });
      return response.data.data?.categorias || [];
    },
    enabled: busquedaCategoria.length >= 2,
  });

  // Filtrar categorias que ya estan en la lista
  const categoriasDisponibles = categoriasEncontradas.filter(
    (c) => !items.some((item) => item.categoria_id === c.id)
  );

  // Mutation: Crear item
  const crearMutation = useMutation({
    mutationFn: async (data) => {
      return await listasPreciosApi.crearItem(listaId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.precios.listas.items(listaId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.precios.listas.all });
      toast.success('Item agregado a la lista');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al agregar item');
    },
  });

  // Mutation: Eliminar item
  const eliminarMutation = useMutation({
    mutationFn: async (itemId) => {
      return await listasPreciosApi.eliminarItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.precios.listas.items(listaId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.precios.listas.all });
      toast.success('Item eliminado de la lista');
      closeItemModal('deleteItem');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar item');
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setTipoAplicacion('producto');
    setBusquedaProducto('');
    setProductoSeleccionado(null);
    setBusquedaCategoria('');
    setCategoriaSeleccionada(null);
    setTipoDescuento('porcentaje');
    setValorDescuento('');
    setCantidadMinima('1');
  };

  const handleSubmit = () => {
    // Validar seleccion segun tipo de aplicacion
    if (tipoAplicacion === 'producto' && !productoSeleccionado) {
      toast.error('Selecciona un producto');
      return;
    }
    if (tipoAplicacion === 'categoria' && !categoriaSeleccionada) {
      toast.error('Selecciona una categoria');
      return;
    }
    if (!valorDescuento || parseFloat(valorDescuento) <= 0) {
      toast.error('Ingresa un valor valido');
      return;
    }

    const data = {
      cantidad_minima: parseInt(cantidadMinima) || 1,
    };

    // Asignar segun tipo de aplicacion
    if (tipoAplicacion === 'producto') {
      data.producto_id = productoSeleccionado.id;
    } else if (tipoAplicacion === 'categoria') {
      data.categoria_id = categoriaSeleccionada.id;
    }

    if (tipoDescuento === 'fijo') {
      data.precio_fijo = parseFloat(valorDescuento);
    } else {
      data.descuento_pct = parseFloat(valorDescuento);
    }

    crearMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      {/* Header con boton agregar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {items.length} item{items.length !== 1 ? 's' : ''} configurado{items.length !== 1 ? 's' : ''}
        </p>
        <Button
          size="sm"
          variant={showForm ? 'ghost' : 'primary'}
          onClick={() => showForm ? resetForm() : setShowForm(true)}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cerrar
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Agregar Item
            </>
          )}
        </Button>
      </div>

      {/* Formulario para agregar item */}
      {showForm && (
        <div className="border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 space-y-4">
          {/* Selector: Aplicar a */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Aplicar a
            </label>
            <Select
              value={tipoAplicacion}
              onChange={(e) => {
                setTipoAplicacion(e.target.value);
                setProductoSeleccionado(null);
                setCategoriaSeleccionada(null);
                setBusquedaProducto('');
                setBusquedaCategoria('');
              }}
              options={[
                { value: 'producto', label: 'Producto especifico' },
                { value: 'categoria', label: 'Categoria de productos' },
                { value: 'global', label: 'Todos los productos' },
              ]}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tipoAplicacion === 'producto' && 'El precio/descuento aplica solo a este producto'}
              {tipoAplicacion === 'categoria' && 'El precio/descuento aplica a todos los productos de la categoria'}
              {tipoAplicacion === 'global' && 'El precio/descuento aplica a todos los productos sin regla especifica'}
            </p>
          </div>

          {/* Buscador de producto */}
          {tipoAplicacion === 'producto' && !productoSeleccionado && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Buscar Producto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nombre o SKU del producto..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {buscandoProductos && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                </div>
              )}

              {busquedaProducto.length >= 2 && !buscandoProductos && productosDisponibles.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No se encontraron productos disponibles
                </p>
              )}

              {productosDisponibles.length > 0 && (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {productosDisponibles.map((producto) => (
                    <li
                      key={producto.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        setProductoSeleccionado(producto);
                        setBusquedaProducto('');
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {producto.nombre}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          SKU: {producto.sku} | ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-primary-600" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Producto seleccionado */}
          {tipoAplicacion === 'producto' && productoSeleccionado && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {productoSeleccionado.nombre}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  SKU: {productoSeleccionado.sku} | Precio base: ${parseFloat(productoSeleccionado.precio_venta || 0).toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => setProductoSeleccionado(null)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Buscador de categoria */}
          {tipoAplicacion === 'categoria' && !categoriaSeleccionada && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Buscar Categoria
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nombre de la categoria..."
                  value={busquedaCategoria}
                  onChange={(e) => setBusquedaCategoria(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {buscandoCategorias && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                </div>
              )}

              {busquedaCategoria.length >= 2 && !buscandoCategorias && categoriasDisponibles.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No se encontraron categorias disponibles
                </p>
              )}

              {categoriasDisponibles.length > 0 && (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {categoriasDisponibles.map((categoria) => (
                    <li
                      key={categoria.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        setCategoriaSeleccionada(categoria);
                        setBusquedaCategoria('');
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {categoria.nombre}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {categoria.total_productos || 0} productos
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-primary-600" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Categoria seleccionada */}
          {tipoAplicacion === 'categoria' && categoriaSeleccionada && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {categoriaSeleccionada.nombre}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {categoriaSeleccionada.total_productos || 0} productos en esta categoria
                </div>
              </div>
              <button
                onClick={() => setCategoriaSeleccionada(null)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mensaje informativo para global */}
          {tipoAplicacion === 'global' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Esta regla aplicara a todos los productos que no tengan una regla especifica (producto o categoria).
              </p>
            </div>
          )}

          {/* Tipo de descuento y valor */}
          {(productoSeleccionado || categoriaSeleccionada || tipoAplicacion === 'global') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Tipo de Precio
                  </label>
                  <Select
                    value={tipoDescuento}
                    onChange={(e) => {
                      setTipoDescuento(e.target.value);
                      setValorDescuento('');
                    }}
                    options={[
                      { value: 'porcentaje', label: 'Descuento %' },
                      { value: 'fijo', label: 'Precio Fijo' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    {tipoDescuento === 'fijo' ? 'Precio ($)' : 'Descuento (%)'}
                  </label>
                  <div className="relative">
                    {tipoDescuento === 'fijo' ? (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    ) : (
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <Input
                      type="number"
                      min="0"
                      step={tipoDescuento === 'fijo' ? '0.01' : '1'}
                      max={tipoDescuento === 'porcentaje' ? '100' : undefined}
                      placeholder={tipoDescuento === 'fijo' ? '100.00' : '15'}
                      value={valorDescuento}
                      onChange={(e) => setValorDescuento(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Cantidad Minima (opcional)
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={cantidadMinima}
                  onChange={(e) => setCantidadMinima(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El precio especial aplica desde esta cantidad
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={crearMutation.isPending}
                >
                  {crearMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Agregar'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Lista de items */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay items configurados
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Los productos usaran el descuento global de la lista
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-gray-800">
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2">Producto</th>
                <th className="pb-2">Cant. Min.</th>
                <th className="pb-2">Precio/Dto.</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item) => (
                <tr key={item.id} className="text-sm group">
                  <td className="py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {item.producto_nombre || item.categoria_nombre || 'Todos'}
                    </div>
                    {item.producto_sku && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        SKU: {item.producto_sku}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {item.cantidad_minima > 1 ? `≥ ${item.cantidad_minima}` : '-'}
                  </td>
                  <td className="py-3">
                    {item.precio_fijo ? (
                      <span className="text-gray-900 dark:text-gray-100">
                        ${item.precio_fijo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    ) : item.descuento_pct ? (
                      <span className="text-green-600 dark:text-green-400">
                        -{item.descuento_pct}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => openItemModal('deleteItem', item)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm: Eliminar item */}
      <ConfirmDialog
        isOpen={isItemOpen('deleteItem')}
        onClose={() => closeItemModal('deleteItem')}
        onConfirm={() => eliminarMutation.mutate(getItemModalData('deleteItem')?.id)}
        title="Eliminar Item"
        message={`Eliminar "${getItemModalData('deleteItem')?.producto_nombre || getItemModalData('deleteItem')?.categoria_nombre}" de esta lista? El producto volvera a usar el descuento global.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}
