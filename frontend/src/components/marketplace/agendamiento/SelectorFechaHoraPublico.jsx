import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useDisponibilidadPublica } from '@/hooks/useMarketplace';

/**
 * Componente para seleccionar fecha y hora con verificación de disponibilidad en tiempo real (Paso 2)
 */
function SelectorFechaHoraPublico({
  organizacionId,
  serviciosIds,
  fechaSeleccionada,
  horaSeleccionada,
  onSeleccionar,
  onSiguiente,
  onAnterior,
}) {
  const [fecha, setFecha] = useState(fechaSeleccionada || '');
  const [hora, setHora] = useState(horaSeleccionada || '');

  // Obtener fecha mínima (hoy)
  const hoy = new Date().toISOString().split('T')[0];

  // Consultar disponibilidad cuando se selecciona una fecha
  const { data: disponibilidad, isLoading, error } = useDisponibilidadPublica(
    organizacionId,
    {
      fecha,
      servicios_ids: serviciosIds,
      solo_disponibles: true,
    }
  );

  // Reset hora cuando cambia la fecha
  useEffect(() => {
    if (fecha !== fechaSeleccionada) {
      setHora('');
    }
  }, [fecha, fechaSeleccionada]);

  const handleContinuar = () => {
    if (fecha && hora) {
      onSeleccionar(fecha, hora);
      onSiguiente();
    }
  };

  // Extraer slots disponibles del primer día (asumiendo rango_dias=1)
  const slotsDisponibles = disponibilidad?.dias?.[0]?.slots_disponibles || [];
  const puedeContinuar = fecha && hora && slotsDisponibles.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Selecciona fecha y hora
        </h2>
        <p className="text-gray-600 mt-1">
          Elige cuándo quieres tu cita
        </p>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Fecha
          </label>
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            min={hoy}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            La cita debe ser a partir de hoy
          </p>
        </div>

        {/* Hora - Selector de slots disponibles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Hora disponible
          </label>

          {/* Estado: sin fecha seleccionada */}
          {!fecha && (
            <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg border border-gray-200">
              Selecciona una fecha para ver los horarios disponibles
            </p>
          )}

          {/* Estado: cargando disponibilidad */}
          {fecha && isLoading && (
            <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Consultando disponibilidad...</span>
            </div>
          )}

          {/* Estado: error al consultar */}
          {fecha && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error al consultar disponibilidad</p>
                  <p className="text-sm text-red-700 mt-1">
                    {error.response?.data?.message || 'Intenta de nuevo más tarde'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado: no hay slots disponibles */}
          {fecha && !isLoading && !error && slotsDisponibles.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">No hay horarios disponibles</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Por favor selecciona otra fecha
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado: slots disponibles */}
          {fecha && !isLoading && !error && slotsDisponibles.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                {slotsDisponibles.map((slot) => (
                  <button
                    key={slot.hora}
                    type="button"
                    onClick={() => setHora(slot.hora)}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all
                      ${hora === slot.hora
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                      }
                    `}
                  >
                    {slot.hora}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {slotsDisponibles.length} {slotsDisponibles.length === 1 ? 'horario disponible' : 'horarios disponibles'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={onAnterior}
        >
          Anterior
        </Button>
        <Button
          onClick={handleContinuar}
          disabled={!puedeContinuar}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}

export default SelectorFechaHoraPublico;
