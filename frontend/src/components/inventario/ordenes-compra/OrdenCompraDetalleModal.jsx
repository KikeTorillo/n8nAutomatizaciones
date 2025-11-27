import { useState } from 'react';
import {
  ShoppingCart,
  Building2,
  Calendar,
  Package,
  Edit,
  Send,
  DollarSign,
  Trash2,
  Plus,
  Check,
  X
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import {
  useOrdenCompra,
  useAgregarItemsOrdenCompra,
  useActualizarItemOrdenCompra,
  useEliminarItemOrdenCompra,
} from '@/hooks/useOrdenesCompra';
import { useProductos } from '@/hooks/useProductos';

/**
 * Modal para ver detalle de una orden de compra
 * Permite gestionar items si la orden está en borrador
 */
export default function OrdenCompraDetalleModal({
  isOpen,
  onClose,
  ordenId,
  onEditar,
  onEnviar,
  onRecibir,
  onPago,
}) {
  const { showToast } = useToast();

  // Query de la orden
  const { data: orden, isLoading } = useOrdenCompra(ordenId);

  // Estado para agregar items
  const [mostrarAgregarItem, setMostrarAgregarItem] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadItem, setCantidadItem] = useState(1);
  const [precioItem, setPrecioItem] = useState('');

  // Estado para editar item
  const [itemEditando, setItemEditando] = useState(null);
  const [cantidadEditando, setCantidadEditando] = useState(0);
  const [precioEditando, setPrecioEditando] = useState(0);

  // Queries
  const { data: productosData } = useProductos({ busqueda: busquedaProducto, activo: true, limit: 50 });
  const productos = productosData?.productos || [];

  // Mutations
  const agregarItemsMutation = useAgregarItemsOrdenCompra();
  const actualizarItemMutation = useActualizarItemOrdenCompra();
  const eliminarItemMutation = useEliminarItemOrdenCompra();

  if (!ordenId) return null;

  // Helpers de visualización
  const getBadgeEstado = (estado) => {
    const badges = {
      borrador: 'bg-gray-100 text-gray-800',
      enviada: 'bg-blue-100 text-blue-800',
      parcial: 'bg-yellow-100 text-yellow-800',
      recibida: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const getBadgeEstadoPago = (estadoPago) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      parcial: 'bg-orange-100 text-orange-800',
      pagado: 'bg-green-100 text-green-800',
    };
    return badges[estadoPago] || 'bg-gray-100 text-gray-800';
  };

  const getBadgeEstadoItem = (estado) => {
    const badges = {
      pendiente: 'bg-gray-100 text-gray-800',
      parcial: 'bg-yellow-100 text-yellow-800',
      completo: 'bg-green-100 text-green-800',
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const formatearEstado = (estado) => {
    const estados = {
      borrador: 'Borrador',
      enviada: 'Enviada',
      parcial: 'Parcial',
      recibida: 'Recibida',
      cancelada: 'Cancelada',
    };
    return estados[estado] || estado;
  };

  // Handlers de items
  const handleAgregarItem = () => {
    if (!productoSeleccionado) {
      showToast('Selecciona un producto', 'warning');
      return;
    }
    if (cantidadItem <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    const precio = precioItem ? parseFloat(precioItem) : (productoSeleccionado.precio_costo || 0);

    agregarItemsMutation.mutate(
      {
        ordenId: orden.id,
        items: [{
          producto_id: productoSeleccionado.id,
          cantidad_ordenada: cantidadItem,
          precio_unitario: precio,
        }],
      },
      {
        onSuccess: () => {
          showToast('Producto agregado correctamente', 'success');
          setMostrarAgregarItem(false);
          setProductoSeleccionado(null);
          setBusquedaProducto('');
          setCantidadItem(1);
          setPrecioItem('');
        },
        onError: (error) => {
          showToast(
            error.response?.data?.mensaje || 'Error al agregar el producto',
            'error'
          );
        },
      }
    );
  };

  const handleIniciarEdicion = (item) => {
    setItemEditando(item.id);
    setCantidadEditando(item.cantidad_ordenada);
    setPrecioEditando(item.precio_unitario);
  };

  const handleGuardarEdicion = (itemId) => {
    actualizarItemMutation.mutate(
      {
        ordenId: orden.id,
        itemId,
        data: {
          cantidad_ordenada: cantidadEditando,
          precio_unitario: precioEditando,
        },
      },
      {
        onSuccess: () => {
          showToast('Item actualizado correctamente', 'success');
          setItemEditando(null);
        },
        onError: (error) => {
          showToast(
            error.response?.data?.mensaje || 'Error al actualizar el item',
            'error'
          );
        },
      }
    );
  };

  const handleCancelarEdicion = () => {
    setItemEditando(null);
  };

  const handleEliminarItem = (itemId) => {
    if (!confirm('¿Estás seguro de eliminar este producto de la orden?')) return;

    eliminarItemMutation.mutate(
      { ordenId: orden.id, itemId },
      {
        onSuccess: () => {
          showToast('Producto eliminado de la orden', 'success');
        },
        onError: (error) => {
          showToast(
            error.response?.data?.mensaje || 'Error al eliminar el producto',
            'error'
          );
        },
      }
    );
  };

  const esBorrador = orden?.estado === 'borrador';
  const items = orden?.items || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Orden de Compra ${orden?.folio || ''}`}
      size="4xl"
    >
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          Cargando detalle de la orden...
        </div>
      ) : orden ? (
        <div className="space-y-6">
          {/* Información de la orden */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Datos del proveedor */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Proveedor
              </h3>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-gray-900">{orden.proveedor_nombre}</p>
                {orden.proveedor_telefono && (
                  <p className="text-sm text-gray-600">Tel: {orden.proveedor_telefono}</p>
                )}
                {orden.proveedor_email && (
                  <p className="text-sm text-gray-600">{orden.proveedor_email}</p>
                )}
              </div>
            </div>

            {/* Fechas y estado */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Fechas y Estado
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Fecha de Orden</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(orden.fecha_orden).toLocaleDateString('es-MX')}
                  </p>
                </div>
                {orden.fecha_entrega_esperada && (
                  <div>
                    <p className="text-xs text-gray-500">Entrega Esperada</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(orden.fecha_entrega_esperada).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getBadgeEstado(orden.estado)}`}>
                    {formatearEstado(orden.estado)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado de Pago</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getBadgeEstadoPago(orden.estado_pago)}`}>
                    {orden.estado_pago}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-3">
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-lg font-semibold text-gray-900">
                ${parseFloat(orden.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {parseFloat(orden.descuento_monto || 0) > 0 && (
              <div className="bg-white border rounded-lg p-3">
                <p className="text-xs text-gray-500">Descuento</p>
                <p className="text-lg font-semibold text-red-600">
                  -${parseFloat(orden.descuento_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-xs text-indigo-600">Total</p>
              <p className="text-lg font-bold text-indigo-700">
                ${parseFloat(orden.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600">Pagado</p>
              <p className="text-lg font-semibold text-green-700">
                ${parseFloat(orden.monto_pagado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Información adicional */}
          {(orden.referencia_proveedor || orden.notas || orden.dias_credito > 0) && (
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {orden.referencia_proveedor && (
                <div>
                  <p className="text-xs text-gray-500">Referencia Proveedor</p>
                  <p className="text-sm font-medium text-gray-900">{orden.referencia_proveedor}</p>
                </div>
              )}
              {orden.dias_credito > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Días de Crédito</p>
                  <p className="text-sm font-medium text-gray-900">{orden.dias_credito} días</p>
                </div>
              )}
              {orden.notas && (
                <div className="md:col-span-3">
                  <p className="text-xs text-gray-500">Notas</p>
                  <p className="text-sm text-gray-900">{orden.notas}</p>
                </div>
              )}
            </div>
          )}

          {/* Items de la orden */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-gray-600" />
                Productos ({items.length})
              </h3>
              {esBorrador && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMostrarAgregarItem(!mostrarAgregarItem)}
                  icon={mostrarAgregarItem ? X : Plus}
                >
                  {mostrarAgregarItem ? 'Cancelar' : 'Agregar Producto'}
                </Button>
              )}
            </div>

            {/* Formulario para agregar item */}
            {mostrarAgregarItem && esBorrador && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar Producto
                    </label>
                    <input
                      type="text"
                      value={busquedaProducto}
                      onChange={(e) => setBusquedaProducto(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Buscar por nombre o SKU..."
                    />
                    {busquedaProducto && productos.length > 0 && !productoSeleccionado && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                        {productos.map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => {
                              setProductoSeleccionado(prod);
                              setBusquedaProducto(prod.nombre);
                              setPrecioItem(prod.precio_costo || '');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="text-sm font-medium text-gray-900">{prod.nombre}</div>
                            <div className="text-xs text-gray-500">
                              SKU: {prod.sku || 'N/A'} | Costo: ${prod.precio_costo || 0}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {productoSeleccionado && (
                      <p className="mt-1 text-xs text-green-600">
                        Seleccionado: {productoSeleccionado.nombre}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={cantidadItem}
                      onChange={(e) => setCantidadItem(parseInt(e.target.value) || 1)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unit.</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precioItem}
                      onChange={(e) => setPrecioItem(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Precio costo"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <Button
                      variant="primary"
                      onClick={handleAgregarItem}
                      isLoading={agregarItemsMutation.isPending}
                      className="w-full"
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de items */}
            {items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Cantidad
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Recibido
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Precio Unit.
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Subtotal
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      {esBorrador && (
                        <th className="px-4 py-2 w-20"></th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">{item.producto_nombre}</div>
                          {item.producto_sku && (
                            <div className="text-xs text-gray-500">SKU: {item.producto_sku}</div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {itemEditando === item.id ? (
                            <input
                              type="number"
                              min="1"
                              value={cantidadEditando}
                              onChange={(e) => setCantidadEditando(parseInt(e.target.value) || 0)}
                              className="w-20 text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{item.cantidad_ordenada}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="text-sm text-gray-900">{item.cantidad_recibida || 0}</span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {itemEditando === item.id ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={precioEditando}
                              onChange={(e) => setPrecioEditando(parseFloat(e.target.value) || 0)}
                              className="w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">
                              ${parseFloat(item.precio_unitario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            ${parseFloat(item.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getBadgeEstadoItem(item.estado)}`}>
                            {item.estado}
                          </span>
                        </td>
                        {esBorrador && (
                          <td className="px-4 py-2">
                            <div className="flex justify-end gap-1">
                              {itemEditando === item.id ? (
                                <>
                                  <button
                                    onClick={() => handleGuardarEdicion(item.id)}
                                    className="p-1 text-green-600 hover:text-green-900"
                                    disabled={actualizarItemMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelarEdicion}
                                    className="p-1 text-gray-600 hover:text-gray-900"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleIniciarEdicion(item)}
                                    className="p-1 text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEliminarItem(item.id)}
                                    className="p-1 text-red-600 hover:text-red-900"
                                    disabled={eliminarItemMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay productos en esta orden</p>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <div className="flex gap-2">
              {esBorrador && (
                <>
                  <Button variant="outline" onClick={() => onEditar(orden)} icon={Edit}>
                    Editar Orden
                  </Button>
                  {items.length > 0 && (
                    <Button variant="primary" onClick={() => onEnviar(orden)} icon={Send}>
                      Enviar al Proveedor
                    </Button>
                  )}
                </>
              )}
              {['enviada', 'parcial'].includes(orden.estado) && (
                <Button variant="success" onClick={() => onRecibir(orden)} icon={Package}>
                  Recibir Mercancía
                </Button>
              )}
              {orden.estado !== 'cancelada' && orden.estado !== 'borrador' && orden.estado_pago !== 'pagado' && (
                <Button variant="primary" onClick={() => onPago(orden)} icon={DollarSign}>
                  Registrar Pago
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          No se encontró la orden de compra
        </div>
      )}
    </Modal>
  );
}
