import { Sparkles, Package, Percent, Gift, Tag, DollarSign, Clock, X, Info, AlertTriangle } from 'lucide-react';

/**
 * Componente que muestra el desglose detallado de promociones aplicadas al carrito
 *
 * Props:
 * - promociones: array - Lista de promociones aplicadas con sus descuentos
 * - descuentoTotal: number - Monto total de descuento
 * - hayExclusiva: boolean - Si hay una promocion exclusiva (anula otras)
 * - onRemover: (promocionId) => void - Callback para remover promocion (opcional)
 * - showHeader: boolean - Mostrar encabezado
 * - compact: boolean - Modo compacto
 */
export default function PromocionesAplicadas({
  promociones = [],
  descuentoTotal = 0,
  hayExclusiva = false,
  onRemover,
  showHeader = true,
  compact = false
}) {
  if (promociones.length === 0) {
    return null;
  }

  // Iconos por tipo de promocion
  const getIconoTipo = (tipo) => {
    const iconProps = compact ? { className: "h-3 w-3" } : { className: "h-4 w-4" };
    switch (tipo) {
      case 'cantidad':
        return <Package {...iconProps} />;
      case 'porcentaje':
        return <Percent {...iconProps} />;
      case 'monto_fijo':
        return <DollarSign {...iconProps} />;
      case 'regalo':
        return <Gift {...iconProps} />;
      case 'precio_especial':
        return <Tag {...iconProps} />;
      default:
        return <Sparkles {...iconProps} />;
    }
  };

  // Color por tipo
  const getColorTipo = (tipo) => {
    switch (tipo) {
      case 'cantidad':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40';
      case 'porcentaje':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40';
      case 'monto_fijo':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40';
      case 'regalo':
        return 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/40';
      case 'precio_especial':
        return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/40';
    }
  };

  // Descripcion legible del descuento
  const getDescripcionDescuento = (promo) => {
    switch (promo.tipo) {
      case 'cantidad':
        return promo.reglas?.descripcion || `${promo.reglas?.cantidad_requerida || 2}x${(promo.reglas?.cantidad_requerida || 2) - (promo.reglas?.cantidad_gratis || 1)}`;
      case 'porcentaje':
        return `${promo.detalle?.porcentaje || promo.valor_descuento || promo.reglas?.porcentaje || 0}% de descuento`;
      case 'monto_fijo':
        return `$${promo.valor_descuento || promo.reglas?.monto || 0} de descuento`;
      case 'regalo':
        return 'Producto gratis incluido';
      case 'precio_especial':
        return `Precio especial $${promo.reglas?.precio_especial || 0}`;
      default:
        return 'Descuento aplicado';
    }
  };

  return (
    <div className={`
      rounded-lg border overflow-hidden
      ${hayExclusiva
        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-300 dark:border-amber-700'
        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      }
    `}>
      {/* Header */}
      {showHeader && (
        <div className={`
          flex items-center justify-between px-3 py-2 border-b
          ${hayExclusiva
            ? 'bg-amber-100/50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
            : 'bg-green-100/50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
          }
        `}>
          <div className="flex items-center gap-2">
            <Sparkles className={`h-4 w-4 ${hayExclusiva ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`} />
            <span className={`text-sm font-medium ${hayExclusiva ? 'text-amber-800 dark:text-amber-200' : 'text-green-800 dark:text-green-200'}`}>
              Promociones Aplicadas
              {hayExclusiva && (
                <span className="ml-2 text-xs bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded font-normal">
                  Exclusiva
                </span>
              )}
            </span>
          </div>
          <span className={`text-lg font-bold ${hayExclusiva ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
            -${descuentoTotal.toFixed(2)}
          </span>
        </div>
      )}

      {/* Aviso de promocion exclusiva */}
      {hayExclusiva && promociones.length === 1 && (
        <div className="px-3 py-2 bg-amber-100/30 dark:bg-amber-900/20 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Esta promocion es exclusiva y no se acumula con otras</span>
        </div>
      )}

      {/* Lista de promociones */}
      <div className={`divide-y ${hayExclusiva ? 'divide-amber-100 dark:divide-amber-900' : 'divide-green-100 dark:divide-green-900'}`}>
        {promociones.map((promo, index) => (
          <div
            key={promo.id || index}
            className={`
              flex items-center justify-between gap-3
              ${compact ? 'px-3 py-2' : 'p-3'}
            `}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Icono tipo */}
              <div className={`p-1.5 rounded ${getColorTipo(promo.tipo)}`}>
                {getIconoTipo(promo.tipo)}
              </div>

              {/* Info promocion */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-gray-900 dark:text-gray-100 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                  {promo.nombre}
                </p>
                <p className={`text-gray-500 dark:text-gray-400 ${compact ? 'text-xs' : 'text-xs'}`}>
                  {getDescripcionDescuento(promo)}
                </p>

                {/* Productos afectados (si los hay) */}
                {promo.productos_aplicados && promo.productos_aplicados.length > 0 && !compact && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {promo.productos_aplicados.slice(0, 3).map((prod, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        {prod.nombre || prod}
                      </span>
                    ))}
                    {promo.productos_aplicados.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{promo.productos_aplicados.length - 3} mas
                      </span>
                    )}
                  </div>
                )}

                {/* Vigencia si tiene horario */}
                {(promo.hora_inicio || promo.hora_fin) && !compact && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {promo.hora_inicio && promo.hora_fin
                        ? `Valido de ${promo.hora_inicio} a ${promo.hora_fin}`
                        : promo.hora_inicio
                          ? `Desde ${promo.hora_inicio}`
                          : `Hasta ${promo.hora_fin}`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Descuento y acciones */}
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-green-600 dark:text-green-400 ${compact ? 'text-sm' : 'text-base'}`}>
                -${(promo.descuento || 0).toFixed(2)}
              </span>

              {onRemover && (
                <button
                  type="button"
                  onClick={() => onRemover(promo.id)}
                  className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="No aplicar esta promocion"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer con total si hay mas de 1 promocion */}
      {promociones.length > 1 && !hayExclusiva && (
        <div className="px-3 py-2 bg-green-100/50 dark:bg-green-900/30 border-t border-green-200 dark:border-green-800 flex items-center justify-between">
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Total descuentos promociones:
          </span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            -${descuentoTotal.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
