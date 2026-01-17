import { useState } from 'react';
import { Clock, DollarSign, Check } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { useServiciosPublicos } from '@/hooks/otros';

/**
 * Componente para seleccionar servicios (Paso 1)
 * No requiere autenticación
 */
function SelectorServiciosPublico({
  organizacionId,
  serviciosSeleccionados,
  onSeleccionar,
  onSiguiente,
}) {
  const [seleccionados, setSeleccionados] = useState(
    serviciosSeleccionados.map((s) => s.id)
  );

  // Fetch de servicios públicos
  const { data: servicios, isLoading } = useServiciosPublicos(organizacionId);

  const handleToggleServicio = (servicio) => {
    const yaSeleccionado = seleccionados.includes(servicio.id);

    let nuevosSeleccionados;
    if (yaSeleccionado) {
      nuevosSeleccionados = seleccionados.filter((id) => id !== servicio.id);
    } else {
      nuevosSeleccionados = [...seleccionados, servicio.id];
    }

    setSeleccionados(nuevosSeleccionados);

    // Actualizar servicios seleccionados con datos completos
    const serviciosCompletos = servicios
      .filter((s) => nuevosSeleccionados.includes(s.id))
      .map((s) => ({
        id: s.id,
        nombre: s.nombre,
        precio: s.precio,
        duracion: s.duracion_minutos || s.duracion, // Backend retorna duracion_minutos
      }));

    onSeleccionar(serviciosCompletos);
  };

  const handleContinuar = () => {
    if (seleccionados.length > 0) {
      onSiguiente();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!servicios || servicios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Este negocio aún no tiene servicios disponibles para agendar
        </p>
      </div>
    );
  }

  // Calcular totales
  const duracionTotal = servicios
    .filter((s) => seleccionados.includes(s.id))
    .reduce((sum, s) => sum + (s.duracion_minutos || s.duracion || 0), 0);

  const precioTotal = servicios
    .filter((s) => seleccionados.includes(s.id))
    .reduce((sum, s) => sum + (s.precio || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Selecciona los servicios
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Puedes elegir uno o más servicios para tu cita
        </p>
      </div>

      {/* Lista de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servicios.map((servicio) => {
          const estaSeleccionado = seleccionados.includes(servicio.id);

          return (
            <button
              key={servicio.id}
              onClick={() => handleToggleServicio(servicio)}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${
                  estaSeleccionado
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                }
              `}
            >
              {/* Checkmark */}
              {estaSeleccionado && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Nombre */}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 pr-8">
                {servicio.nombre}
              </h3>

              {/* Descripción */}
              {servicio.descripcion && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {servicio.descripcion}
                </p>
              )}

              {/* Detalles */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{servicio.duracion_minutos || servicio.duracion || 30} min</span>
                </div>
                <div className="flex items-center gap-1 text-primary-700 dark:text-primary-400 font-semibold">
                  <DollarSign className="w-4 h-4" />
                  <span>${servicio.precio?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Resumen */}
      {seleccionados.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {seleccionados.length} servicio
                {seleccionados.length !== 1 ? 's' : ''} seleccionado
                {seleccionados.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {duracionTotal} min
                </span>
                <span className="text-lg font-bold text-primary-700 dark:text-primary-400">
                  ${precioTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <Button onClick={handleContinuar} size="lg">
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Mensaje si no hay selección */}
      {seleccionados.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Selecciona al menos un servicio para continuar
          </p>
        </div>
      )}
    </div>
  );
}

export default SelectorServiciosPublico;
