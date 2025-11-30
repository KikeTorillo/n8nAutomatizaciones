import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Package,
  Building2,
  Calendar,
  Search
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FieldWrapper from '@/components/forms/FieldWrapper';
import { useToast } from '@/hooks/useToast';
import { useCrearOrdenCompra, useActualizarOrdenCompra, useAgregarItemsOrdenCompra } from '@/hooks/useOrdenesCompra';
import { useProveedores } from '@/hooks/useProveedores';
import { useProductos } from '@/hooks/useProductos';

/**
 * Schema de validación para la orden
 */
const ordenSchema = z.object({
  proveedor_id: z.coerce.number().min(1, 'Selecciona un proveedor'),
  fecha_entrega_esperada: z.string().optional(),
  dias_credito: z.coerce.number().min(0).default(0),
  descuento_porcentaje: z.preprocess(
    (val) => (val === '' || val === null) ? undefined : val,
    z.coerce.number().min(0).max(100).optional()
  ),
  notas: z.string().max(500).optional(),
  referencia_proveedor: z.string().max(100).optional(),
});

/**
 * Modal para crear/editar órdenes de compra
 */
export default function OrdenCompraFormModal({ isOpen, onClose, orden = null, mode = 'create' }) {
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();
  const esEdicion = mode === 'edit' && orden;

  // Estado para items
  const [items, setItems] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadItem, setCantidadItem] = useState(1);
  const [precioItem, setPrecioItem] = useState('');

  // Queries
  const { data: proveedoresData } = useProveedores({ activo: true, limit: 100 });
  const proveedores = proveedoresData?.proveedores || [];

  const { data: productosData } = useProductos({ busqueda: busquedaProducto, activo: true, limit: 50 });
  const productos = productosData?.productos || [];

  // Mutations
  const crearMutation = useCrearOrdenCompra();
  const actualizarMutation = useActualizarOrdenCompra();
  const agregarItemsMutation = useAgregarItemsOrdenCompra();
  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      proveedor_id: '',
      fecha_entrega_esperada: '',
      dias_credito: 0,
      descuento_porcentaje: '',
      notas: '',
      referencia_proveedor: '',
    },
  });

  const proveedorId = watch('proveedor_id');

  // Cargar días de crédito del proveedor seleccionado
  useEffect(() => {
    if (proveedorId && !esEdicion) {
      const proveedor = proveedores.find(p => p.id === parseInt(proveedorId));
      if (proveedor) {
        setValue('dias_credito', proveedor.dias_credito || 0);
      }
    }
  }, [proveedorId, proveedores, setValue, esEdicion]);

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && orden) {
      reset({
        proveedor_id: orden.proveedor_id || '',
        fecha_entrega_esperada: orden.fecha_entrega_esperada
          ? new Date(orden.fecha_entrega_esperada).toISOString().split('T')[0]
          : '',
        dias_credito: orden.dias_credito || 0,
        descuento_porcentaje: orden.descuento_porcentaje || '',
        notas: orden.notas || '',
        referencia_proveedor: orden.referencia_proveedor || '',
      });
      // No cargamos items aquí porque se editan desde el detalle
      setItems([]);
    } else {
      reset({
        proveedor_id: '',
        fecha_entrega_esperada: '',
        dias_credito: 0,
        descuento_porcentaje: '',
        notas: '',
        referencia_proveedor: '',
      });
      setItems([]);
    }
  }, [esEdicion, orden, reset, isOpen]);

  // Calcular totales
  const calcularTotales = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.cantidad_ordenada * item.precio_unitario);
    }, 0);
    return { subtotal };
  };

  const { subtotal } = calcularTotales();

  // Handlers de items
  const handleAgregarItem = () => {
    if (!productoSeleccionado) {
      showWarning('Selecciona un producto');
      return;
    }
    if (cantidadItem <= 0) {
      showWarning('La cantidad debe ser mayor a 0');
      return;
    }

    // Verificar si ya existe
    const existe = items.find(i => i.producto_id === productoSeleccionado.id);
    if (existe) {
      showWarning('Este producto ya está en la lista');
      return;
    }

    const precio = precioItem ? parseFloat(precioItem) : (productoSeleccionado.precio_costo || 0);

    setItems([...items, {
      producto_id: productoSeleccionado.id,
      producto_nombre: productoSeleccionado.nombre,
      producto_sku: productoSeleccionado.sku,
      cantidad_ordenada: cantidadItem,
      precio_unitario: precio,
    }]);

    // Reset
    setProductoSeleccionado(null);
    setBusquedaProducto('');
    setCantidadItem(1);
    setPrecioItem('');
  };

  const handleEliminarItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleActualizarCantidad = (index, cantidad) => {
    const nuevosItems = [...items];
    nuevosItems[index].cantidad_ordenada = parseInt(cantidad) || 0;
    setItems(nuevosItems);
  };

  const handleActualizarPrecio = (index, precio) => {
    const nuevosItems = [...items];
    nuevosItems[index].precio_unitario = parseFloat(precio) || 0;
    setItems(nuevosItems);
  };

  // Submit
  const onSubmit = async (data) => {
    const payload = {
      proveedor_id: parseInt(data.proveedor_id),
      fecha_entrega_esperada: data.fecha_entrega_esperada || undefined,
      dias_credito: data.dias_credito,
      descuento_porcentaje: data.descuento_porcentaje || undefined,
      notas: data.notas?.trim() || undefined,
      referencia_proveedor: data.referencia_proveedor?.trim() || undefined,
    };

    if (esEdicion) {
      // Solo actualizar datos de la orden
      mutation.mutate(
        { id: orden.id, data: payload },
        {
          onSuccess: () => {
            showSuccess('Orden actualizada correctamente');
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al actualizar la orden');
          },
        }
      );
    } else {
      // Crear nueva orden
      if (items.length === 0) {
        showWarning('Agrega al menos un producto a la orden');
        return;
      }

      payload.items = items.map(item => ({
        producto_id: item.producto_id,
        cantidad_ordenada: item.cantidad_ordenada,
        precio_unitario: item.precio_unitario,
      }));

      mutation.mutate(payload, {
        onSuccess: () => {
          showSuccess('Orden de compra creada correctamente');
          onClose();
        },
        onError: (err) => {
          showError(err.message || 'Error al crear la orden');
        },
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
      size="4xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-gray-600" />
            Información de la Orden
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldWrapper label="Proveedor" error={errors.proveedor_id?.message} required>
              <select
                {...register('proveedor_id')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={esEdicion}
              >
                <option value="">Selecciona un proveedor</option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </FieldWrapper>

            <FieldWrapper label="Fecha de Entrega Esperada" error={errors.fecha_entrega_esperada?.message}>
              <input
                type="date"
                {...register('fecha_entrega_esperada')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </FieldWrapper>

            <FieldWrapper label="Días de Crédito" error={errors.dias_credito?.message}>
              <input
                type="number"
                min="0"
                {...register('dias_credito')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </FieldWrapper>

            <FieldWrapper label="Descuento (%)" error={errors.descuento_porcentaje?.message}>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register('descuento_porcentaje')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </FieldWrapper>

            <FieldWrapper label="Referencia del Proveedor" error={errors.referencia_proveedor?.message}>
              <input
                type="text"
                {...register('referencia_proveedor')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="# Cotización o referencia"
              />
            </FieldWrapper>
          </div>

          <div className="mt-4">
            <FieldWrapper label="Notas" error={errors.notas?.message}>
              <textarea
                {...register('notas')}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Notas adicionales para la orden"
              />
            </FieldWrapper>
          </div>
        </div>

        {/* Agregar productos (solo al crear) */}
        {!esEdicion && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-gray-600" />
              Productos de la Orden
            </h3>

            {/* Buscador de productos */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Producto
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Buscar por nombre o SKU..."
                  />
                </div>
                {/* Lista de productos */}
                {busquedaProducto && productos.length > 0 && !productoSeleccionado && (
                  <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {productos.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          setProductoSeleccionado(prod);
                          setBusquedaProducto(prod.nombre);
                          setPrecioItem(prod.precio_costo || '');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium text-sm text-gray-900">{prod.nombre}</div>
                        <div className="text-xs text-gray-500">
                          SKU: {prod.sku || 'N/A'} | Stock: {prod.stock_actual || 0} | Costo: ${prod.precio_costo || 0}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {productoSeleccionado && (
                  <div className="mt-1 text-sm text-green-600">
                    Seleccionado: {productoSeleccionado.nombre}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={cantidadItem}
                  onChange={(e) => setCantidadItem(parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Unitario
                </label>
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
                  type="button"
                  variant="secondary"
                  onClick={handleAgregarItem}
                  icon={Plus}
                  className="w-full"
                >
                  Agregar
                </Button>
              </div>
            </div>

            {/* Lista de items */}
            {items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Cantidad
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Precio Unit.
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Subtotal
                      </th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">{item.producto_nombre}</div>
                          {item.producto_sku && (
                            <div className="text-xs text-gray-500">SKU: {item.producto_sku}</div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad_ordenada}
                            onChange={(e) => handleActualizarCantidad(index, e.target.value)}
                            className="w-20 text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precio_unitario}
                            onChange={(e) => handleActualizarPrecio(index, e.target.value)}
                            className="w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                          ${(item.cantidad_ordenada * item.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => handleEliminarItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                        Subtotal:
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                        ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay productos agregados</p>
                <p className="text-sm">Busca y agrega productos para la orden</p>
              </div>
            )}
          </div>
        )}

        {esEdicion && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Para editar los items de la orden, utiliza la vista de detalle de la orden.
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
            icon={esEdicion ? undefined : ShoppingCart}
          >
            {esEdicion ? 'Guardar Cambios' : 'Crear Orden'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
