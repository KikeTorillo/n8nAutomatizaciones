import { useState } from 'react';
import { X, CreditCard, DollarSign, Smartphone, RefreshCw, Check } from 'lucide-react';

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

  if (!isOpen) return null;

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
    green: 'bg-green-50 border-green-200 hover:border-green-400 checked:border-green-600 checked:bg-green-100',
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 checked:border-blue-600 checked:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 checked:border-purple-600 checked:bg-purple-100',
    cyan: 'bg-cyan-50 border-cyan-200 hover:border-cyan-400 checked:border-cyan-600 checked:bg-cyan-100',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Método de Pago</h3>
              <p className="mt-1 text-sm text-gray-500">Selecciona cómo recibirás el pago</p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Total a cobrar */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">Total a cobrar</p>
              <p className="text-4xl font-bold text-blue-600">${total.toFixed(2)}</p>
            </div>

            {/* Métodos de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
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
                        ${isSelected ? 'ring-2 ring-offset-2 ring-' + metodoItem.color + '-500' : ''}
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
                      <Icon className={`h-6 w-6 text-${metodoItem.color}-600`} />
                      <span className="font-medium text-gray-900">{metodoItem.label}</span>
                      {isSelected && (
                        <Check className={`ml-auto h-5 w-5 text-${metodoItem.color}-600`} />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Monto pagado (solo para efectivo) */}
            {metodo === 'efectivo' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto recibido
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xl">$</span>
                  </div>
                  <input
                    type="number"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)}
                    step="0.01"
                    min={total}
                    className={`
                      w-full pl-8 pr-4 py-3 text-xl font-semibold border-2 rounded-lg
                      focus:ring-2 focus:ring-green-500 focus:border-transparent
                      ${montoInsuficiente ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                    autoFocus
                  />
                </div>

                {/* Botones de monto rápido */}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMontoPagado(total.toFixed(2))}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Exacto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMontoRapido(5)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    +5%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMontoRapido(10)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    +10%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMontoRapido(20)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    +20%
                  </button>
                </div>

                {/* Cambio */}
                {cambio > 0 && (
                  <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900 mb-1">Cambio a entregar</p>
                    <p className="text-2xl font-bold text-green-600">${cambio.toFixed(2)}</p>
                  </div>
                )}

                {/* Alerta de monto insuficiente */}
                {montoInsuficiente && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800">
                      El monto recibido es insuficiente
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={isLoading || montoInsuficiente}
              className="px-8 py-2.5 text-white font-semibold bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Confirmar Venta
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
