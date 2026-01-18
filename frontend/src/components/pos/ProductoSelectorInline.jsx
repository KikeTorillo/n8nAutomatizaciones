import { useState, useEffect, useRef } from 'react';
import { Search, Package, X, Check } from 'lucide-react';
import { useBuscarProductos } from '@/hooks/inventario';
import { useDebounce } from '@/hooks/utils/useDebounce';

/**
 * Selector de producto inline con búsqueda
 * Para usar dentro de formularios (ej: seleccionar producto base para combo)
 *
 * @param {function} onSelect - Callback al seleccionar producto
 * @param {number} excludeIds - IDs de productos a excluir de resultados
 * @param {string} placeholder - Placeholder del input
 * @param {object} productoSeleccionado - Producto actualmente seleccionado
 * @param {boolean} disabled - Deshabilitar selector
 */
export default function ProductoSelectorInline({
  onSelect,
  excludeIds = [],
  placeholder = 'Buscar producto...',
  productoSeleccionado = null,
  disabled = false,
  label,
  error,
  required = false
}) {
  const [query, setQuery] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const inputRef = useRef(null);
  const resultadosRef = useRef(null);

  // Debounce del query para evitar requests excesivos
  const debouncedQuery = useDebounce(query, 300);

  // Búsqueda de productos
  const { data: productos, isLoading } = useBuscarProductos({
    q: debouncedQuery,
    solo_activos: true,
    limit: 10
  }, {
    enabled: debouncedQuery.length >= 2
  });

  // Normalizar productos (la API de búsqueda devuelve producto_id, no id)
  const productosNormalizados = productos?.map(p => ({
    ...p,
    id: p.producto_id || p.id // Normalizar a "id" para consistencia
  })) || [];

  // Filtrar productos excluidos
  const productosFiltrados = productosNormalizados.filter(
    p => !excludeIds.includes(p.id)
  );

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

  // Mostrar resultados cuando hay query
  useEffect(() => {
    if (query.length >= 2) {
      setMostrarResultados(true);
    } else {
      setMostrarResultados(false);
    }
  }, [query]);

  const handleSeleccionar = (producto) => {
    onSelect(producto);
    setQuery('');
    setMostrarResultados(false);
  };

  const handleLimpiar = () => {
    onSelect(null);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && productosFiltrados?.length === 1) {
      e.preventDefault();
      handleSeleccionar(productosFiltrados[0]);
    }
    if (e.key === 'Escape') {
      setMostrarResultados(false);
    }
  };

  // Si hay producto seleccionado, mostrar como badge
  if (productoSeleccionado) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg">
          <Package className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {productoSeleccionado.nombre}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              SKU: {productoSeleccionado.sku || 'N/A'} • ${parseFloat(productoSeleccionado.precio_venta || 0).toFixed(2)}
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleLimpiar}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
            error
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-300 dark:border-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Dropdown de resultados */}
      {mostrarResultados && (
        <div
          ref={resultadosRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
              No se encontraron productos
            </div>
          ) : (
            productosFiltrados.map((producto) => (
              <button
                key={producto.id}
                type="button"
                onClick={() => handleSeleccionar(producto)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                    {producto.nombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    SKU: {producto.sku || 'N/A'} • Stock: {producto.stock_actual || 0}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
