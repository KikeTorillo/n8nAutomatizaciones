import { User, DollarSign, Lock, ArrowUpDown, MoreVertical, Monitor, Trash2 } from 'lucide-react';
import { BackButton } from '@/components/ui';
import ClienteSelector from '@/components/pos/ClienteSelector';

/**
 * Header del POS con vendedor, caja, display y cliente
 * Sigue el mismo patrón de diseño que BasePageLayout
 *
 * Estructura:
 * - BackButton
 * - Título + Descripción/Info contextual
 * - Cliente selector
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
  // Tipo de venta (componente externo)
  tipoVentaSelector,
}) {
  // Componente de caja dropdown
  const CajaDropdown = () => {
    if (!sesionActiva) return null;

    return (
      <div className="relative">
        <button
          onClick={onToggleMenuCaja}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
        >
          <DollarSign className="h-4 w-4" />
          <span className="font-bold">${Number(totalesSesion?.monto_esperado || sesionActiva?.monto_inicial || 0).toFixed(2)}</span>
          <MoreVertical className="h-4 w-4" />
        </button>

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
    );
  };

  // Info contextual (vendedor, display, caja)
  const ContextInfo = () => (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Vendedor */}
      {profesionalNombre && (
        <div className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs sm:text-sm">
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="font-medium">{profesionalNombre}</span>
        </div>
      )}

      {/* Display */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm ${
          isDisplayConnected
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}
        title={isDisplayConnected ? 'Display conectado' : 'Display desconectado'}
      >
        <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">{isDisplayConnected ? 'Display' : 'Sin display'}</span>
      </div>

      {/* Caja */}
      <CajaDropdown />
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
      {/* Row 1: BackButton */}
      <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

      {/* Row 2: Título + Info contextual */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Punto de Venta
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            Escanea o busca productos para crear una venta
          </p>
        </div>
        <ContextInfo />
      </div>

      {/* Row 3: Tipo venta + Cliente selector + Vaciar carrito */}
      <div className="flex items-center gap-3">
        {/* Tipo de venta */}
        {tipoVentaSelector}

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
            className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm font-medium"
            title="Vaciar carrito"
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Vaciar</span>
          </button>
        )}
      </div>
    </div>
  );
}
