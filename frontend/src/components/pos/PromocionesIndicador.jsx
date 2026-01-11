import { Sparkles, ChevronDown, ChevronUp, Tag, Clock, Percent, Gift, Package } from 'lucide-react';
import { useState } from 'react';

/**
 * Componente indicador de promociones disponibles/aplicadas en el carrito
 *
 * Props:
 * - promocionesAplicadas: array - Promociones que aplican al carrito actual
 * - descuentoTotal: number - Monto total de descuento por promociones
 * - hayExclusiva: boolean - Si hay una promocion exclusiva activa
 * - loading: boolean - Estado de carga
 * - onClick: () => void - Callback al hacer click (mostrar detalles)
 */
export default function PromocionesIndicador({
  promocionesAplicadas = [],
  descuentoTotal = 0,
  hayExclusiva = false,
  loading = false,
  onClick
}) {
  const [expanded, setExpanded] = useState(false);

  const cantidadPromociones = promocionesAplicadas.length;

  // No mostrar nada si no hay promociones
  if (!loading && cantidadPromociones === 0) {
    return null;
  }

  // Iconos por tipo de promocion
  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'cantidad':
        return <Package className="h-3.5 w-3.5" />;
      case 'porcentaje':
        return <Percent className="h-3.5 w-3.5" />;
      case 'regalo':
        return <Gift className="h-3.5 w-3.5" />;
      default:
        return <Tag className="h-3.5 w-3.5" />;
    }
  };

  const handleToggle = () => {
    if (onClick) {
      onClick();
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <div className="space-y-2">
      {/* Badge principal */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`
          w-full flex items-center justify-between p-3 rounded-lg border transition-all
          ${cantidadPromociones > 0
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/30 dark:hover:to-yellow-900/30'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }
          ${loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-2">
          <div className={`
            p-1.5 rounded-full
            ${cantidadPromociones > 0
              ? 'bg-amber-100 dark:bg-amber-900/40'
              : 'bg-gray-100 dark:bg-gray-700'
            }
          `}>
            <Sparkles className={`
              h-4 w-4
              ${loading ? 'animate-pulse' : ''}
              ${cantidadPromociones > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-400 dark:text-gray-500'
              }
            `} />
          </div>

          <div className="text-left">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Evaluando promociones...
              </p>
            ) : (
              <>
                <p className={`
                  text-sm font-medium
                  ${cantidadPromociones > 0
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {cantidadPromociones === 1
                    ? '1 promocion aplicada'
                    : `${cantidadPromociones} promociones aplicadas`
                  }
                  {hayExclusiva && (
                    <span className="ml-1.5 text-xs bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded">
                      Exclusiva
                    </span>
                  )}
                </p>
                {descuentoTotal > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Ahorras ${descuentoTotal.toFixed(2)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {cantidadPromociones > 0 && !loading && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              -${descuentoTotal.toFixed(2)}
            </span>
            {!onClick && (
              expanded
                ? <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                : <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
          </div>
        )}
      </button>

      {/* Lista expandida de promociones */}
      {expanded && cantidadPromociones > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-lg divide-y divide-amber-100 dark:divide-amber-900">
          {promocionesAplicadas.map((promo, index) => (
            <div key={promo.id || index} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-amber-100 dark:bg-amber-900/40 rounded">
                  {getIconoTipo(promo.tipo)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {promo.nombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {promo.descripcion_aplicada || promo.descripcion}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                -${(promo.descuento || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
