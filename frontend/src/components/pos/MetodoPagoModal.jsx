import { useState } from 'react';
import { CreditCard, DollarSign, Smartphone, RefreshCw, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

/**
 * Modal para seleccionar método de pago y finalizar venta
 */
export default function MetodoPagoModal({
  isOpen,
  onClose,
  total,
  onConfirmar,
  isLoading = false
}) {
  const [metodo, setMetodo] = useState('efectivo');
  const [montoPagado, setMontoPagado] = useState(total.toFixed(2));

  const metodosDisponibles = [
    { value: 'efectivo', label: 'Efectivo', icon: DollarSign, color: 'green' },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'blue' },
    { value: 'transferencia', label: 'Transferencia', icon: RefreshCw, color: 'purple' },
    { value: 'qr', label: 'QR Mercado Pago', icon: Smartphone, color: 'cyan' },
  ];

  const cambio = metodo === 'efectivo' ? Math.max(0, parseFloat(montoPagado || 0) - total) : 0;
  const montoInsuficiente = parseFloat(montoPagado || 0) < total;

  const handleConfirmar = () => {
    if (montoInsuficiente) return;

    onConfirmar({
      metodo_pago: metodo,
      monto_pagado: parseFloat(montoPagado),
      cambio
    });
  };

  const handleMontoRapido = (porcentaje) => {
    const monto = (total * (1 + porcentaje / 100)).toFixed(2);
    setMontoPagado(monto);
  };

  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
    blue: 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 hover:border-primary-400 dark:hover:border-primary-600',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600',
  };

  const selectedColorClasses = {
    green: 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-green-500 border-green-600 dark:border-green-500 bg-green-100 dark:bg-green-900/50',
    blue: 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-primary-500 border-primary-600 dark:border-primary-500 bg-primary-100 dark:bg-primary-900/50',
    purple: 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-purple-500 border-purple-600 dark:border-purple-500 bg-purple-100 dark:bg-purple-900/50',
    cyan: 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-cyan-500 border-cyan-600 dark:border-cyan-500 bg-cyan-100 dark:bg-cyan-900/50',
  };

  const iconColorClasses = {
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-primary-600 dark:text-primary-400',
    purple: 'text-purple-600 dark:text-purple-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
  };

  const footerContent = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isLoading}
      >
        Cancelar
      </Button>
      <Button
        variant="success"
        size="lg"
        onClick={handleConfirmar}
        disabled={montoInsuficiente}
        isLoading={isLoading}
      >
        <Check className="h-5 w-5 mr-2" />
        Confirmar Venta
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Método de Pago"
      subtitle="Selecciona cómo recibirás el pago"
      size="sm"
      footer={footerContent}
      disableClose={isLoading}
    >
      <div className="space-y-6">
        {/* Total a cobrar */}
        <div className="bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <p className="text-sm font-medium text-primary-900 dark:text-primary-300 mb-1">Total a cobrar</p>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">${total.toFixed(2)}</p>
        </div>

        {/* Métodos de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Selecciona el método de pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            {metodosDisponibles.map((metodoItem) => {
              const Icon = metodoItem.icon;
              const isSelected = metodo === metodoItem.value;

              return (
                <label
                  key={metodoItem.value}
                  className={`
                    relative flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${colorClasses[metodoItem.color]}
                    ${isSelected ? selectedColorClasses[metodoItem.color] : ''}
                  `}
                >
                  <input
                    type="radio"
                    name="metodo"
                    value={metodoItem.value}
                    checked={isSelected}
                    onChange={(e) => setMetodo(e.target.value)}
                    className="sr-only"
                  />
                  <Icon className={`h-6 w-6 ${iconColorClasses[metodoItem.color]}`} />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{metodoItem.label}</span>
                  {isSelected && (
                    <Check className={`ml-auto h-5 w-5 ${iconColorClasses[metodoItem.color]}`} />
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Monto pagado (solo para efectivo) */}
        {metodo === 'efectivo' && (
          <div>
            <Input
              type="number"
              label="Monto recibido"
              prefix="$"
              inputSize="lg"
              value={montoPagado}
              onChange={(e) => setMontoPagado(e.target.value)}
              step="0.01"
              min={total}
              error={montoInsuficiente ? 'El monto recibido es insuficiente' : undefined}
              autoFocus
            />

            {/* Botones de monto rápido */}
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMontoPagado(total.toFixed(2))}
              >
                Exacto
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleMontoRapido(5)}
              >
                +5%
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleMontoRapido(10)}
              >
                +10%
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleMontoRapido(20)}
              >
                +20%
              </Button>
            </div>

            {/* Cambio */}
            {cambio > 0 && (
              <div className="mt-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">Cambio a entregar</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">${cambio.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
