import { Plus, Minus, Trash2, ShoppingCart, Percent } from 'lucide-react';

/**
 * Componente de carrito de venta para POS
 * Muestra items, cantidades, descuentos y totales
 */
export default function CarritoVenta({
  items,
  onActualizarCantidad,
  onEliminarItem,
  onActualizarDescuentoItem,
  descuentoGlobal = 0,
  onActualizarDescuentoGlobal
}) {
  // Calcular subtotal
  const subtotal = items.reduce((sum, item) => {
    const precioUnitario = parseFloat(item.precio_unitario || item.precio_venta || 0);
    const cantidad = parseInt(item.cantidad || 1);
    const descuentoItem = parseFloat(item.descuento_monto || 0);
    return sum + (precioUnitario * cantidad - descuentoItem);
  }, 0);

  // Calcular descuento global
  const montoDescuentoGlobal = (subtotal * (parseFloat(descuentoGlobal) / 100));

  // Calcular total
  const total = subtotal - montoDescuentoGlobal;

  const formatearPrecio = (precio) => {
    return `$${parseFloat(precio || 0).toFixed(2)}`;
  };

  const handleCantidadChange = (itemId, nuevaCantidad) => {
    const cantidad = parseInt(nuevaCantidad);
    if (cantidad >= 1 && cantidad <= 999) {
      onActualizarCantidad(itemId, cantidad);
    }
  };

  const handleDescuentoItemChange = (itemId, descuento) => {
    const desc = parseFloat(descuento);
    if (desc >= 0) {
      onActualizarDescuentoItem(itemId, desc);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Carrito de Venta</h3>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="font-semibold">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto bg-white">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
            <ShoppingCart className="h-20 w-20 mb-4" />
            <p className="text-lg font-medium">Carrito vacío</p>
            <p className="text-sm text-center mt-2">Busca y selecciona productos para agregar a la venta</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => {
              const precioUnitario = parseFloat(item.precio_unitario || item.precio_venta || 0);
              const cantidad = parseInt(item.cantidad || 1);
              const descuentoItem = parseFloat(item.descuento_monto || 0);
              const subtotalItem = (precioUnitario * cantidad) - descuentoItem;

              return (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  {/* Nombre y precio unitario */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.nombre}</h4>
                      {item.sku && (
                        <p className="text-xs text-gray-500 font-mono mt-1">SKU: {item.sku}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onEliminarItem(item.id)}
                      className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar del carrito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Controles de cantidad y precio */}
                  <div className="flex items-center gap-4">
                    {/* Cantidad */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCantidadChange(item.id, cantidad - 1)}
                        disabled={cantidad <= 1}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-4 w-4 text-gray-600" />
                      </button>

                      <input
                        type="number"
                        value={cantidad}
                        onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="999"
                      />

                      <button
                        onClick={() => handleCantidadChange(item.id, cantidad + 1)}
                        disabled={cantidad >= (item.stock_actual || 999)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Precio unitario */}
                    <div className="flex-1 text-sm">
                      <span className="text-gray-500">×</span> {formatearPrecio(precioUnitario)}
                    </div>

                    {/* Subtotal del item */}
                    <div className="font-semibold text-blue-600">
                      {formatearPrecio(subtotalItem)}
                    </div>
                  </div>

                  {/* Descuento por item */}
                  <div className="mt-2 flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={descuentoItem}
                      onChange={(e) => handleDescuentoItemChange(item.id, e.target.value)}
                      placeholder="Descuento $"
                      className="w-32 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-xs text-gray-500">Descuento en pesos</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer con totales */}
      {items.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-4 space-y-3">
          {/* Descuento global */}
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <Percent className="h-5 w-5 text-blue-600" />
            <label className="text-sm font-medium text-gray-700">Descuento global (%):</label>
            <input
              type="number"
              value={descuentoGlobal}
              onChange={(e) => onActualizarDescuentoGlobal(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-24 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              step="0.1"
            />
            <span className="text-sm text-gray-600">
              {formatearPrecio(montoDescuentoGlobal)}
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between text-base">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatearPrecio(subtotal)}</span>
          </div>

          {/* Descuento global */}
          {montoDescuentoGlobal > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Descuento ({descuentoGlobal}%):</span>
              <span>-{formatearPrecio(montoDescuentoGlobal)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between text-2xl font-bold text-blue-600 pt-3 border-t border-gray-300">
            <span>TOTAL:</span>
            <span>{formatearPrecio(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
