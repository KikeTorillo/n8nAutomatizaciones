import { useState, useEffect, useRef } from 'react';
import { Search, Package, ShoppingCart, X, ScanBarcode } from 'lucide-react';
import { useBuscarProductos } from '@/hooks/inventario';
import { useDebounce } from '@/hooks/utils/useDebounce';
import { BarcodeScanner } from '@/components/ui';
import { extractProductCode } from '@/utils/gs1Parser';

/**
 * Buscador de productos para POS
 * Soporta búsqueda por nombre, SKU, código de barras y escáner GS1
 * Dic 2025: Integración con escáner de cámara y parser GS1
 */
export default function BuscadorProductosPOS({ onProductoSeleccionado }) {
  const [query, setQuery] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [ultimoGS1, setUltimoGS1] = useState(null); // Datos GS1 del último escaneo
  const inputRef = useRef(null);
  const resultadosRef = useRef(null);

  // Debounce del query para evitar requests excesivos
  const debouncedQuery = useDebounce(query, 300);

  // Normalizar query si parece código de barras (GTIN-14 → EAN-13)
  const queryNormalizado = /^\d{8,14}$/.test(debouncedQuery)
    ? extractProductCode(debouncedQuery)
    : debouncedQuery;

  // Búsqueda de productos (solo productos activos con stock)
  const { data: productos, isLoading } = useBuscarProductos(queryNormalizado, {
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
    if (e.key === 'Enter' && productos?.length === 1) {
      e.preventDefault();
      handleSeleccionarProducto(productos[0]);
    }
    // Escape: cerrar resultados
    if (e.key === 'Escape') {
      setMostrarResultados(false);
    }
  };

  // Dic 2025: Handler para escaneo de códigos de barras
  // El hook useBarcodeScanner ya normaliza GTIN-14 → EAN-13
  const handleScan = (code, scanData) => {
    // Guardar datos GS1 si existen (lote, vencimiento, etc.)
    if (scanData?.gs1) {
      setUltimoGS1(scanData.gs1);
    } else {
      setUltimoGS1(null);
    }

    // Buscar con el código ya normalizado por el hook
    setQuery(code);
    setMostrarScanner(false);

    // Focus en el input para ver resultados
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="relative">
      {/* Buscador con botón de escáner */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar producto por nombre, SKU o código de barras..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            autoFocus
          />

          {query && (
            <button
              onClick={handleLimpiar}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Botón de escáner */}
        <button
          onClick={() => setMostrarScanner(true)}
          className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium shadow-sm"
          title="Escanear código de barras"
        >
          <ScanBarcode className="h-5 w-5" />
          <span className="hidden sm:inline">Escanear</span>
        </button>
      </div>

      {/* Info GS1 del último escaneo */}
      {ultimoGS1 && (
        <div className="mt-2 p-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <span className="text-primary-700 dark:text-primary-300 font-medium">Código GS1 detectado:</span>
            <button
              onClick={() => setUltimoGS1(null)}
              className="text-primary-500 hover:text-primary-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-primary-600 dark:text-primary-400">
            {ultimoGS1.lot && <span>Lote: <strong>{ultimoGS1.lot}</strong></span>}
            {ultimoGS1.expirationDateFormatted && <span>Vence: <strong>{ultimoGS1.expirationDateFormatted}</strong></span>}
            {ultimoGS1.serial && <span>Serie: <strong>{ultimoGS1.serial}</strong></span>}
            {ultimoGS1.productionDateFormatted && <span>Producción: <strong>{ultimoGS1.productionDateFormatted}</strong></span>}
          </div>
        </div>
      )}

      {/* Resultados */}
      {mostrarResultados && (
        <div
          ref={resultadosRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
        >
          {isLoading && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
              <p className="mt-2">Buscando productos...</p>
            </div>
          )}

          {!isLoading && productos?.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p className="font-medium text-gray-900 dark:text-gray-100">No se encontraron productos</p>
              <p className="text-sm">Intenta con otro término de búsqueda</p>
            </div>
          )}

          {!isLoading && productos?.length > 0 && (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {productos.map((producto) => (
                // Dic 2025: Key único para variantes (v-id) y productos (p-id)
                <li key={producto.es_variante ? `v-${producto.variante_id}` : `p-${producto.producto_id}`}>
                  <button
                    onClick={() => handleSeleccionarProducto(producto)}
                    className="w-full p-4 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors text-left flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{producto.nombre}</span>
                        {producto.es_variante && (
                          <span className="px-1.5 py-0.5 text-xs bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 rounded">
                            Variante
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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
                      <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                      </div>
                    </div>

                    <ShoppingCart className="ml-4 h-6 w-6 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 group-hover:scale-110 transition-transform" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.length < 2 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}
        </div>
      )}

      {/* Modal de escáner */}
      {mostrarScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg">
            <BarcodeScanner
              onScan={handleScan}
              onClose={() => setMostrarScanner(false)}
              title="Escanear Producto"
              subtitle="Apunta la cámara al código de barras (soporta GS1-128)"
              formats="PRODUCTOS"
              showLastScan={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
