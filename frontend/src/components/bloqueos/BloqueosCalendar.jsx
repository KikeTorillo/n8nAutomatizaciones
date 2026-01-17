import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import CalendarioHeader from '@/components/citas/CalendarioHeader';
import CalendarioDiaBloqueo from './CalendarioDiaBloqueo';
import { useBloqueos } from '@/hooks/agendamiento';
import { aFormatoISO, generarRangoFechas } from '@/utils/dateHelpers';
import { LABELS_TIPO_BLOQUEO } from '@/utils/bloqueoHelpers';

// Constante fuera del componente para evitar recreación (Fase 3 Ene 2026)
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Componente de calendario mensual para visualizar bloqueos
 * Muestra los bloqueos en formato de calendario con navegación entre meses
 */
function BloqueosCalendar({ profesionalId = null, onVerBloqueo, onCrearBloqueo }) {
  const [mesActual, setMesActual] = useState(new Date());

  // Calcular rango de fechas para el mes actual (incluyendo días de meses adyacentes)
  const { inicio, fin } = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    const inicio = startOfWeek(inicioMes, { weekStartsOn: 1 }); // Semana empieza en Lunes
    const fin = endOfWeek(finMes, { weekStartsOn: 1 });

    return {
      inicio: aFormatoISO(inicio),
      fin: aFormatoISO(fin),
    };
  }, [mesActual]);

  // Construir params para la query
  const queryParams = useMemo(() => {
    const params = {
      fecha_inicio: inicio,
      fecha_fin: fin,
      activo: true, // Solo mostrar bloqueos activos
    };

    if (profesionalId) {
      params.profesional_id = profesionalId;
    }

    return params;
  }, [inicio, fin, profesionalId]);

  // Cargar bloqueos del mes actual
  const { data: bloqueos = [], isLoading } = useBloqueos(queryParams);

  // Generar array de días a mostrar (42 días = 6 semanas completas)
  const diasDelCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    const inicioCalendario = startOfWeek(inicioMes, { weekStartsOn: 1 });
    const finCalendario = endOfWeek(finMes, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: inicioCalendario, end: finCalendario });
  }, [mesActual]);

  // Agrupar bloqueos por fecha
  const bloqueosPorFecha = useMemo(() => {
    const agrupados = {};

    bloqueos.forEach((bloqueo) => {
      // Generar array de fechas del rango del bloqueo
      const fechasBloqueo = generarRangoFechas(bloqueo.fecha_inicio, bloqueo.fecha_fin);

      fechasBloqueo.forEach((fecha) => {
        const fechaISO = aFormatoISO(fecha);

        if (!agrupados[fechaISO]) {
          agrupados[fechaISO] = [];
        }

        agrupados[fechaISO].push(bloqueo);
      });
    });

    return agrupados;
  }, [bloqueos]);

  // Handlers de navegación
  const irMesAnterior = () => {
    setMesActual((prev) => {
      const nuevaFecha = new Date(prev);
      nuevaFecha.setMonth(prev.getMonth() - 1);
      return nuevaFecha;
    });
  };

  const irMesSiguiente = () => {
    setMesActual((prev) => {
      const nuevaFecha = new Date(prev);
      nuevaFecha.setMonth(prev.getMonth() + 1);
      return nuevaFecha;
    });
  };

  const irHoy = () => {
    setMesActual(new Date());
  };

  const cambiarMes = (fecha) => {
    setMesActual(fecha);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header con navegación */}
      <CalendarioHeader
        mesActual={mesActual}
        onMesAnterior={irMesAnterior}
        onMesSiguiente={irMesSiguiente}
        onHoy={irHoy}
        onCambiarMes={cambiarMes}
      />

      {/* Calendario */}
      <div className="p-4">
        {/* Encabezado de días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 uppercase"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-1">
          {diasDelCalendario.map((dia, index) => {
            const fechaISO = aFormatoISO(dia);
            const bloqueosDelDia = bloqueosPorFecha[fechaISO] || [];
            const esDelMesActual = isSameMonth(dia, mesActual);
            const esHoy = isToday(dia);

            return (
              <CalendarioDiaBloqueo
                key={index}
                dia={dia}
                bloqueos={bloqueosDelDia}
                esDelMesActual={esDelMesActual}
                esHoy={esHoy}
                onVerBloqueo={onVerBloqueo}
                onCrearBloqueo={onCrearBloqueo ? () => onCrearBloqueo(fechaISO) : undefined}
                isLoading={isLoading}
              />
            );
          })}
        </div>

        {/* Leyenda de tipos de bloqueo */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Tipos de bloqueo:</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-secondary-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{LABELS_TIPO_BLOQUEO.vacaciones}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{LABELS_TIPO_BLOQUEO.feriado}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{LABELS_TIPO_BLOQUEO.mantenimiento}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{LABELS_TIPO_BLOQUEO.evento_especial}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{LABELS_TIPO_BLOQUEO.emergencia}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{LABELS_TIPO_BLOQUEO.personal}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{LABELS_TIPO_BLOQUEO.organizacional}</span>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-primary-600 dark:text-primary-300 text-sm">
              <p className="font-medium mb-1">💡 Información útil</p>
              <ul className="list-disc list-inside text-xs space-y-0.5 text-primary-700 dark:text-primary-300">
                <li>Los días con fondo rojo tienen bloqueos organizacionales (afectan a todos)</li>
                <li>El icono 🕐 indica que el bloqueo es de horario parcial (no todo el día)</li>
                <li>Haz clic en un bloqueo para ver más detalles</li>
                {profesionalId && (
                  <li>Vista filtrada para un profesional específico</li>
                )}
                {!profesionalId && (
                  <li>Mostrando todos los bloqueos (organizacionales e individuales)</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando bloqueos...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

BloqueosCalendar.propTypes = {
  profesionalId: PropTypes.number,
  onVerBloqueo: PropTypes.func.isRequired,
  onCrearBloqueo: PropTypes.func,
};

export default BloqueosCalendar;
