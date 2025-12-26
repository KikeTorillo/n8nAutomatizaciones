import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Package, MapPin, Search } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import {
  useUbicaciones,
  useMoverStockUbicacion,
  useStockUbicacion,
} from '@/hooks/useInventario';

// Schema de validación
const moverStockSchema = z.object({
  producto_id: z.coerce.number().min(1, 'Selecciona un producto'),
  ubicacion_origen_id: z.coerce.number().min(1, 'Selecciona ubicación de origen'),
  ubicacion_destino_id: z.coerce.number().min(1, 'Selecciona ubicación de destino'),
  cantidad: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
  lote: z.string().optional().or(z.literal('')),
}).refine(data => data.ubicacion_origen_id !== data.ubicacion_destino_id, {
  message: 'Las ubicaciones de origen y destino deben ser diferentes',
  path: ['ubicacion_destino_id'],
});

/**
 * Drawer para mover stock entre ubicaciones
 */
function MoverStockDrawer({ isOpen, onClose, sucursalId }) {
  const { success: showSuccess, error: showError } = useToast();
  const [busquedaOrigen, setBusquedaOrigen] = useState('');
  const [busquedaDestino, setBusquedaDestino] = useState('');

  const moverMutation = useMoverStockUbicacion();

  // Obtener ubicaciones (solo bins y estantes para mover stock)
  const { data: ubicacionesData } = useUbicaciones({
    sucursal_id: sucursalId,
    activo: true,
    limit: 500,
  });
  const ubicaciones = ubicacionesData?.ubicaciones || [];

  // Solo ubicaciones tipo bin o estante pueden tener stock
  const ubicacionesConStock = ubicaciones.filter(u => ['bin', 'estante'].includes(u.tipo));

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(moverStockSchema),
    defaultValues: {
      producto_id: 0,
      ubicacion_origen_id: 0,
      ubicacion_destino_id: 0,
      cantidad: 1,
      lote: '',
    },
  });

  const ubicacionOrigenId = watch('ubicacion_origen_id');
  const productoSeleccionadoId = watch('producto_id');

  // Obtener stock de la ubicación origen seleccionada
  const { data: stockOrigen, isLoading: cargandoStock } = useStockUbicacion(ubicacionOrigenId);
  const productosEnOrigen = stockOrigen || [];

  // Producto seleccionado
  const productoSeleccionado = productosEnOrigen.find(p => p.producto_id === productoSeleccionadoId);

  // Resetear al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset();
      setBusquedaOrigen('');
      setBusquedaDestino('');
    }
  }, [isOpen, reset]);

  // Resetear producto cuando cambia origen
  useEffect(() => {
    setValue('producto_id', 0);
    setValue('cantidad', 1);
    setValue('lote', '');
  }, [ubicacionOrigenId, setValue]);

  // Filtrar ubicaciones
  const ubicacionesOrigenFiltradas = ubicacionesConStock.filter(u =>
    !busquedaOrigen ||
    u.codigo.toLowerCase().includes(busquedaOrigen.toLowerCase()) ||
    (u.nombre && u.nombre.toLowerCase().includes(busquedaOrigen.toLowerCase()))
  );

  const ubicacionesDestinoFiltradas = ubicacionesConStock.filter(u =>
    u.id !== parseInt(ubicacionOrigenId) &&
    (!busquedaDestino ||
      u.codigo.toLowerCase().includes(busquedaDestino.toLowerCase()) ||
      (u.nombre && u.nombre.toLowerCase().includes(busquedaDestino.toLowerCase())))
  );

  const onSubmit = async (data) => {
    // Sanitizar
    const sanitized = {
      ...data,
      lote: data.lote || undefined,
    };

    try {
      await moverMutation.mutateAsync(sanitized);
      showSuccess(`Stock movido correctamente (${data.cantidad} unidades)`);
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Error al mover stock');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Mover Stock entre Ubicaciones"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Selecciona la ubicación de origen, el producto a mover y la ubicación de destino.
            </p>
          </div>

          {/* Ubicación Origen */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              Ubicación de Origen
            </h3>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar ubicación origen..."
                value={busquedaOrigen}
                onChange={(e) => setBusquedaOrigen(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              {...register('ubicacion_origen_id')}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            >
              <option value={0}>Selecciona una ubicación</option>
              {ubicacionesOrigenFiltradas.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.codigo} {u.nombre ? `- ${u.nombre}` : ''} ({u.tipo})
                </option>
              ))}
            </select>
            {errors.ubicacion_origen_id && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.ubicacion_origen_id.message}</p>
            )}
          </div>

          {/* Producto a Mover */}
          {ubicacionOrigenId > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package className="h-4 w-4 text-primary-500" />
                Producto a Mover
              </h3>

              {cargandoStock ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : productosEnOrigen.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No hay productos en esta ubicación
                </p>
              ) : (
                <>
                  <select
                    {...register('producto_id')}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={0}>Selecciona un producto</option>
                    {productosEnOrigen.map((item) => (
                      <option key={`${item.producto_id}-${item.lote || 'sin-lote'}`} value={item.producto_id}>
                        {item.producto_nombre} - {item.cantidad} unidades {item.lote ? `(Lote: ${item.lote})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.producto_id && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.producto_id.message}</p>
                  )}

                  {/* Cantidad */}
                  {productoSeleccionado && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cantidad a mover *
                        </label>
                        <input
                          type="number"
                          {...register('cantidad')}
                          min="1"
                          max={productoSeleccionado.cantidad}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Disponible: {productoSeleccionado.cantidad}
                        </p>
                        {errors.cantidad && (
                          <p className="text-xs text-red-600 dark:text-red-400">{errors.cantidad.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Lote
                        </label>
                        <input
                          type="text"
                          {...register('lote')}
                          placeholder={productoSeleccionado.lote || 'Sin lote'}
                          defaultValue={productoSeleccionado.lote || ''}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Flecha visual */}
          {productoSeleccionadoId > 0 && (
            <div className="flex justify-center">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
                <ArrowRight className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          )}

          {/* Ubicación Destino */}
          {productoSeleccionadoId > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                Ubicación de Destino
              </h3>

              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar ubicación destino..."
                  value={busquedaDestino}
                  onChange={(e) => setBusquedaDestino(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <select
                {...register('ubicacion_destino_id')}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              >
                <option value={0}>Selecciona una ubicación</option>
                {ubicacionesDestinoFiltradas.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.codigo} {u.nombre ? `- ${u.nombre}` : ''} ({u.tipo})
                  </option>
                ))}
              </select>
              {errors.ubicacion_destino_id && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.ubicacion_destino_id.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting || moverMutation.isPending}
              disabled={!productoSeleccionadoId}
            >
              Mover Stock
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
}

export default MoverStockDrawer;
