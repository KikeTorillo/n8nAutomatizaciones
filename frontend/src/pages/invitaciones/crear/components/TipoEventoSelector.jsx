/**
 * TipoEventoSelector — Selector visual de tipo de evento (paso 1)
 */
import { Heart, Crown, Baby, Cake } from 'lucide-react';
import { memo } from 'react';

const TIPOS = [
  { value: 'boda', label: 'Boda', icono: Heart, color: 'from-pink-500 to-rose-500', ring: 'ring-pink-500' },
  { value: 'xv_anos', label: 'XV Años', icono: Crown, color: 'from-purple-500 to-fuchsia-500', ring: 'ring-purple-500' },
  { value: 'bautizo', label: 'Bautizo', icono: Baby, color: 'from-blue-400 to-cyan-400', ring: 'ring-blue-400' },
  { value: 'cumpleanos', label: 'Cumpleaños', icono: Cake, color: 'from-amber-400 to-orange-500', ring: 'ring-amber-400' },
];

const TipoEventoSelector = memo(function TipoEventoSelector({ valor, onChange }) {
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        ¿Qué tipo de evento celebras?
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
        Selecciona el tipo de evento para mostrarte las mejores plantillas
      </p>
      <div className="grid grid-cols-2 gap-4">
        {TIPOS.map((tipo) => {
          const Icon = tipo.icono;
          const selected = valor === tipo.value;
          return (
            <button
              key={tipo.value}
              onClick={() => onChange(tipo.value)}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                selected
                  ? `border-transparent ring-2 ${tipo.ring} bg-gray-50 dark:bg-gray-800`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tipo.color} flex items-center justify-center text-white`}>
                <Icon className="w-7 h-7" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{tipo.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default TipoEventoSelector;
