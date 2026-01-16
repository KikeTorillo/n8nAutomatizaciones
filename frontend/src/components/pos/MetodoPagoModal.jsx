import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  Smartphone,
  RefreshCw,
  Check,
  Plus,
  Trash2,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import TecladoBilletes from './TecladoBilletes';

/**
 * Modal para seleccionar método(s) de pago y finalizar venta
 * Soporta pago split (múltiples métodos) - Ene 2026
 */
export default function MetodoPagoModal({
  isOpen,
  onClose,
  total,
  onConfirmar,
  isLoading = false,
  clienteId = null,
  clienteCredito = null // { permite_credito, limite_credito, saldo_credito, disponible }
}) {
  // Estado para pagos múltiples
  const [pagos, setPagos] = useState([]);
  const [metodoPagoActual, setMetodoPagoActual] = useState('efectivo');
  const [montoActual, setMontoActual] = useState(0);
  const [montoRecibidoActual, setMontoRecibidoActual] = useState(0);
  const [referenciaActual, setReferenciaActual] = useState('');

  // Métodos de pago disponibles
  const metodosDisponibles = useMemo(() => {
    const metodos = [
      { value: 'efectivo', label: 'Efectivo', icon: DollarSign, color: 'green' },
      { value: 'tarjeta_debito', label: 'Débito', icon: CreditCard, color: 'blue' },
      { value: 'tarjeta_credito', label: 'Crédito', icon: CreditCard, color: 'purple' },
      { value: 'transferencia', label: 'Transferencia', icon: RefreshCw, color: 'orange' },
      { value: 'qr_mercadopago', label: 'QR MP', icon: Smartphone, color: 'cyan' },
    ];

    // Agregar cuenta_cliente solo si el cliente tiene crédito habilitado
    if (clienteCredito?.permite_credito && !clienteCredito?.credito_suspendido) {
      metodos.push({
        value: 'cuenta_cliente',
        label: 'A Cuenta',
        icon: Wallet,
        color: 'amber',
        disponible: clienteCredito.disponible || 0
      });
    }

    return metodos;
  }, [clienteCredito]);

  // Cálculos
  const totalPagado = useMemo(() =>
    pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0), [pagos]
  );

  const restante = useMemo(() =>
    Math.max(0, total - totalPagado), [total, totalPagado]
  );

  const cambioTotal = useMemo(() =>
    pagos.reduce((sum, p) => sum + (parseFloat(p.cambio) || 0), 0), [pagos]
  );

  const puedePagar = useMemo(() =>
    totalPagado >= total && pagos.length > 0, [totalPagado, total, pagos.length]
  );

  // Resetear al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setPagos([]);
      setMetodoPagoActual('efectivo');
      setMontoActual(total);
      setMontoRecibidoActual(total);
      setReferenciaActual('');
    }
  }, [isOpen, total]);

  // Manejar cambio de monto para efectivo
  const handleMontoEfectivoChange = useCallback((nuevoMonto) => {
    setMontoRecibidoActual(nuevoMonto);
  }, []);

  // Agregar pago a la lista
  const agregarPago = useCallback(() => {
    const monto = parseFloat(montoActual) || 0;
    if (monto <= 0) return;

    // Validar límite de crédito para cuenta_cliente
    if (metodoPagoActual === 'cuenta_cliente') {
      const disponible = clienteCredito?.disponible || 0;
      if (monto > disponible) {
        alert(`El monto excede el crédito disponible ($${disponible.toFixed(2)})`);
        return;
      }
    }

    let cambio = 0;
    let montoRecibido = null;

    if (metodoPagoActual === 'efectivo') {
      montoRecibido = parseFloat(montoRecibidoActual) || monto;
      cambio = Math.max(0, montoRecibido - monto);
    }

    const nuevoPago = {
      id: Date.now(), // ID temporal para key
      metodo_pago: metodoPagoActual,
      monto,
      monto_recibido: montoRecibido,
      cambio,
      referencia: referenciaActual.trim() || undefined,
    };

    setPagos(prev => [...prev, nuevoPago]);

    // Resetear para siguiente pago
    const nuevoRestante = Math.max(0, restante - monto);
    setMontoActual(nuevoRestante);
    setMontoRecibidoActual(nuevoRestante);
    setReferenciaActual('');

    // Si ya se cubrió el total, no cambiar método
    if (nuevoRestante > 0) {
      // Cambiar a siguiente método disponible
      const siguienteMetodo = metodosDisponibles.find(m =>
        m.value !== metodoPagoActual && !pagos.some(p => p.metodo_pago === m.value)
      );
      if (siguienteMetodo) {
        setMetodoPagoActual(siguienteMetodo.value);
      }
    }
  }, [montoActual, montoRecibidoActual, metodoPagoActual, referenciaActual, restante, clienteCredito, metodosDisponibles, pagos]);

  // Eliminar pago de la lista
  const eliminarPago = useCallback((pagoId) => {
    setPagos(prev => prev.filter(p => p.id !== pagoId));
  }, []);

  // Confirmar venta con todos los pagos
  const handleConfirmar = useCallback(() => {
    if (!puedePagar) return;

    // Formatear pagos para la API
    const pagosFormateados = pagos.map(p => ({
      metodo_pago: p.metodo_pago,
      monto: p.monto,
      monto_recibido: p.monto_recibido,
      referencia: p.referencia,
    }));

    onConfirmar({
      pagos: pagosFormateados,
      total_pagado: totalPagado,
      cambio_total: cambioTotal,
      cliente_id: clienteId,
    });
  }, [puedePagar, pagos, totalPagado, cambioTotal, clienteId, onConfirmar]);

  // Pago rápido con un solo método
  const pagoRapido = useCallback(() => {
    const monto = total;
    let cambio = 0;
    let montoRecibido = null;

    if (metodoPagoActual === 'efectivo') {
      montoRecibido = parseFloat(montoRecibidoActual) || monto;
      cambio = Math.max(0, montoRecibido - monto);
    }

    const pago = {
      metodo_pago: metodoPagoActual,
      monto,
      monto_recibido: montoRecibido,
      referencia: referenciaActual.trim() || undefined,
    };

    onConfirmar({
      pagos: [pago],
      total_pagado: monto,
      cambio_total: cambio,
      cliente_id: clienteId,
    });
  }, [total, metodoPagoActual, montoRecibidoActual, referenciaActual, clienteId, onConfirmar]);

  // Clases de color
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    blue: 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
    amber: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  };

  const selectedColorClasses = {
    green: 'ring-2 ring-green-500 border-green-500',
    blue: 'ring-2 ring-primary-500 border-primary-500',
    purple: 'ring-2 ring-purple-500 border-purple-500',
    orange: 'ring-2 ring-orange-500 border-orange-500',
    cyan: 'ring-2 ring-cyan-500 border-cyan-500',
    amber: 'ring-2 ring-amber-500 border-amber-500',
  };

  const iconColorClasses = {
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-primary-600 dark:text-primary-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };

  const getMetodoInfo = (metodoPago) =>
    metodosDisponibles.find(m => m.value === metodoPago);

  const footerContent = (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isLoading}
        className="sm:flex-1"
      >
        Cancelar
      </Button>

      {pagos.length === 0 ? (
        <Button
          variant="success"
          size="lg"
          onClick={pagoRapido}
          disabled={metodoPagoActual === 'efectivo' && montoRecibidoActual < total}
          isLoading={isLoading}
          className="sm:flex-1"
        >
          <Check className="h-5 w-5 mr-2" />
          Pagar ${total.toFixed(2)}
        </Button>
      ) : (
        <Button
          variant="success"
          size="lg"
          onClick={handleConfirmar}
          disabled={!puedePagar}
          isLoading={isLoading}
          className="sm:flex-1"
        >
          <Check className="h-5 w-5 mr-2" />
          Confirmar Venta
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Método de Pago"
      subtitle={pagos.length > 0 ? "Pago dividido activo" : "Selecciona cómo recibirás el pago"}
      size="md"
      footer={footerContent}
      disableClose={isLoading}
    >
      <div className="space-y-5">
        {/* Total y resumen */}
        <div className="flex gap-4">
          <div className="flex-1 bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <p className="text-xs font-medium text-primary-900 dark:text-primary-300 mb-1">Total</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">${total.toFixed(2)}</p>
          </div>

          {pagos.length > 0 && (
            <>
              <div className="flex-1 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-xs font-medium text-green-900 dark:text-green-300 mb-1">Pagado</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">${totalPagado.toFixed(2)}</p>
              </div>

              {restante > 0 && (
                <div className="flex-1 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-300 mb-1">Restante</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">${restante.toFixed(2)}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagos registrados */}
        {pagos.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pagos registrados</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pagos.map(pago => {
                const metodoInfo = getMetodoInfo(pago.metodo_pago);
                const Icon = metodoInfo?.icon || DollarSign;

                return (
                  <div
                    key={pago.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${colorClasses[metodoInfo?.color || 'green']}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${iconColorClasses[metodoInfo?.color || 'green']}`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {metodoInfo?.label || pago.metodo_pago}
                        </p>
                        {pago.cambio > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Recibido: ${pago.monto_recibido.toFixed(2)} | Cambio: ${pago.cambio.toFixed(2)}
                          </p>
                        )}
                        {pago.referencia && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ref: {pago.referencia}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        ${pago.monto.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarPago(pago.id)}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {cambioTotal > 0 && (
              <div className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Cambio total a devolver
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${cambioTotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Agregar nuevo pago (solo si hay restante o no hay pagos) */}
        {(restante > 0 || pagos.length === 0) && (
          <>
            {/* Métodos de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {pagos.length > 0 ? 'Agregar otro método' : 'Método de pago'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {metodosDisponibles.map((metodoItem) => {
                  const Icon = metodoItem.icon;
                  const isSelected = metodoPagoActual === metodoItem.value;

                  return (
                    <button
                      key={metodoItem.value}
                      type="button"
                      onClick={() => setMetodoPagoActual(metodoItem.value)}
                      className={`
                        flex flex-col items-center gap-1 p-3 border-2 rounded-lg transition-all
                        ${colorClasses[metodoItem.color]}
                        ${isSelected ? selectedColorClasses[metodoItem.color] : 'hover:opacity-80'}
                      `}
                    >
                      <Icon className={`h-5 w-5 ${iconColorClasses[metodoItem.color]}`} />
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {metodoItem.label}
                      </span>
                      {metodoItem.value === 'cuenta_cliente' && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                          Disp: ${(metodoItem.disponible || 0).toFixed(0)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monto del pago actual */}
            {pagos.length > 0 && (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    type="number"
                    label="Monto de este pago"
                    prefix="$"
                    value={montoActual}
                    onChange={(e) => setMontoActual(e.target.value)}
                    step="0.01"
                    min="0.01"
                    max={restante}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMontoActual(restante)}
                  className="mb-0.5"
                >
                  Restante
                </Button>
              </div>
            )}

            {/* Referencia para métodos no efectivo */}
            {!['efectivo', 'cuenta_cliente'].includes(metodoPagoActual) && pagos.length > 0 && (
              <Input
                type="text"
                label="Referencia (opcional)"
                value={referenciaActual}
                onChange={(e) => setReferenciaActual(e.target.value)}
                placeholder="# autorización, # transferencia"
                maxLength={100}
              />
            )}

            {/* Teclado de billetes para efectivo */}
            {metodoPagoActual === 'efectivo' && (
              <TecladoBilletes
                total={pagos.length > 0 ? restante : total}
                onMontoChange={handleMontoEfectivoChange}
                initialValue={pagos.length > 0 ? restante : total}
              />
            )}

            {/* Alerta para cuenta_cliente */}
            {metodoPagoActual === 'cuenta_cliente' && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Venta a crédito (Fiado)</p>
                  <p>El cliente tiene ${(clienteCredito?.disponible || 0).toFixed(2)} de crédito disponible.</p>
                  <p>Este monto se agregará a su saldo pendiente.</p>
                </div>
              </div>
            )}

            {/* Botón agregar pago (solo si hay pagos existentes) */}
            {pagos.length > 0 && restante > 0 && (
              <Button
                variant="secondary"
                onClick={agregarPago}
                disabled={!montoActual || montoActual <= 0}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar pago de ${(parseFloat(montoActual) || 0).toFixed(2)}
              </Button>
            )}

            {/* Botón dividir pago (si no hay pagos y quiere split) */}
            {pagos.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  // Fix Ene 2026: No depender de setState asíncrono, agregar pago directo
                  const montoSplit = montoRecibidoActual > 0 && montoRecibidoActual < total
                    ? montoRecibidoActual // Usar monto ingresado por usuario
                    : total / 2;          // Por defecto: mitad del total

                  let cambio = 0;
                  let montoRecibido = null;

                  if (metodoPagoActual === 'efectivo') {
                    montoRecibido = montoSplit;
                    cambio = 0; // Sin cambio en pago split
                  }

                  const nuevoPago = {
                    id: Date.now(),
                    metodo_pago: metodoPagoActual,
                    monto: montoSplit,
                    monto_recibido: montoRecibido,
                    cambio,
                    referencia: undefined,
                  };

                  setPagos([nuevoPago]);

                  // Preparar para siguiente pago
                  const nuevoRestante = total - montoSplit;
                  setMontoActual(nuevoRestante);
                  setMontoRecibidoActual(nuevoRestante);

                  // Cambiar a siguiente método
                  const siguienteMetodo = metodosDisponibles.find(m => m.value !== metodoPagoActual);
                  if (siguienteMetodo) {
                    setMetodoPagoActual(siguienteMetodo.value);
                  }
                }}
                className="w-full text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                ¿Dividir el pago entre varios métodos?
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
