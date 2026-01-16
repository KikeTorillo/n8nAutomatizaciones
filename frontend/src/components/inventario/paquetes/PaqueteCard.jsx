import { useState } from 'react';
import {
  Package,
  Box,
  Scale,
  Ruler,
  Tag,
  Truck,
  MoreVertical,
  Lock,
  X,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

/**
 * Estados del paquete con colores y descripciones
 */
const ESTADOS_PAQUETE = {
  abierto: { color: 'blue', label: 'Abierto', icon: Package },
  cerrado: { color: 'yellow', label: 'Cerrado', icon: Lock },
  etiquetado: { color: 'purple', label: 'Etiquetado', icon: Tag },
  enviado: { color: 'green', label: 'Enviado', icon: Truck },
  cancelado: { color: 'red', label: 'Cancelado', icon: X },
};

/**
 * Card de paquete de envio
 * @param {Object} paquete - Datos del paquete
 * @param {Function} onVerDetalle - Callback para ver detalle
 * @param {Function} onCerrar - Callback para cerrar paquete
 * @param {Function} onCancelar - Callback para cancelar paquete
 * @param {Function} onEtiquetar - Callback para etiquetar paquete
 * @param {Function} onEnviar - Callback para marcar como enviado
 * @param {Function} onImprimir - Callback para imprimir etiqueta
 */
function PaqueteCard({
  paquete,
  onVerDetalle,
  onCerrar,
  onCancelar,
  onEtiquetar,
  onEnviar,
  onImprimir,
}) {
  const [expandido, setExpandido] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const estado = ESTADOS_PAQUETE[paquete.estado] || ESTADOS_PAQUETE.abierto;
  const EstadoIcon = estado.icon;

  const tieneItems = (paquete.total_items || 0) > 0;
  const tieneDimensiones = paquete.largo_cm && paquete.ancho_cm && paquete.alto_cm;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${estado.color}-100 dark:bg-${estado.color}-900/30`}>
              <EstadoIcon className={`w-5 h-5 text-${estado.color}-600 dark:text-${estado.color}-400`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {paquete.folio}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge color={estado.color} size="sm">
                  {estado.label}
                </Badge>
                {paquete.carrier && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {paquete.carrier}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu de acciones */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-1"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {menuAbierto && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuAbierto(false)}
                />
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <div className="py-1">
                    {onVerDetalle && (
                      <button
                        onClick={() => { onVerDetalle(paquete); setMenuAbierto(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Ver detalle
                      </button>
                    )}
                    {paquete.estado === 'abierto' && onCerrar && tieneItems && (
                      <button
                        onClick={() => { onCerrar(paquete); setMenuAbierto(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cerrar paquete
                      </button>
                    )}
                    {paquete.estado === 'cerrado' && onEtiquetar && (
                      <button
                        onClick={() => { onEtiquetar(paquete); setMenuAbierto(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Etiquetar
                      </button>
                    )}
                    {['cerrado', 'etiquetado'].includes(paquete.estado) && onEnviar && (
                      <button
                        onClick={() => { onEnviar(paquete); setMenuAbierto(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Marcar enviado
                      </button>
                    )}
                    {['cerrado', 'etiquetado'].includes(paquete.estado) && onImprimir && (
                      <button
                        onClick={() => { onImprimir(paquete); setMenuAbierto(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Printer className="w-3 h-3 inline mr-2" />
                        Imprimir etiqueta
                      </button>
                    )}
                    {paquete.estado !== 'enviado' && paquete.estado !== 'cancelado' && onCancelar && (
                      <button
                        onClick={() => { onCancelar(paquete); setMenuAbierto(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info basica */}
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Box className="w-4 h-4" />
            <span>{paquete.total_items || 0} items</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span>{paquete.total_unidades || 0} unidades</span>
          </div>
          {paquete.peso_kg && (
            <div className="flex items-center gap-1">
              <Scale className="w-4 h-4" />
              <span>{paquete.peso_kg} kg</span>
            </div>
          )}
          {tieneDimensiones && (
            <div className="flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              <span>{paquete.largo_cm}x{paquete.ancho_cm}x{paquete.alto_cm} cm</span>
            </div>
          )}
        </div>

        {/* Tracking */}
        {paquete.tracking_carrier && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Tracking: <span className="font-mono">{paquete.tracking_carrier}</span>
          </div>
        )}
      </div>

      {/* Items (expandible) */}
      {paquete.items && paquete.items.length > 0 && (
        <>
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700"
          >
            <span>Ver contenido ({paquete.items.length} productos)</span>
            {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandido && (
            <div className="px-4 pb-4 space-y-2">
              {paquete.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.producto_nombre}
                    </span>
                    {item.variante_nombre && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        ({item.variante_nombre})
                      </span>
                    )}
                    {item.numero_serie && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        NS: {item.numero_serie}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    x{item.cantidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Acciones rapidas para paquete abierto */}
      {paquete.estado === 'abierto' && onVerDetalle && (
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVerDetalle(paquete)}
            className="w-full"
          >
            Agregar items
          </Button>
        </div>
      )}
    </div>
  );
}

export default PaqueteCard;
