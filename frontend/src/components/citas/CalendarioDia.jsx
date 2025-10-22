import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Move } from 'lucide-react';
import { formatearHora, aFormatoISO } from '@/utils/dateHelpers';

/**
 * Obtiene el color de fondo según el estado de la cita
 */
const obtenerColorFondo = (estado) => {
  const colores = {
    pendiente: 'bg-yellow-500',
    confirmada: 'bg-blue-500',
    en_curso: 'bg-purple-500',
    completada: 'bg-green-500',
    cancelada: 'bg-red-500',
    no_show: 'bg-orange-500',
  };
  return colores[estado] || 'bg-gray-500';
};

/**
 * Verifica si una cita puede ser reagendada (drag & drop)
 */
const citaPuedeSerReagendada = (estado) => {
  // Solo citas pendientes y confirmadas pueden ser reagendadas
  return ['pendiente', 'confirmada'].includes(estado);
};

/**
 * Componente de celda individual del calendario
 * Muestra el día y las citas programadas para ese día
 */
function CalendarioDia({
  dia,
  citas,
  esDelMesActual,
  esHoy,
  onVerCita,
  onCrearCita,
  onDragStart,
  onDrop,
  isLoading
}) {
  const numeroDia = format(dia, 'd');
  const maxCitasVisibles = 3;
  const citasVisibles = citas.slice(0, maxCitasVisibles);
  const citasOcultas = citas.length - maxCitasVisibles;

  // Estado para tracking de drag over
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Handlers de drag & drop
  const handleDragOver = (e) => {
    e.preventDefault(); // Necesario para permitir drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (esDelMesActual) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Solo cambiar si realmente salimos del div (no de hijos)
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (!esDelMesActual) return;

    const citaData = e.dataTransfer.getData('application/json');
    if (citaData) {
      const cita = JSON.parse(citaData);
      const nuevaFecha = aFormatoISO(dia);
      onDrop && onDrop(cita, nuevaFecha);
    }
  };

  const handleCitaDragStart = (e, cita) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(cita));
    onDragStart && onDragStart(cita);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        min-h-[120px] border border-gray-200 rounded-lg p-2 transition-all
        ${esDelMesActual ? 'bg-white' : 'bg-gray-50'}
        ${esHoy ? 'ring-2 ring-primary-500 ring-inset' : ''}
        ${isDraggingOver && esDelMesActual ? 'ring-2 ring-green-500 bg-green-50' : ''}
        hover:shadow-md
        relative
        group
      `}
    >
      {/* Número del día */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            text-sm font-semibold
            ${esDelMesActual ? 'text-gray-900' : 'text-gray-400'}
            ${esHoy ? 'text-primary-600' : ''}
          `}
        >
          {numeroDia}
        </span>

        {/* Botón para crear cita (solo visible cuando NO hay citas) */}
        {esDelMesActual && citas.length === 0 && (
          <button
            onClick={onCrearCita}
            className="
              opacity-0 group-hover:opacity-100
              w-5 h-5 rounded-full bg-primary-600 text-white
              flex items-center justify-center
              transition-opacity
              hover:bg-primary-700
            "
            title="Crear cita"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Lista de citas */}
      <div className="space-y-1">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-1">
            {[1, 2].map((i) => (
              <div key={i} className="h-5 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {citasVisibles.map((cita) => {
              const esDraggable = citaPuedeSerReagendada(cita.estado);

              return (
                <div
                  key={cita.id}
                  draggable={esDraggable}
                  onDragStart={(e) => esDraggable && handleCitaDragStart(e, cita)}
                  className={`
                    ${esDraggable ? 'cursor-move' : 'cursor-pointer'}
                    group/cita
                  `}
                >
                  <button
                    onClick={() => onVerCita(cita)}
                    className={`
                      w-full text-left px-1.5 py-1 rounded text-xs
                      ${obtenerColorFondo(cita.estado)} bg-opacity-10
                      hover:bg-opacity-20
                      border-l-2
                      transition-all
                      truncate
                      relative
                    `}
                    style={{
                      borderLeftColor: obtenerColorFondo(cita.estado).replace('bg-', '').replace('-500', ''),
                    }}
                    title={`${formatearHora(cita.hora_inicio)} - ${cita.cliente_nombre || 'Sin cliente'}`}
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className={`
                          w-1.5 h-1.5 rounded-full flex-shrink-0
                          ${obtenerColorFondo(cita.estado)}
                        `}
                      />
                      <span className="font-medium text-gray-700 truncate">
                        {formatearHora(cita.hora_inicio)}
                      </span>
                      <span className="text-gray-600 truncate">
                        {cita.cliente_nombre || 'Sin cliente'}
                      </span>

                      {/* Indicador de drag disponible */}
                      {esDraggable && (
                        <Move className="w-3 h-3 text-gray-400 ml-auto opacity-0 group-hover/cita:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>
                </div>
              );
            })}

            {/* Indicador de más citas */}
            {citasOcultas > 0 && (
              <div className="text-xs text-gray-500 font-medium text-center py-0.5">
                +{citasOcultas} más
              </div>
            )}

            {/* Badge de cantidad de citas (esquina superior derecha) */}
            {citas.length > 0 && (
              <div className="absolute top-1 right-1">
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full">
                  {citas.length}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Botón para agregar más citas cuando ya hay citas (aparece al hover en la parte inferior) */}
      {!isLoading && citas.length > 0 && esDelMesActual && (
        <button
          onClick={onCrearCita}
          className="
            w-full mt-1 py-1 rounded
            text-xs font-medium text-primary-600
            opacity-0 group-hover:opacity-100
            transition-all
            hover:bg-primary-50
            flex items-center justify-center gap-1
          "
          title="Agregar otra cita"
        >
          <Plus className="w-3 h-3" />
          <span>Agregar cita</span>
        </button>
      )}

      {/* Empty state para días sin citas */}
      {!isLoading && citas.length === 0 && esDelMesActual && (
        <div className="flex items-center justify-center h-16 text-gray-400">
          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            Sin citas
          </span>
        </div>
      )}
    </div>
  );
}

export default CalendarioDia;
