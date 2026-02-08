import { memo } from 'react';
import { Search, Camera } from 'lucide-react';
import { BarcodeScanner, Button, IconButton } from '@/components/ui';

/**
 * Panel de búsqueda de productos por código de barras o SKU.
 * Incluye campo de texto, botón de escáner y scanner modal.
 */
function ConteoDetalleBusqueda({
    inputRef,
    codigoBusqueda,
    onCodigoChange,
    onBuscar,
    isSearching,
    scannerOpen,
    onOpenScanner,
    onCloseScanner,
    onScan,
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Buscar Producto
            </h3>
            <form onSubmit={onBuscar}>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={codigoBusqueda}
                            onChange={(e) => onCodigoChange(e.target.value)}
                            placeholder="Código de barras o SKU..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <IconButton
                        icon={<Camera />}
                        label="Escanear código de barras"
                        variant="outline"
                        onClick={onOpenScanner}
                    />
                    <Button type="submit" isLoading={isSearching}>
                        Buscar
                    </Button>
                </div>
            </form>

            {/* Scanner de código de barras */}
            {scannerOpen && (
                <BarcodeScanner
                    onClose={onCloseScanner}
                    onScan={onScan}
                    title="Buscar Producto"
                    subtitle="Escanea el código de barras del producto"
                />
            )}
        </div>
    );
}

export default memo(ConteoDetalleBusqueda);
