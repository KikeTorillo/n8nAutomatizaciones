import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Button from '@/components/ui/Button';

/**
 * Header del calendario con controles de navegación
 */
function CalendarioHeader({ mesActual, onMesAnterior, onMesSiguiente, onHoy, onCambiarMes }) {
  const [mostrarSelector, setMostrarSelector] = useState(false);

  // Generar array de meses
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  // Año actual y rango de años
  const añoActual = mesActual.getFullYear();
  const años = Array.from({ length: 10 }, (_, i) => añoActual - 5 + i);

  const handleCambiarFecha = (mes, año) => {
    const nuevaFecha = new Date(año, mes, 1);
    onCambiarMes(nuevaFecha);
    setMostrarSelector(false);
  };

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mes y año actual */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-white" />
            <button
              onClick={() => setMostrarSelector(!mostrarSelector)}
              className="text-xl font-bold text-white hover:text-primary-100 transition-colors"
            >
              {format(mesActual, 'MMMM yyyy', { locale: es })}
            </button>
          </div>
        </div>

        {/* Controles de navegación */}
        <div className="flex items-center gap-2">
          {/* Botón "Hoy" */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onHoy}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            Hoy
          </Button>

          {/* Botón mes anterior */}
          <button
            onClick={onMesAnterior}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Botón mes siguiente */}
          <button
            onClick={onMesSiguiente}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Selector de mes y año (dropdown) */}
      {mostrarSelector && (
        <div className="absolute z-10 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
          <div className="space-y-4">
            {/* Selector de año */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Año</label>
              <div className="grid grid-cols-5 gap-2">
                {años.map((año) => (
                  <button
                    key={año}
                    onClick={() => handleCambiarFecha(mesActual.getMonth(), año)}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${
                        año === añoActual
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {año}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de mes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mes</label>
              <div className="grid grid-cols-3 gap-2">
                {meses.map((mes, index) => (
                  <button
                    key={mes}
                    onClick={() => handleCambiarFecha(index, añoActual)}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${
                        index === mesActual.getMonth() && añoActual === mesActual.getFullYear()
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {mes}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón cerrar */}
            <div className="flex justify-end pt-2 border-t dark:border-gray-700">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMostrarSelector(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarioHeader;
