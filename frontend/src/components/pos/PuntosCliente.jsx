/**
 * ====================================================================
 * COMPONENTE - PUNTOS DEL CLIENTE EN POS
 * ====================================================================
 *
 * Muestra información de puntos de lealtad del cliente seleccionado:
 * - Saldo de puntos disponibles
 * - Nivel actual y progreso
 * - Puntos que ganaría con la compra
 * - Botón para canjear puntos
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { Star, Gift, ChevronRight, TrendingUp } from 'lucide-react';
import { useLealtadPOS, useCalcularPuntos } from '@/hooks/useLealtad';
import CanjePuntosModal from './CanjePuntosModal';

/**
 * Componente que muestra información de puntos del cliente en el POS
 * @param {Object} props
 * @param {number} props.clienteId - ID del cliente seleccionado
 * @param {string} props.clienteNombre - Nombre del cliente
 * @param {number} props.totalCarrito - Total actual del carrito
 * @param {boolean} props.tieneCupon - Si el carrito tiene cupón aplicado
 * @param {Function} props.onCanjeAplicado - Callback cuando se aplica un canje
 */
export default function PuntosCliente({
  clienteId,
  clienteNombre,
  totalCarrito = 0,
  tieneCupon = false,
  onCanjeAplicado,
}) {
  const [showCanjeModal, setShowCanjeModal] = useState(false);
  const [puntosGanados, setPuntosGanados] = useState(0);

  const {
    programaActivo,
    isLoading,
    config,
    puntosDisponibles,
    nivelActual,
    proximoNivel,
    puntosParaProximoNivel,
    puedeAcumular,
    minimoPuntosCanje,
  } = useLealtadPOS(clienteId, totalCarrito, tieneCupon);

  const calcularMutation = useCalcularPuntos();

  // Calcular puntos que ganaría cuando cambia el carrito
  const calcularPuntosGanados = useCallback(async () => {
    if (!programaActivo || !puedeAcumular || totalCarrito <= 0) {
      setPuntosGanados(0);
      return;
    }

    try {
      const resultado = await calcularMutation.mutateAsync({
        clienteId,
        monto: totalCarrito,
        tieneCupon,
      });
      setPuntosGanados(resultado?.puntos || 0);
    } catch {
      setPuntosGanados(0);
    }
  }, [programaActivo, puedeAcumular, totalCarrito, clienteId, tieneCupon]);

  useEffect(() => {
    const timer = setTimeout(calcularPuntosGanados, 300); // Debounce
    return () => clearTimeout(timer);
  }, [calcularPuntosGanados]);

  // No mostrar si no hay cliente o programa inactivo
  if (!clienteId || !programaActivo) {
    return null;
  }

  // Skeleton loading
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-primary-200 dark:bg-primary-700 rounded w-24 mb-2"></div>
        <div className="h-6 bg-primary-200 dark:bg-primary-700 rounded w-16"></div>
      </div>
    );
  }

  const puedeCanjar = puntosDisponibles >= minimoPuntosCanje && totalCarrito > 0;
  const progresoNivel = proximoNivel
    ? Math.min(100, ((nivelActual?.puntos_maximos || 0) - puntosParaProximoNivel) / (proximoNivel.puntos_minimos - (nivelActual?.puntos_minimos || 0)) * 100)
    : 100;

  return (
    <>
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg p-3 border border-primary-200 dark:border-primary-700">
        {/* Header con puntos */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: nivelActual?.color || '#6B7280' }}
            >
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {clienteNombre}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {nivelActual?.nombre || 'Sin nivel'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {puntosDisponibles.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">puntos disponibles</p>
          </div>
        </div>

        {/* Progreso al siguiente nivel */}
        {proximoNivel && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Próximo: {proximoNivel.nombre}</span>
              <span>{puntosParaProximoNivel.toLocaleString()} pts restantes</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progresoNivel}%`,
                  backgroundColor: proximoNivel.color || '#8B5CF6',
                }}
              />
            </div>
          </div>
        )}

        {/* Puntos que ganaría */}
        {puedeAcumular && puntosGanados > 0 && (
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md mb-2">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Ganarás <strong>{puntosGanados.toLocaleString()}</strong> puntos con esta compra
            </span>
          </div>
        )}

        {/* Nota si no acumula por cupón */}
        {tieneCupon && !config?.acumular_con_cupon && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mb-2">
            * No acumula puntos al usar cupón
          </div>
        )}

        {/* Botón de canje */}
        <button
          onClick={() => setShowCanjeModal(true)}
          disabled={!puedeCanjar}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            puedeCanjar
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <Gift className="w-4 h-4" />
          {puedeCanjar ? (
            <>
              Canjear puntos
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Mínimo {minimoPuntosCanje.toLocaleString()} pts para canjear
            </>
          )}
        </button>
      </div>

      {/* Modal de canje */}
      {showCanjeModal && (
        <CanjePuntosModal
          isOpen={showCanjeModal}
          onClose={() => setShowCanjeModal(false)}
          clienteId={clienteId}
          clienteNombre={clienteNombre}
          puntosDisponibles={puntosDisponibles}
          totalCarrito={totalCarrito}
          config={config}
          onCanjeAplicado={(descuento, puntosUsados) => {
            setShowCanjeModal(false);
            onCanjeAplicado?.(descuento, puntosUsados);
          }}
        />
      )}
    </>
  );
}
