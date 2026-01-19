import { memo, useCallback } from 'react';
import { ShoppingCart, Grid3X3, Search } from 'lucide-react';
import BuscadorProductosPOS from '@/components/pos/BuscadorProductosPOS';
import CategoriasPOS from '@/components/pos/CategoriasPOS';
import ProductosGridPOS from '@/components/pos/ProductosGridPOS';

/**
 * Sección de productos del POS (grid/búsqueda)
 * Ene 2026: Extraído de VentaPOSPage para mejorar organización
 * Ene 2026: Memoizado para evitar re-renders innecesarios
 */
function POSProductsSection({
  // Vista
  vistaProductos,
  onVistaChange,
  // Categorías
  categorias,
  categoriaActiva,
  onCategoriaChange,
  isLoadingCategorias,
  // Productos
  productosGrid,
  isLoadingProductos,
  // Carrito
  cartItems,
  onProductoSeleccionado,
  // Totales para resumen
  subtotal,
  total,
}) {
  // Ene 2026: Memoizar callback para evitar re-renders de ProductosGridPOS
  const handleAddToCart = useCallback((producto) => {
    onProductoSeleccionado({
      ...producto,
      producto_id: producto.id,
      es_variante: false,
      requiere_numero_serie: producto.requiere_numero_serie || false
    });
  }, [onProductoSeleccionado]);

  return (
    <div className="lg:col-span-2 space-y-3 sm:space-y-4">
      {/* Toggle Grid / Búsqueda */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => onVistaChange('grid')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              vistaProductos === 'grid'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => onVistaChange('search')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              vistaProductos === 'search'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Búsqueda</span>
          </button>
        </div>

        {vistaProductos === 'grid' && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {productosGrid.length} productos
          </span>
        )}
      </div>

      {/* Vista Grid */}
      {vistaProductos === 'grid' && (
        <>
          <CategoriasPOS
            categorias={categorias}
            categoriaActiva={categoriaActiva}
            onCategoriaChange={onCategoriaChange}
            isLoading={isLoadingCategorias}
          />

          <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
            <ProductosGridPOS
              productos={productosGrid}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
              isLoading={isLoadingProductos}
            />
          </div>
        </>
      )}

      {/* Vista Búsqueda */}
      {vistaProductos === 'search' && (
        <>
          <BuscadorProductosPOS onProductoSeleccionado={onProductoSeleccionado} />

          {cartItems.length === 0 && (
            <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4 sm:p-6 text-center">
              <ShoppingCart className="h-10 w-10 sm:h-16 sm:w-16 text-primary-400 dark:text-primary-500 mx-auto mb-2 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-primary-900 dark:text-primary-300 mb-1 sm:mb-2">
                Comienza a agregar productos
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-400 mb-3 sm:mb-4">
                Busca productos por nombre, SKU o escanea el código de barras
              </p>
              <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Atajos de teclado:</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> - Seleccionar producto</li>
                  <li>• <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> - Cerrar resultados</li>
                  <li>• <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">F2</kbd> - Proceder al pago</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {/* Resumen rápido */}
      {cartItems.length > 0 && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-3 sm:p-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <p className="text-primary-100 text-xs sm:text-sm">Items</p>
              <p className="text-xl sm:text-3xl font-bold">{cartItems.length}</p>
            </div>
            <div>
              <p className="text-primary-100 text-xs sm:text-sm">Subtotal</p>
              <p className="text-lg sm:text-3xl font-bold">${subtotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-primary-100 text-xs sm:text-sm">Total</p>
              <p className="text-lg sm:text-3xl font-bold">${total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(POSProductsSection);
