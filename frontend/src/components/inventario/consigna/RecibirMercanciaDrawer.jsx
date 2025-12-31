/**
 * Drawer para recibir mercancia en consignacion
 */

import { useState, useEffect } from 'react';
import { Plus, Minus, Package } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import { useProductosAcuerdo, useRecibirMercanciaConsigna } from '@/hooks/useConsigna';

export default function RecibirMercanciaDrawer({ acuerdo, isOpen, onClose }) {
  const [items, setItems] = useState([]);

  const { data: productos } = useProductosAcuerdo(acuerdo?.id);
  const recibirMutation = useRecibirMercanciaConsigna();

  // Inicializar items cuando se abre el drawer
  useEffect(() => {
    if (productos && isOpen) {
      setItems(
        productos.map((p) => ({
          producto_id: p.producto_id,
          variante_id: p.variante_id || null,
          nombre: p.producto_nombre,
          sku: p.producto_sku,
          cantidad: 0,
          notas: '',
        }))
      );
    }
  }, [productos, isOpen]);

  const handleCantidadChange = (index, delta) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, cantidad: Math.max(0, item.cantidad + delta) } : item
      )
    );
  };

  const handleSubmit = () => {
    const itemsConCantidad = items.filter((item) => item.cantidad > 0);

    if (itemsConCantidad.length === 0) {
      return;
    }

    recibirMutation.mutate(
      {
        acuerdoId: acuerdo.id,
        data: {
          items: itemsConCantidad.map((item) => ({
            producto_id: item.producto_id,
            variante_id: item.variante_id,
            cantidad: item.cantidad,
            notas: item.notas?.trim() || undefined,
          })),
        },
      },
      {
        onSuccess: () => {
          onClose();
          setItems([]);
        },
      }
    );
  };

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  if (!acuerdo) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Recibir Mercancia en Consigna"
      size="md"
    >
      <div className="flex flex-col h-full">
        {/* Header info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400">Acuerdo</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">{acuerdo.folio}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {acuerdo.proveedor_nombre || acuerdo.proveedor_razon_social}
          </p>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay productos en este acuerdo
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={`${item.producto_id}-${item.variante_id || 0}`}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCantidadChange(index, -1)}
                        disabled={item.cantidad === 0}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.cantidad}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setItems((prev) =>
                            prev.map((it, i) => (i === index ? { ...it, cantidad: value } : it))
                          );
                        }}
                        className="w-20 text-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleCantidadChange(index, 1)}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Notas (opcional)"
                      value={item.notas}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) => (i === index ? { ...it, notas: e.target.value } : it))
                        )
                      }
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {totalItems > 0 && (
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
              <Package className="h-4 w-4" />
              <span>Total a recibir: {totalItems} unidades</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={totalItems === 0 || recibirMutation.isPending}
              isLoading={recibirMutation.isPending}
              className="flex-1"
            >
              Confirmar Recepcion
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
