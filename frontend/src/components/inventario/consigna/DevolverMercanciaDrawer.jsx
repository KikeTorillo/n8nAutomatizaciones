/**
 * Drawer para devolver mercancia al proveedor
 */

import { useState, useEffect } from 'react';
import { Plus, Minus, PackageMinus } from 'lucide-react';
import { Button, Drawer } from '@/components/ui';
import { useStockConsigna, useDevolverMercanciaConsigna } from '@/hooks/useConsigna';

export default function DevolverMercanciaDrawer({ acuerdo, isOpen, onClose }) {
  const [items, setItems] = useState([]);

  const { data: stockConsigna } = useStockConsigna({
    acuerdo_id: acuerdo?.id,
    solo_disponible: true,
  });
  const devolverMutation = useDevolverMercanciaConsigna();

  // Inicializar items con el stock disponible
  useEffect(() => {
    if (stockConsigna && isOpen) {
      setItems(
        stockConsigna.map((s) => ({
          stock_id: s.id,
          producto_id: s.producto_id,
          variante_id: s.variante_id || null,
          nombre: s.producto_nombre,
          sku: s.producto_sku,
          disponible: parseInt(s.cantidad_disponible) || 0,
          cantidad: 0,
        }))
      );
    }
  }, [stockConsigna, isOpen]);

  const handleCantidadChange = (index, delta) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, cantidad: Math.max(0, Math.min(item.disponible, item.cantidad + delta)) }
          : item
      )
    );
  };

  const handleSubmit = () => {
    const itemsConCantidad = items.filter((item) => item.cantidad > 0);

    if (itemsConCantidad.length === 0) {
      return;
    }

    devolverMutation.mutate(
      {
        acuerdoId: acuerdo.id,
        data: {
          items: itemsConCantidad.map((item) => ({
            producto_id: item.producto_id,
            variante_id: item.variante_id,
            cantidad: item.cantidad,
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
      title="Devolver Mercancia al Proveedor"
      size="md"
    >
      <div className="flex flex-col h-full">
        {/* Header info */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-600 dark:text-amber-400">Acuerdo</p>
          <p className="font-medium text-amber-800 dark:text-amber-200">{acuerdo.folio}</p>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {acuerdo.proveedor_nombre || acuerdo.proveedor_razon_social}
          </p>
        </div>

        {/* Lista de stock */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay stock disponible para devolver
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
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Disponible: {item.disponible}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Devolver:</span>
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
                        max={item.disponible}
                        value={item.cantidad}
                        onChange={(e) => {
                          const value = Math.min(item.disponible, parseInt(e.target.value) || 0);
                          setItems((prev) =>
                            prev.map((it, i) => (i === index ? { ...it, cantidad: value } : it))
                          );
                        }}
                        className="w-20 text-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleCantidadChange(index, 1)}
                        disabled={item.cantidad >= item.disponible}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === index ? { ...it, cantidad: it.disponible } : it
                          )
                        )
                      }
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Todo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {totalItems > 0 && (
            <div className="flex items-center gap-2 mb-3 text-sm text-amber-600 dark:text-amber-400">
              <PackageMinus className="h-4 w-4" />
              <span>Total a devolver: {totalItems} unidades</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={totalItems === 0 || devolverMutation.isPending}
              isLoading={devolverMutation.isPending}
              className="flex-1"
            >
              Confirmar Devolucion
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
