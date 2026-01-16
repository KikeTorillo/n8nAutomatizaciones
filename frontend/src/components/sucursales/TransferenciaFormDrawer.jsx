import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Package,
  Search,
} from 'lucide-react';
import {
  Button,
  Drawer,
  Input,
  Select
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import {
  useSucursales,
  useCrearTransferencia,
} from '@/hooks/useSucursales';
import { useProductos } from '@/hooks/useProductos';
import useSucursalStore from '@/store/sucursalStore';

// Schema de validación
const transferenciaSchema = z.object({
  sucursal_origen_id: z.number({ required_error: 'Selecciona la sucursal de origen' }),
  sucursal_destino_id: z.number({ required_error: 'Selecciona la sucursal de destino' }),
  notas: z.string().max(500).optional(),
}).refine((data) => data.sucursal_origen_id !== data.sucursal_destino_id, {
  message: 'Las sucursales de origen y destino deben ser diferentes',
  path: ['sucursal_destino_id'],
});

/**
 * Modal/Drawer para crear una nueva transferencia de stock
 */
function TransferenciaFormDrawer({ isOpen, onClose }) {
  const toast = useToast();
  const { sucursalActiva } = useSucursalStore();

  // Estado para items de la transferencia
  const [items, setItems] = useState([]);
  const [searchProducto, setSearchProducto] = useState('');
  const [showProductoSearch, setShowProductoSearch] = useState(false);

  // Fetch datos
  const { data: sucursales } = useSucursales({ activo: true });
  const { data: productosData } = useProductos({ busqueda: searchProducto, activo: true });
  const productos = productosData?.productos || [];

  // Mutation
  const crearMutation = useCrearTransferencia();

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(transferenciaSchema),
    defaultValues: {
      sucursal_origen_id: sucursalActiva?.id || '',
      sucursal_destino_id: '',
      notas: '',
    },
  });

  const sucursalOrigenId = watch('sucursal_origen_id');

  // Reset form cuando se abre
  useEffect(() => {
    if (isOpen) {
      reset({
        sucursal_origen_id: sucursalActiva?.id || '',
        sucursal_destino_id: '',
        notas: '',
      });
      setItems([]);
      setSearchProducto('');
    }
  }, [isOpen, reset, sucursalActiva]);

  // Agregar producto a la lista
  const handleAgregarProducto = (producto) => {
    if (items.find((i) => i.producto_id === producto.id)) {
      toast.error('El producto ya está en la lista');
      return;
    }

    setItems([
      ...items,
      {
        producto_id: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        stock_actual: producto.stock_actual || 0,
        cantidad_enviada: 1,
      },
    ]);

    setSearchProducto('');
    setShowProductoSearch(false);
  };

  // Actualizar cantidad de un item
  const handleCantidadChange = (index, cantidad) => {
    const newItems = [...items];
    newItems[index].cantidad_enviada = Math.max(1, parseInt(cantidad) || 1);
    setItems(newItems);
  };

  // Eliminar item
  const handleEliminarItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit
  const onSubmit = async (data) => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto a la transferencia');
      return;
    }

    // Validar cantidades vs stock
    const itemsInvalidos = items.filter((i) => i.cantidad_enviada > i.stock_actual);
    if (itemsInvalidos.length > 0) {
      toast.error(`Stock insuficiente para: ${itemsInvalidos.map((i) => i.nombre).join(', ')}`);
      return;
    }

    try {
      await crearMutation.mutateAsync({
        ...data,
        items: items.map((i) => ({
          producto_id: i.producto_id,
          cantidad_enviada: i.cantidad_enviada,
        })),
      });

      toast.success('Transferencia creada correctamente');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al crear transferencia');
    }
  };

  // Opciones de sucursales (excluyendo la de origen para destino)
  const sucursalesOptions = [
    { value: '', label: 'Seleccionar sucursal' },
    ...(sucursales?.map((s) => ({ value: s.id, label: s.nombre })) || []),
  ];

  const sucursalesDestinoOptions = sucursalesOptions.filter(
    (s) => s.value === '' || s.value !== parseInt(sucursalOrigenId)
  );

  // Productos filtrados (excluir los ya agregados)
  const productosFiltrados = productos.filter(
    (p) => !items.find((i) => i.producto_id === p.id)
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Transferencia"
      subtitle="Mueve productos entre sucursales"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Sucursales */}
          <div className="grid grid-cols-1 gap-4">
            <Select
              label="Sucursal Origen *"
              {...register('sucursal_origen_id', { valueAsNumber: true })}
              options={sucursalesOptions}
              error={errors.sucursal_origen_id?.message}
            />

            <div className="flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-gray-400" />
            </div>

            <Select
              label="Sucursal Destino *"
              {...register('sucursal_destino_id', { valueAsNumber: true })}
              options={sucursalesDestinoOptions}
              error={errors.sucursal_destino_id?.message}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas (opcional)
            </label>
            <textarea
              {...register('notas')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Productos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Productos a transferir
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
                  />
                </div>

                {searchProducto && productosFiltrados.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {productosFiltrados.slice(0, 10).map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => handleAgregarProducto(producto)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {producto.nombre}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            SKU: {producto.sku}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Stock: {producto.stock_actual || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchProducto && productosFiltrados.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No se encontraron productos
                  </p>
                )}
              </div>
            )}

            {/* Lista de items */}
            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay productos agregados
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Usa el botón "Agregar" para buscar productos
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.producto_id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SKU: {item.sku} | Stock: {item.stock_actual}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={item.stock_actual}
                        value={item.cantidad_enviada}
                        onChange={(e) => handleCantidadChange(index, e.target.value)}
                        className="w-20 text-center"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Resumen */}
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total productos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Total unidades:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {items.reduce((sum, i) => sum + i.cantidad_enviada, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={crearMutation.isPending || items.length === 0}
            className="flex-1"
          >
            {crearMutation.isPending ? 'Creando...' : 'Crear Transferencia'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default TransferenciaFormDrawer;
