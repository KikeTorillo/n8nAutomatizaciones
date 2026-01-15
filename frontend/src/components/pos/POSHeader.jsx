import { User, DollarSign, Lock, ArrowUpDown, MoreVertical, Monitor, Trash2 } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import ClienteSelector from '@/components/pos/ClienteSelector';

/**
 * Header del POS con vendedor, caja, display y cliente
 * Ene 2026: Extraído de VentaPOSPage para mejorar organización
 */
export default function POSHeader({
  // Vendedor
  profesionalNombre,
  // Display
  isDisplayConnected,
  // Sesión de caja
  sesionActiva,
  totalesSesion,
  // Cliente
  clienteSeleccionado,
  onClienteChange,
  // Carrito
  itemsCount,
  onVaciarCarrito,
  // Modales de caja
  isMenuCajaOpen,
  onToggleMenuCaja,
  onMovimientosCaja,
  onCierreCaja,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-3 sm:px-6 sm:py-4">
      {/* Row 1: Botón de regreso + Vendedor + Display + Caja */}
      <div className="flex items-center justify-between mb-2">
        <BackButton to="/home" label="Volver al Inicio" />

        <div className="flex items-center gap-2">
          {/* Vendedor */}
          {profesionalNombre && (
            <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">Vendedor:</span>
              <span className="font-medium">{profesionalNombre}</span>
            </div>
          )}

          {/* Indicador de display */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
              isDisplayConnected
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
            title={isDisplayConnected ? 'Pantalla del cliente conectada' : 'Pantalla del cliente desconectada'}
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">{isDisplayConnected ? 'Display' : 'Sin display'}</span>
          </div>

          {/* Indicador de sesión de caja */}
          {sesionActiva && (
            <div className="relative">
              <button
                onClick={onToggleMenuCaja}
                className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs sm:text-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                <span className="font-medium hidden sm:inline">Caja:</span>
                <span className="font-bold">${(totalesSesion?.monto_esperado || sesionActiva.monto_inicial || 0).toFixed(2)}</span>
                <MoreVertical className="h-4 w-4" />
              </button>

              {/* Menú dropdown de caja */}
              {isMenuCajaOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <button
                    onClick={onMovimientosCaja}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    Entrada/Salida efectivo
                  </button>
                  <button
                    onClick={onCierreCaja}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Lock className="h-4 w-4" />
                    Cerrar caja
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Título */}
      <div className="mb-2 sm:mb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Punto de Venta</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
          Escanea o busca productos para crear una venta
        </p>
      </div>

      {/* Row 3: Cliente + Vaciar Carrito */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex-1 max-w-xs sm:max-w-sm">
          <ClienteSelector
            value={clienteSeleccionado}
            onChange={onClienteChange}
            placeholder="Asociar cliente (opcional)"
          />
        </div>

        {itemsCount > 0 && (
          <button
            onClick={onVaciarCarrito}
            className="flex items-center gap-1 sm:gap-2 px-2 py-2 sm:px-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Vaciar Carrito</span>
          </button>
        )}
      </div>
    </div>
  );
}
