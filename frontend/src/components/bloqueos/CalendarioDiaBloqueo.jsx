import { format } from 'date-fns';
import { Lock, Clock, Building, User, Plus } from 'lucide-react';
import { obtenerColorTipoBloqueo, esBloqueoDiaCompleto } from '@/utils/bloqueoHelpers';

/**
 * Componente de celda individual del calendario para bloqueos
 * Muestra el día y los bloqueos programados para ese día
 */
function CalendarioDiaBloqueo({
  dia,
  bloqueos,
  esDelMesActual,
  esHoy,
  onVerBloqueo,
  onCrearBloqueo,
  isLoading,
}) {
  const numeroDia = format(dia, 'd');
  const maxBloqueosVisibles = 2;
  const bloqueosVisibles = bloqueos.slice(0, maxBloqueosVisibles);
  const bloqueosOcultos = bloqueos.length - maxBloqueosVisibles;

  // Verificar si hay bloqueo organizacional (afecta a todos)
  const tieneBloqueoOrganizacional = bloqueos.some((b) => !b.profesional_id);

  return (
    <div
      className={`
        min-h-[100px] border border-gray-200 rounded-lg p-2 transition-all
        ${esDelMesActual ? 'bg-white' : 'bg-gray-50'}
        ${esHoy ? 'ring-2 ring-primary-500 ring-inset' : ''}
        ${tieneBloqueoOrganizacional && esDelMesActual ? 'bg-red-50 border-red-200' : ''}
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

        {/* Badge de bloqueo organizacional o botón crear */}
        {tieneBloqueoOrganizacional && esDelMesActual ? (
          <div className="flex items-center gap-1" title="Bloqueo organizacional">
            <Building className="w-3 h-3 text-red-600" />
            <Lock className="w-3 h-3 text-red-600" />
          </div>
        ) : (
          /* Botón para crear bloqueo (solo visible cuando NO hay bloqueos) */
          esDelMesActual && bloqueos.length === 0 && onCrearBloqueo && (
            <button
              onClick={onCrearBloqueo}
              className="
                opacity-0 group-hover:opacity-100
                w-5 h-5 rounded-full bg-red-600 text-white
                flex items-center justify-center
                transition-opacity
                hover:bg-red-700
              "
              title="Crear bloqueo"
            >
              <Plus className="w-3 h-3" />
            </button>
          )
        )}
      </div>

      {/* Lista de bloqueos */}
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
            {bloqueosVisibles.map((bloqueo) => {
              const colores = obtenerColorTipoBloqueo(bloqueo.tipo_bloqueo_codigo);
              const esDiaCompleto = esBloqueoDiaCompleto(bloqueo);
              const esOrganizacional = !bloqueo.profesional_id;

              return (
                <button
                  key={bloqueo.id}
                  onClick={() => onVerBloqueo(bloqueo)}
                  className={`
                    w-full text-left px-1.5 py-1 rounded text-xs
                    ${colores.bg} ${colores.text}
                    hover:opacity-80
                    border-l-2 ${colores.border}
                    transition-all
                    truncate
                  `}
                  title={`${bloqueo.titulo}${!esDiaCompleto ? ' (Parcial)' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {/* Icono de tipo */}
                    {esOrganizacional ? (
                      <Building className="w-2.5 h-2.5 flex-shrink-0" />
                    ) : (
                      <User className="w-2.5 h-2.5 flex-shrink-0" />
                    )}

                    {/* Título truncado */}
                    <span className="font-medium truncate">{bloqueo.titulo}</span>

                    {/* Indicador de horario parcial */}
                    {!esDiaCompleto && <Clock className="w-2.5 h-2.5 ml-auto flex-shrink-0" />}
                  </div>
                </button>
              );
            })}

            {/* Indicador de más bloqueos */}
            {bloqueosOcultos > 0 && (
              <div className="text-xs text-gray-500 font-medium text-center py-0.5">
                +{bloqueosOcultos} más
              </div>
            )}

            {/* Badge de cantidad de bloqueos (esquina superior derecha) */}
            {bloqueos.length > 0 && (
              <div className="absolute top-1 right-1">
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                  {bloqueos.length}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Botón para agregar más bloqueos cuando ya hay bloqueos */}
      {!isLoading && bloqueos.length > 0 && esDelMesActual && onCrearBloqueo && (
        <button
          onClick={onCrearBloqueo}
          className="
            w-full mt-1 py-1 rounded
            text-xs font-medium text-red-600
            opacity-0 group-hover:opacity-100
            transition-all
            hover:bg-red-50
            flex items-center justify-center gap-1
          "
          title="Agregar otro bloqueo"
        >
          <Plus className="w-3 h-3" />
          <span>Agregar bloqueo</span>
        </button>
      )}

      {/* Empty state para días sin bloqueos */}
      {!isLoading && bloqueos.length === 0 && esDelMesActual && (
        <div className="flex items-center justify-center h-12 text-gray-400">
          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            Sin bloqueos
          </span>
        </div>
      )}
    </div>
  );
}

export default CalendarioDiaBloqueo;
