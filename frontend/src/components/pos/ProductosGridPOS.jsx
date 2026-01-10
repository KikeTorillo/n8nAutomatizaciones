import { Package, Plus, AlertTriangle } from 'lucide-react';

/**
 * Grid visual de productos para POS
 * Muestra productos con imagen, nombre, precio y badge de stock
 */
export default function ProductosGridPOS({
  productos = [],
  onAddToCart,
  cartItems = [],
  isLoading = false
}) {
  // Obtener cantidad en carrito para cada producto
  const getCartQuantity = (productoId) => {
    const item = cartItems.find(i => i.producto_id === productoId || i.id === productoId);
    return item?.cantidad || 0;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-48"
          />
        ))}
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No hay productos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No se encontraron productos en esta categoría
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {productos.map((producto) => {
        const cartQty = getCartQuantity(producto.id);
        const stockBajo = producto.stock_actual <= (producto.stock_minimo || 5);
        const sinStock = producto.stock_actual <= 0;

        return (
          <button
            key={producto.id}
            onClick={() => !sinStock && onAddToCart(producto, 1)}
            disabled={sinStock}
            className={`
              relative bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden
              transition-all text-left group
              ${sinStock
                ? 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg cursor-pointer active:scale-[0.98]'
              }
            `}
          >
            {/* Badge de cantidad en carrito */}
            {cartQty > 0 && (
              <div className="absolute top-2 right-2 z-10 bg-primary-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                {cartQty}
              </div>
            )}

            {/* Imagen del producto */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                </div>
              )}

              {/* Overlay de agregar */}
              {!sinStock && (
                <div className="absolute inset-0 bg-primary-600/0 group-hover:bg-primary-600/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary-600 text-white rounded-full p-2 shadow-lg">
                    <Plus className="h-6 w-6" />
                  </div>
                </div>
              )}

              {/* Badge de sin stock */}
              {sinStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Agotado
                  </span>
                </div>
              )}
            </div>

            {/* Info del producto */}
            <div className="p-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-1">
                {producto.nombre}
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  ${parseFloat(producto.precio_venta || producto.precio || 0).toFixed(2)}
                </span>

                {/* Stock badge */}
                <span className={`
                  text-xs px-2 py-0.5 rounded-full flex items-center gap-1
                  ${sinStock
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : stockBajo
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }
                `}>
                  {stockBajo && !sinStock && <AlertTriangle className="h-3 w-3" />}
                  {producto.stock_actual}
                </span>
              </div>

              {/* SKU */}
              {producto.sku && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                  SKU: {producto.sku}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
