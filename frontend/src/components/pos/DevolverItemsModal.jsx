import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Package } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/hooks/useToast';
import useAuthStore from '@/store/authStore';
import { useVenta, useDevolverItems } from '@/hooks/useVentas';

/**
 * Modal para procesar devolución de items de una venta
 * Permite devolución parcial o total con ajuste automático de stock
 */
export default function DevolverItemsModal({ isOpen, onClose, venta }) {
  const toast = useToast();
  const { user } = useAuthStore();
  const devolverMutation = useDevolverItems();

  // Obtener detalle de la venta con items
  const { data: ventaData } = useVenta(venta?.id);
  const items = ventaData?.items || [];

  const [itemsDevolver, setItemsDevolver] = useState([]);
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState({});

  // Inicializar items cuando se abra el modal
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setItemsDevolver(
        items.map((item) => ({
          venta_pos_item_id: item.id,
          producto_id: item.producto_id,
          cantidad_devolver: 0,
          cantidad_original: item.cantidad,
          producto_nombre: item.producto_nombre,
          producto_sku: item.producto_sku,
          precio_unitario: item.precio_unitario,
        }))
      );
    }
  }, [isOpen, items]);

  const handleCantidadChange = (itemId, cantidad) => {
    const cantidadNum = parseInt(cantidad) || 0;
    setItemsDevolver((prev) =>
      prev.map((item) =>
        item.venta_pos_item_id === itemId
          ? { ...item, cantidad_devolver: Math.min(cantidadNum, item.cantidad_original) }
          : item
      )
    );
  };

  const handleSeleccionarTodo = () => {
    setItemsDevolver((prev) =>
      prev.map((item) => ({
        ...item,
        cantidad_devolver: item.cantidad_original,
      }))
    );
  };

  const handleLimpiarSeleccion = () => {
    setItemsDevolver((prev) =>
      prev.map((item) => ({
        ...item,
        cantidad_devolver: 0,
      }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    const nuevosErrores = {};

    // Filtrar items con cantidad > 0
    const itemsParaDevolver = itemsDevolver.filter((item) => item.cantidad_devolver > 0);

    if (itemsParaDevolver.length === 0) {
      nuevosErrores.items = 'Debes seleccionar al menos un item para devolver';
    }

    if (!motivo.trim()) {
      nuevosErrores.motivo = 'El motivo de devolución es requerido';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    // Preparar datos para el backend
    const itemsFormateados = itemsParaDevolver.map((item) => ({
      venta_pos_item_id: item.venta_pos_item_id,
      cantidad_devolver: item.cantidad_devolver,
    }));

    // Confirmar acción
    const totalItems = itemsFormateados.reduce((sum, item) => sum + item.cantidad_devolver, 0);
    if (
      !window.confirm(
        `¿Confirmas la devolución de ${totalItems} item(s)? El stock se ajustará automáticamente.`
      )
    ) {
      return;
    }

    try {
      await devolverMutation.mutateAsync({
        id: venta.id,
        items_devueltos: itemsFormateados,
        motivo: motivo.trim(),
        usuario_id: user.id,
      });

      toast.success('Devolución procesada exitosamente. Stock ajustado.');
      handleClose();
    } catch (error) {
      console.error('Error al procesar devolución:', error);
      toast.error(error.response?.data?.mensaje || 'Error al procesar la devolución');
    }
  };

  const handleClose = () => {
    setItemsDevolver([]);
    setMotivo('');
    setErrores({});
    onClose();
  };

  if (!isOpen || !venta) return null;

  const totalItemsSeleccionados = itemsDevolver.reduce(
    (sum, item) => sum + item.cantidad_devolver,
    0
  );

  const totalDevolucion = itemsDevolver.reduce(
    (sum, item) => sum + item.cantidad_devolver * parseFloat(item.precio_unitario || 0),
    0
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header personalizado */}
        <div className="flex items-start gap-3">
          <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-lg">
            <RefreshCw className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Procesar Devolución</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Folio: <span className="font-semibold text-gray-900 dark:text-gray-100">{venta.folio}</span>
            </p>
          </div>
        </div>

        {/* Advertencia */}
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-800 dark:text-primary-300">
              <p className="font-semibold mb-1">Información importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Selecciona los items y cantidades a devolver</li>
                <li>El stock se ajustará automáticamente (entrada por devolución)</li>
                <li>Si devuelves todos los items, la venta cambiará a "Devolución Total"</li>
                <li>Si devuelves algunos items, la venta cambiará a "Devolución Parcial"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Selección de items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Items a Devolver <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSeleccionarTodo}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
              >
                Seleccionar todo
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                type="button"
                onClick={handleLimpiarSeleccion}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cantidad Original
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cantidad a Devolver
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Subtotal Devolución
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {itemsDevolver.map((item) => (
                    <tr key={item.venta_pos_item_id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <p className="font-medium">{item.producto_nombre}</p>
                          {item.producto_sku && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.producto_sku}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100">
                        {item.cantidad_original}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.cantidad_original}
                          value={item.cantidad_devolver}
                          onChange={(e) =>
                            handleCantidadChange(item.venta_pos_item_id, e.target.value)
                          }
                          className="w-20 px-2 py-1 text-center rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                        ${parseFloat(item.precio_unitario || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                        ${(item.cantidad_devolver * parseFloat(item.precio_unitario || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {errores.items && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errores.items}</p>}
        </div>

        {/* Resumen de devolución */}
        {totalItemsSeleccionados > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Resumen de Devolución</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Items a devolver:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{totalItemsSeleccionados}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total a reembolsar:</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  ${totalDevolucion.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Motivo de devolución */}
        <Textarea
          label="Motivo de Devolución"
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            if (errores.motivo) {
              setErrores({ ...errores, motivo: null });
            }
          }}
          rows={3}
          placeholder="Describe el motivo de la devolución (ej: Producto defectuoso, Cliente insatisfecho, etc.)"
          error={errores.motivo}
          required
        />

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={devolverMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={devolverMutation.isPending}
            icon={RefreshCw}
            disabled={totalItemsSeleccionados === 0}
          >
            {devolverMutation.isPending ? 'Procesando...' : 'Procesar Devolución'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
