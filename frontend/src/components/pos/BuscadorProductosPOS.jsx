import { useState, useEffect, useRef } from 'react';
import { Search, Package, ShoppingCart, X } from 'lucide-react';
import { useBuscarProductos } from '@/hooks/useProductos';

/**
 * Buscador de productos para POS
 * Soporta búsqueda por nombre, SKU y código de barras
 */
export default function BuscadorProductosPOS({ onProductoSeleccionado }) {
  const [query, setQuery] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const inputRef = useRef(null);
  const resultadosRef = useRef(null);

  // Búsqueda de productos (solo productos activos con stock)
  const { data: productos, isLoading } = useBuscarProductos({
    q: query,
    solo_activos: true,
    solo_con_stock: true,
    limit: 10
  });

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        resultadosRef.current &&
        !resultadosRef.current.contains(event.target)
      ) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mostrar resultados cuando hay query y productos
  useEffect(() => {
    if (query.length >= 2) {
      setMostrarResultados(true);
    } else {
      setMostrarResultados(false);
    }
  }, [query, productos]);

  const handleSeleccionarProducto = (producto) => {
    onProductoSeleccionado(producto);
    setQuery('');
    setMostrarResultados(false);
    inputRef.current?.focus();
  };

  const handleLimpiar = () => {
    setQuery('');
    setMostrarResultados(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    // Enter: seleccionar primer producto si solo hay uno
    if (e.key === 'Enter' && productos.length === 1) {
      e.preventDefault();
      handleSeleccionarProducto(productos[0]);
    }
    // Escape: cerrar resultados
    if (e.key === 'Escape') {
      setMostrarResultados(false);
    }
  };

  return (
    <div className="relative">
      {/* Buscador */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar producto por nombre, SKU o código de barras..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          autoFocus
        />

        {query && (
          <button
            onClick={handleLimpiar}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Resultados */}
      {mostrarResultados && (
        <div
          ref={resultadosRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto"
        >
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Buscando productos...</p>
            </div>
          )}

          {!isLoading && productos.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">No se encontraron productos</p>
              <p className="text-sm">Intenta con otro término de búsqueda</p>
            </div>
          )}

          {!isLoading && productos.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {productos.map((producto) => (
                <li key={producto.id}>
                  <button
                    onClick={() => handleSeleccionarProducto(producto)}
                    className="w-full p-4 hover:bg-blue-50 transition-colors text-left flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                        <span className="font-medium text-gray-900">{producto.nombre}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        {producto.sku && (
                          <span>SKU: <span className="font-mono">{producto.sku}</span></span>
                        )}
                        {producto.codigo_barras && (
                          <span>Código: <span className="font-mono">{producto.codigo_barras}</span></span>
                        )}
                        <span>Stock: <span className="font-semibold">{producto.stock_actual}</span></span>
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <div className="text-xl font-bold text-blue-600">
                        ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                      </div>
                      {producto.precio_mayoreo && producto.cantidad_mayoreo && (
                        <div className="text-xs text-gray-500">
                          ${parseFloat(producto.precio_mayoreo).toFixed(2)} (≥{producto.cantidad_mayoreo})
                        </div>
                      )}
                    </div>

                    <ShoppingCart className="ml-4 h-6 w-6 text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-transform" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.length < 2 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}
        </div>
      )}
    </div>
  );
}
