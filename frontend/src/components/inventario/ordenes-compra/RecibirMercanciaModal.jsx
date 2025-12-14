import { useState, useEffect } from 'react';
import { Package, Check, AlertTriangle } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useOrdenCompra, useRecibirMercancia } from '@/hooks/useOrdenesCompra';

/**
 * Modal para registrar recepción de mercancía
 * Permite registrar cantidades recibidas parciales o totales
 */
export default function RecibirMercanciaModal({ isOpen, onClose, orden }) {
  const { showToast } = useToast();

  // Query detalle de la orden
  const { data: ordenDetalle, isLoading } = useOrdenCompra(orden?.id);

  // Estado de recepciones
  const [recepciones, setRecepciones] = useState([]);

  // Mutation
  const recibirMutation = useRecibirMercancia();

  // Inicializar recepciones cuando se carga la orden
  useEffect(() => {
    if (ordenDetalle?.items) {
      const recepcionesIniciales = ordenDetalle.items
        .filter(item => (item.cantidad_ordenada - (item.cantidad_recibida || 0)) > 0)
        .map(item => ({
          item_id: item.id,
          producto_nombre: item.producto_nombre,
          producto_sku: item.producto_sku,
          cantidad_ordenada: item.cantidad_ordenada,
          cantidad_recibida: item.cantidad_recibida || 0,
          cantidad_pendiente: item.cantidad_ordenada - (item.cantidad_recibida || 0),
          cantidad: 0, // Cantidad a recibir ahora
          precio_unitario_real: item.precio_unitario,
          fecha_vencimiento: '',
          lote: '',
          notas: '',
        }));
      setRecepciones(recepcionesIniciales);
    }
  }, [ordenDetalle]);

  const handleCantidadChange = (index, cantidad) => {
    const nuevasRecepciones = [...recepciones];
    const cantidadNum = parseInt(cantidad) || 0;
    const maxPermitido = nuevasRecepciones[index].cantidad_pendiente;
    nuevasRecepciones[index].cantidad = Math.min(Math.max(0, cantidadNum), maxPermitido);
    setRecepciones(nuevasRecepciones);
  };

  const handlePrecioChange = (index, precio) => {
    const nuevasRecepciones = [...recepciones];
    nuevasRecepciones[index].precio_unitario_real = parseFloat(precio) || 0;
    setRecepciones(nuevasRecepciones);
  };

  const handleLoteChange = (index, lote) => {
    const nuevasRecepciones = [...recepciones];
    nuevasRecepciones[index].lote = lote;
    setRecepciones(nuevasRecepciones);
  };

  const handleFechaVencimientoChange = (index, fecha) => {
    const nuevasRecepciones = [...recepciones];
    nuevasRecepciones[index].fecha_vencimiento = fecha;
    setRecepciones(nuevasRecepciones);
  };

  const handleNotasChange = (index, notas) => {
    const nuevasRecepciones = [...recepciones];
    nuevasRecepciones[index].notas = notas;
    setRecepciones(nuevasRecepciones);
  };

  const handleRecibirTodo = () => {
    const nuevasRecepciones = recepciones.map(r => ({
      ...r,
      cantidad: r.cantidad_pendiente,
    }));
    setRecepciones(nuevasRecepciones);
  };

  const handleSubmit = () => {
    const recepcionesAEnviar = recepciones
      .filter(r => r.cantidad > 0)
      .map(r => ({
        item_id: r.item_id,
        cantidad: r.cantidad,
        precio_unitario_real: r.precio_unitario_real || undefined,
        fecha_vencimiento: r.fecha_vencimiento || undefined,
        lote: r.lote?.trim() || undefined,
        notas: r.notas?.trim() || undefined,
      }));

    if (recepcionesAEnviar.length === 0) {
      showToast('Indica al menos una cantidad a recibir', 'warning');
      return;
    }

    recibirMutation.mutate(
      { ordenId: orden.id, recepciones: recepcionesAEnviar },
      {
        onSuccess: () => {
          showToast('Mercancía recibida correctamente', 'success');
          onClose();
        },
        onError: (error) => {
          showToast(
            error.response?.data?.mensaje || 'Error al registrar la recepción',
            'error'
          );
        },
      }
    );
  };

  const totalARecibir = recepciones.reduce((sum, r) => sum + r.cantidad, 0);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Recibir Mercancía - ${orden?.folio || ''}`}
      subtitle="Registra las cantidades recibidas de cada producto"
    >
      {isLoading ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          Cargando items de la orden...
        </div>
      ) : recepciones.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <Check className="h-16 w-16 mx-auto mb-4 text-green-500 dark:text-green-400" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Todos los productos han sido recibidos</p>
          <p className="text-sm mt-1">No hay items pendientes de recepción</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Información */}
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-300">Registro de Recepción</p>
                <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                  Indica la cantidad recibida para cada producto. El inventario se actualizará automáticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Botón recibir todo */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleRecibirTodo}>
              Marcar todo como recibido
            </Button>
          </div>

          {/* Tabla de items */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ordenado
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ya Recibido
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Pendiente
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Recibir Ahora
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Precio Real
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Lote
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recepciones.map((item, index) => (
                  <tr key={item.item_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.producto_nombre}</div>
                      {item.producto_sku && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.producto_sku}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">
                      {item.cantidad_ordenada}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400">
                      {item.cantidad_recibida}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-orange-600 dark:text-orange-400 font-medium">
                      {item.cantidad_pendiente}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={item.cantidad_pendiente}
                        value={item.cantidad}
                        onChange={(e) => handleCantidadChange(index, e.target.value)}
                        className="w-20 text-center rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precio_unitario_real}
                        onChange={(e) => handlePrecioChange(index, e.target.value)}
                        className="w-24 text-right rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.lote}
                        onChange={(e) => handleLoteChange(index, e.target.value)}
                        className="w-24 text-center rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Opcional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Campos adicionales por item (expandible) */}
          {recepciones.some(r => r.cantidad > 0) && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Información Adicional (opcional)
              </h4>
              <div className="space-y-3">
                {recepciones
                  .filter(r => r.cantidad > 0)
                  .map((item, idx) => {
                    const originalIndex = recepciones.findIndex(r => r.item_id === item.item_id);
                    return (
                      <div key={item.item_id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {item.producto_nombre} ({item.cantidad} unidades)
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Fecha de Vencimiento
                            </label>
                            <input
                              type="date"
                              value={item.fecha_vencimiento}
                              onChange={(e) => handleFechaVencimientoChange(originalIndex, e.target.value)}
                              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Notas
                            </label>
                            <input
                              type="text"
                              value={item.notas}
                              onChange={(e) => handleNotasChange(originalIndex, e.target.value)}
                              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                              placeholder="Notas sobre este lote..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Resumen y botones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total a recibir: <span className="font-bold text-primary-600 dark:text-primary-400">{totalARecibir}</span> unidades
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={recibirMutation.isPending}
                disabled={totalARecibir === 0}
                icon={Package}
              >
                Confirmar Recepción
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
