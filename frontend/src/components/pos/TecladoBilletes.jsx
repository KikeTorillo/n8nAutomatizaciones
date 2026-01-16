import { useState, useEffect } from 'react';
import { DollarSign, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Teclado de billetes para pago en efectivo
 * Permite sumar denominaciones y calcular cambio
 */
export default function TecladoBilletes({
  total,
  onMontoChange,
  initialValue = 0
}) {
  const [monto, setMonto] = useState(initialValue);

  // Denominaciones mexicanas
  const billetes = [
    { valor: 1000, label: '$1,000', color: 'purple' },
    { valor: 500, label: '$500', color: 'blue' },
    { valor: 200, label: '$200', color: 'green' },
    { valor: 100, label: '$100', color: 'red' },
    { valor: 50, label: '$50', color: 'pink' },
    { valor: 20, label: '$20', color: 'indigo' },
  ];

  const monedas = [
    { valor: 10, label: '$10' },
    { valor: 5, label: '$5' },
    { valor: 2, label: '$2' },
    { valor: 1, label: '$1' },
  ];

  const cambio = Math.max(0, monto - total);
  const esMontoSuficiente = monto >= total;

  useEffect(() => {
    onMontoChange?.(monto);
  }, [monto, onMontoChange]);

  useEffect(() => {
    setMonto(initialValue);
  }, [initialValue]);

  const handleAgregar = (valor) => {
    setMonto(prev => prev + valor);
  };

  const handleReset = () => {
    setMonto(0);
  };

  const handleMontoExacto = () => {
    setMonto(total);
  };

  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 border-purple-200 dark:border-purple-800',
    blue: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/60 border-primary-200 dark:border-primary-800',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 border-green-200 dark:border-green-800',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 border-red-200 dark:border-red-800',
    pink: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/60 border-pink-200 dark:border-pink-800',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 border-indigo-200 dark:border-indigo-800',
  };

  return (
    <div className="space-y-4">
      {/* Display de totales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">${total.toFixed(2)}</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${
          esMontoSuficiente
            ? 'bg-green-100 dark:bg-green-900/40'
            : 'bg-yellow-100 dark:bg-yellow-900/40'
        }`}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recibido</p>
          <p className={`text-lg font-bold ${
            esMontoSuficiente
              ? 'text-green-700 dark:text-green-300'
              : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            ${monto.toFixed(2)}
          </p>
        </div>
        <div className={`rounded-lg p-3 text-center ${
          cambio > 0
            ? 'bg-primary-100 dark:bg-primary-900/40'
            : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cambio</p>
          <p className={`text-lg font-bold ${
            cambio > 0
              ? 'text-primary-700 dark:text-primary-300'
              : 'text-gray-400'
          }`}>
            ${cambio.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Billetes */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billetes</p>
        <div className="grid grid-cols-3 gap-2">
          {billetes.map((billete) => (
            <button
              key={billete.valor}
              onClick={() => handleAgregar(billete.valor)}
              className={`
                px-4 py-3 rounded-lg border-2 font-bold text-sm
                transition-all active:scale-95
                ${colorClasses[billete.color]}
              `}
            >
              {billete.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monedas */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monedas</p>
        <div className="grid grid-cols-4 gap-2">
          {monedas.map((moneda) => (
            <button
              key={moneda.valor}
              onClick={() => handleAgregar(moneda.valor)}
              className="
                px-3 py-2 rounded-lg border-2
                bg-amber-100 dark:bg-amber-900/40
                text-amber-700 dark:text-amber-300
                hover:bg-amber-200 dark:hover:bg-amber-900/60
                border-amber-200 dark:border-amber-800
                font-bold text-sm transition-all active:scale-95
              "
            >
              {moneda.label}
            </button>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex-1"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Borrar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleMontoExacto}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
          Exacto
        </Button>
      </div>

      {/* Mensaje de faltante */}
      {!esMontoSuficiente && monto > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Faltan <span className="font-bold">${(total - monto).toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
