import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useRegistrarPagoOrdenCompra } from '@/hooks/useOrdenesCompra';

/**
 * Modal para registrar pagos de una orden de compra
 */
export default function RegistrarPagoModal({ isOpen, onClose, orden }) {
  const { showToast } = useToast();

  // Estado del formulario
  const [monto, setMonto] = useState('');

  // Mutation
  const pagoMutation = useRegistrarPagoOrdenCompra();

  // Calcular saldo pendiente
  const total = parseFloat(orden?.total || 0);
  const pagado = parseFloat(orden?.monto_pagado || 0);
  const pendiente = total - pagado;

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setMonto(pendiente.toFixed(2));
    }
  }, [isOpen, pendiente]);

  const handleMontoChange = (valor) => {
    const montoNum = parseFloat(valor) || 0;
    // No permitir más que el pendiente
    if (montoNum > pendiente) {
      setMonto(pendiente.toFixed(2));
    } else {
      setMonto(valor);
    }
  };

  const handlePagarTodo = () => {
    setMonto(pendiente.toFixed(2));
  };

  const handleSubmit = () => {
    const montoNum = parseFloat(monto) || 0;

    if (montoNum <= 0) {
      showToast('El monto debe ser mayor a 0', 'warning');
      return;
    }

    if (montoNum > pendiente) {
      showToast('El monto no puede ser mayor al saldo pendiente', 'warning');
      return;
    }

    pagoMutation.mutate(
      { id: orden.id, monto: montoNum },
      {
        onSuccess: () => {
          const esPagoTotal = montoNum >= pendiente;
          showToast(
            esPagoTotal
              ? 'Orden pagada completamente'
              : 'Pago registrado correctamente',
            'success'
          );
          onClose();
        },
        onError: (error) => {
          showToast(
            error.response?.data?.mensaje || 'Error al registrar el pago',
            'error'
          );
        },
      }
    );
  };

  if (!orden) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registrar Pago - ${orden.folio}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Resumen de la orden */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total de la Orden:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Ya Pagado:</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              ${pagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Pendiente:</span>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              ${pendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Información de crédito */}
        {orden.dias_credito > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex items-start">
            <AlertCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-primary-700 dark:text-primary-300">
              <p className="font-medium">Orden con crédito de {orden.dias_credito} días</p>
              {orden.fecha_vencimiento_pago && (
                <p className="mt-1 text-primary-600 dark:text-primary-400">
                  Vencimiento: {new Date(orden.fecha_vencimiento_pago).toLocaleDateString('es-MX')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Campo de monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Monto a Pagar
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              type="number"
              min="0.01"
              max={pendiente}
              step="0.01"
              value={monto}
              onChange={(e) => handleMontoChange(e.target.value)}
              className="pl-8 w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg"
              placeholder="0.00"
            />
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Máximo: ${pendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <button
              type="button"
              onClick={handlePagarTodo}
              className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
            >
              Pagar todo
            </button>
          </div>
        </div>

        {/* Vista previa del resultado */}
        {parseFloat(monto) > 0 && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-700 dark:text-green-300">
              Después de este pago, el saldo pendiente será:{' '}
              <span className="font-bold">
                ${(pendiente - parseFloat(monto || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </p>
            {parseFloat(monto) >= pendiente && (
              <p className="text-sm text-green-700 dark:text-green-300 font-medium mt-1">
                La orden quedará completamente pagada.
              </p>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={pagoMutation.isPending}
            disabled={!monto || parseFloat(monto) <= 0}
            icon={DollarSign}
          >
            Registrar Pago
          </Button>
        </div>
      </div>
    </Modal>
  );
}
