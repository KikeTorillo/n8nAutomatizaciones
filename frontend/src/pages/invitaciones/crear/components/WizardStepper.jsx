/**
 * WizardStepper — Indicador de pasos del wizard de creación
 */
import { Check } from 'lucide-react';
import { memo } from 'react';

const PASOS = [
  { label: 'Tipo' },
  { label: 'Plantilla' },
];

const WizardStepper = memo(function WizardStepper({ pasoActual }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {PASOS.map((paso, i) => {
        const completado = i < pasoActual;
        const activo = i === pasoActual;

        return (
          <div key={paso.label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                completado
                  ? 'bg-pink-500 text-white'
                  : activo
                    ? 'bg-pink-500 text-white ring-4 ring-pink-500/20'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {completado ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`hidden sm:inline text-sm font-medium ${
                activo ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {paso.label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 ${
                completado ? 'bg-pink-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
});

export default WizardStepper;
