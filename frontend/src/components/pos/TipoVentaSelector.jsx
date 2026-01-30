import { memo, useMemo } from 'react';
import { ShoppingCart, FileText, Clock, Calendar, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useTiposVenta, TIPO_VENTA } from '@/hooks/pos';

/**
 * Mapeo de nombres de icono (string del backend) a componentes Lucide
 */
const ICONOS = {
  'shopping-cart': ShoppingCart,
  'file-text': FileText,
  'clock': Clock,
  'calendar': Calendar,
};

/**
 * Obtener componente de icono desde nombre string
 */
const getIcono = (iconName) => ICONOS[iconName] || ShoppingCart;

/**
 * Selector de tipo de venta para POS
 * Consume tipos de venta desde el backend via useTiposVenta
 *
 * @param {Object} props
 * @param {'directa'|'cotizacion'|'apartado'|'cita'} props.value - Tipo seleccionado
 * @param {Function} props.onChange - Callback al cambiar tipo
 * @param {number} [props.citaId] - ID de cita si viene de flujo de cita
 * @param {boolean} [props.disabled] - Deshabilitar selector
 * @param {'compact'|'full'} [props.variant='compact'] - Variante de visualización
 */
function TipoVentaSelector({ value, onChange, citaId, disabled = false, variant = 'compact' }) {
  const { data: tiposVenta = [], isLoading } = useTiposVenta();

  // Encontrar tipo actual
  const tipoActual = useMemo(() =>
    tiposVenta.find(t => t.value === value) || tiposVenta[0] || { value: 'directa', label: 'Venta Directa', icon: 'shopping-cart' },
    [tiposVenta, value]
  );

  const IconoActual = getIcono(tipoActual.icon);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">Cargando...</span>
      </div>
    );
  }

  // En modo compact mostramos un dropdown
  if (variant === 'compact') {
    return (
      <div className="relative group">
        <button
          type="button"
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50'
          }`}
        >
          <IconoActual className="h-4 w-4" />
          <span>{tipoActual.label}</span>
          {!disabled && <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Dropdown menu */}
        {!disabled && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="p-1">
              {tiposVenta.map((tipo) => {
                const Icono = getIcono(tipo.icon);
                const estaDeshabilitado = tipo.soloDesdeContexto && !citaId;
                const estaSeleccionado = value === tipo.value;

                return (
                  <button
                    key={tipo.value}
                    type="button"
                    disabled={estaDeshabilitado}
                    onClick={() => !estaDeshabilitado && onChange(tipo.value)}
                    className={`w-full flex items-start gap-3 p-2 rounded-md text-left transition-colors ${
                      estaDeshabilitado
                        ? 'opacity-50 cursor-not-allowed'
                        : estaSeleccionado
                          ? 'bg-primary-50 dark:bg-primary-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${
                      estaSeleccionado
                        ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      <Icono className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          estaSeleccionado
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {tipo.label}
                        </span>
                        {estaSeleccionado && (
                          <Check className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {estaDeshabilitado ? 'Solo desde agenda de citas' : tipo.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modo full: grid de opciones
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tipo de Venta
      </label>
      <div className="grid grid-cols-2 gap-2">
        {tiposVenta.map((tipo) => {
          const Icono = getIcono(tipo.icon);
          const estaDeshabilitado = disabled || (tipo.soloDesdeContexto && !citaId);
          const estaSeleccionado = value === tipo.value;

          return (
            <button
              key={tipo.value}
              type="button"
              disabled={estaDeshabilitado}
              onClick={() => !estaDeshabilitado && onChange(tipo.value)}
              className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                estaDeshabilitado
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 cursor-not-allowed'
                  : estaSeleccionado
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {estaSeleccionado && (
                <div className="absolute top-1 right-1">
                  <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <Icono className={`h-5 w-5 ${
                estaSeleccionado
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
              <span className={`text-xs font-medium ${
                estaSeleccionado
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {tipo.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TipoVentaSelector);

// Re-exportar constante para compatibilidad (ahora viene del hook)
export { TIPO_VENTA };
