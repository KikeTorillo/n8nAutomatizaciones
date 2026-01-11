/**
 * ====================================================================
 * COMPONENTE - MODAL DE CANJE DE PUNTOS
 * ====================================================================
 *
 * Modal para canjear puntos de lealtad por descuento:
 * - Slider o input para seleccionar puntos a canjear
 * - Preview del descuento que obtendrá
 * - Validación en tiempo real
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

import { useState, useEffect } from 'react';
import { X, Gift, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { useValidarCanje } from '@/hooks/useLealtad';

/**
 * Modal para canjear puntos de lealtad
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {number} props.clienteId
 * @param {string} props.clienteNombre
 * @param {number} props.puntosDisponibles
 * @param {number} props.totalCarrito
 * @param {Object} props.config - Configuración del programa
 * @param {Function} props.onCanjeAplicado - Callback(descuento, puntosUsados)
 */
export default function CanjePuntosModal({
  isOpen,
  onClose,
  clienteId,
  clienteNombre,
  puntosDisponibles,
  totalCarrito,
  config,
  onCanjeAplicado,
}) {
  const [puntosACanjear, setPuntosACanjear] = useState(0);
  const [validacion, setValidacion] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validarMutation = useValidarCanje();

  // Configuración del programa
  const minimoPuntos = config?.minimo_puntos_canje || 100;
  const valorPunto = config?.pesos_por_punto_descuento
    ? 1 / config.pesos_por_punto_descuento
    : 0.01;
  const maxPorcentaje = config?.maximo_porcentaje_descuento || 50;

  // Calcular máximo de puntos canjeables
  const maxDescuento = totalCarrito * (maxPorcentaje / 100);
  const maxPuntosCanjeables = Math.min(
    puntosDisponibles,
    Math.floor(maxDescuento / valorPunto)
  );

  // Inicializar con mínimo canjeables
  useEffect(() => {
    if (isOpen) {
      setPuntosACanjear(Math.min(minimoPuntos, maxPuntosCanjeables));
      setValidacion(null);
    }
  }, [isOpen, minimoPuntos, maxPuntosCanjeables]);

  // Validar cuando cambian los puntos
  useEffect(() => {
    if (!isOpen || puntosACanjear < minimoPuntos) {
      setValidacion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const resultado = await validarMutation.mutateAsync({
          clienteId,
          puntos: puntosACanjear,
          totalVenta: totalCarrito,
        });
        setValidacion(resultado);
      } catch (error) {
        setValidacion({
          valido: false,
          mensaje: error.response?.data?.message || 'Error al validar',
        });
      } finally {
        setIsValidating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [puntosACanjear, clienteId, totalCarrito, minimoPuntos, isOpen]);

  if (!isOpen) return null;

  const descuentoEstimado = puntosACanjear * valorPunto;
  const nuevoTotal = Math.max(0, totalCarrito - descuentoEstimado);

  const handleConfirmar = () => {
    if (validacion?.valido) {
      onCanjeAplicado(validacion.descuento, puntosACanjear);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Canjear Puntos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {clienteNombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Saldo disponible */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Puntos disponibles
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {puntosDisponibles.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Selector de puntos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Puntos a canjear
          </label>

          {/* Input numérico */}
          <div className="flex items-center gap-4 mb-3">
            <input
              type="number"
              min={minimoPuntos}
              max={maxPuntosCanjeables}
              step={100}
              value={puntosACanjear}
              onChange={(e) => setPuntosACanjear(Math.min(maxPuntosCanjeables, Math.max(0, parseInt(e.target.value) || 0)))}
              className="flex-1 px-4 py-2 text-lg font-semibold text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              pts
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={maxPuntosCanjeables}
            step={100}
            value={puntosACanjear}
            onChange={(e) => setPuntosACanjear(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />

          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0</span>
            <span>Máx: {maxPuntosCanjeables.toLocaleString()}</span>
          </div>

          {/* Botones rápidos */}
          <div className="flex gap-2 mt-3">
            {[25, 50, 75, 100].map((pct) => {
              const puntos = Math.floor((pct / 100) * maxPuntosCanjeables);
              return (
                <button
                  key={pct}
                  onClick={() => setPuntosACanjear(puntos)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    puntosACanjear === puntos
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview del descuento */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total actual</span>
              <span className="text-gray-900 dark:text-white">
                ${totalCarrito.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Descuento ({puntosACanjear.toLocaleString()} pts)
              </span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                -${descuentoEstimado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex justify-between font-semibold">
              <span className="text-gray-900 dark:text-white">Nuevo total</span>
              <span className="text-primary-600 dark:text-primary-400">
                ${nuevoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Mensaje de validación */}
        {isValidating && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            Validando...
          </div>
        )}

        {validacion && !isValidating && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg mb-4 ${
              validacion.valido
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {validacion.valido ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm">{validacion.mensaje}</span>
          </div>
        )}

        {/* Nota de límite */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          * Máximo {maxPorcentaje}% del total puede pagarse con puntos
        </p>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!validacion?.valido || isValidating || puntosACanjear < minimoPuntos}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4" />
            Aplicar descuento
          </button>
        </div>
      </div>
    </div>
  );
}
