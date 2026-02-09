/**
 * PointPaymentModal - Modal de pago con terminal MercadoPago Point
 *
 * Feb 2026: Flujo de 3 pasos:
 * 1. Seleccionar terminal
 * 2. Esperando pago (polling)
 * 3. Resultado (éxito/error)
 */

import { useState, useCallback, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, CreditCard, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/organisms/Modal';
import { Button, LoadingSpinner } from '@/components/ui';
import {
  useListarTerminales,
  useCrearOrdenPoint,
  useCancelarOrdenPoint,
  usePollingOrdenPoint,
} from '@/hooks/pos';

const PASO = { TERMINAL: 'terminal', ESPERANDO: 'esperando', RESULTADO: 'resultado' };

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

const MENSAJES_ERROR = {
  canceled: 'El pago fue cancelado',
  failed: 'El pago falló. Verifica la terminal e intenta de nuevo.',
  expired: 'El tiempo de espera expiró. Intenta de nuevo.',
};

export default function PointPaymentModal({ isOpen, onClose, monto, ventaId, onSuccess, onError }) {
  const [paso, setPaso] = useState(PASO.TERMINAL);
  const [terminalId, setTerminalId] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Hooks
  const { data: terminales = [], isLoading: cargandoTerminales } = useListarTerminales({ enabled: isOpen });
  const crearOrden = useCrearOrdenPoint();
  const cancelarOrden = useCancelarOrdenPoint();
  const { orden, status, isCompleted, isFailed, isPolling } = usePollingOrdenPoint(
    orderId,
    paso === PASO.ESPERANDO
  );

  // Auto-seleccionar si solo hay una terminal
  useEffect(() => {
    if (terminales.length === 1 && !terminalId) {
      setTerminalId(terminales[0].id || terminales[0].terminal_id);
    }
  }, [terminales, terminalId]);

  // Detectar resultado del polling
  useEffect(() => {
    if (isCompleted && orden) {
      setPaso(PASO.RESULTADO);
      onSuccess?.(orden);
    } else if (isFailed && status) {
      setErrorMsg(MENSAJES_ERROR[status] || 'Error desconocido');
      setPaso(PASO.RESULTADO);
    }
  }, [isCompleted, isFailed, orden, status, onSuccess]);

  // Timeout de 5 minutos
  useEffect(() => {
    if (paso !== PASO.ESPERANDO) return;
    const timer = setTimeout(() => {
      if (orderId) {
        cancelarOrden.mutate(orderId);
      }
      setErrorMsg('El tiempo de espera expiró. Intenta de nuevo.');
      setPaso(PASO.RESULTADO);
    }, TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [paso, orderId, cancelarOrden]);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setPaso(PASO.TERMINAL);
      setTerminalId('');
      setOrderId(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  // Enviar a terminal
  const handleEnviarATerminal = useCallback(async () => {
    if (!terminalId) return;

    try {
      const resultado = await crearOrden.mutateAsync({
        terminal_id: terminalId,
        venta_id: ventaId,
        monto,
      });
      setOrderId(resultado.order_id || resultado.id);
      setPaso(PASO.ESPERANDO);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al enviar a la terminal');
      setPaso(PASO.RESULTADO);
    }
  }, [terminalId, ventaId, monto, crearOrden]);

  // Cancelar pago
  const handleCancelar = useCallback(() => {
    if (orderId) {
      cancelarOrden.mutate(orderId);
    }
    onClose();
  }, [orderId, cancelarOrden, onClose]);

  // Reintentar
  const handleReintentar = useCallback(() => {
    setPaso(PASO.TERMINAL);
    setOrderId(null);
    setErrorMsg('');
  }, []);

  const tituloModal = {
    [PASO.TERMINAL]: 'Terminal Point',
    [PASO.ESPERANDO]: 'Esperando pago',
    [PASO.RESULTADO]: isCompleted ? 'Pago exitoso' : 'Error en pago',
  }[paso];

  return (
    <Modal
      isOpen={isOpen}
      onClose={paso === PASO.ESPERANDO ? undefined : onClose}
      title={tituloModal}
      size="sm"
      disableClose={paso === PASO.ESPERANDO}
    >
      <div className="space-y-6 py-2">
        {/* PASO 1: Seleccionar terminal */}
        {paso === PASO.TERMINAL && (
          <>
            <div className="text-center">
              <CreditCard className="w-12 h-12 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${monto?.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Selecciona la terminal para cobrar
              </p>
            </div>

            {cargandoTerminales ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="md" />
              </div>
            ) : terminales.length === 0 ? (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No hay terminales disponibles. Verifica tu configuración de MercadoPago.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {terminales.map((terminal) => {
                  const id = terminal.id || terminal.terminal_id;
                  const nombre = terminal.nombre || terminal.external_id || `Terminal ${id}`;
                  const isSelected = terminalId === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTerminalId(id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-200 dark:ring-primary-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 flex-shrink-0 ${
                        isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {nombre}
                        </p>
                        {terminal.status && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {terminal.status}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleEnviarATerminal}
                disabled={!terminalId || crearOrden.isPending}
                isLoading={crearOrden.isPending}
                className="flex-1"
              >
                Enviar a terminal
              </Button>
            </div>
          </>
        )}

        {/* PASO 2: Esperando pago */}
        {paso === PASO.ESPERANDO && (
          <>
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 mx-auto text-primary-500 animate-spin mb-4" />
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Esperando pago en terminal...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pide al cliente que presente su tarjeta en la terminal
              </p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-4">
                ${monto?.toFixed(2)}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleCancelar}
              className="w-full"
              disabled={cancelarOrden.isPending}
            >
              Cancelar pago
            </Button>
          </>
        )}

        {/* PASO 3: Resultado */}
        {paso === PASO.RESULTADO && (
          <>
            <div className="text-center py-6">
              {isCompleted ? (
                <>
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Pago procesado
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${monto?.toFixed(2)}
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {errorMsg || 'Error al procesar el pago'}
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              {!isCompleted && (
                <Button variant="outline" onClick={handleReintentar} className="flex-1">
                  Reintentar
                </Button>
              )}
              <Button
                variant={isCompleted ? 'primary' : 'outline'}
                onClick={onClose}
                className="flex-1"
              >
                {isCompleted ? 'Continuar' : 'Cerrar'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
