/**
 * CalendarioEquipoVacaciones - Calendario mensual de vacaciones del equipo
 * Muestra solicitudes aprobadas y pendientes en formato calendario
 * Ene 2026: Calendario de Equipo para competir con Odoo
 * Patrón: BloqueosCalendar.jsx con expansión de rangos multi-día
 */
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
import CalendarioDiaVacaciones from './CalendarioDiaVacaciones';
import FiltrosCalendarioVacaciones from './FiltrosCalendarioVacaciones';
import SolicitudVacacionesQuickView from './SolicitudVacacionesQuickView';
import { useSolicitudesCalendario } from '@/hooks/personas';
import { aFormatoISO, generarRangoFechas } from '@/utils/dateHelpers';

function CalendarioEquipoVacaciones({ soloEquipo = false }) {
  const [mesActual, setMesActual] = useState(new Date());
  const [filtros, setFiltros] = useState({ estado: null, departamento_id: null });
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  // Calcular rango de fechas para query (igual que BloqueosCalendar)
  const { inicio, fin } = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    return {
      inicio: aFormatoISO(startOfWeek(inicioMes, { weekStartsOn: 1 })),
      fin: aFormatoISO(endOfWeek(finMes, { weekStartsOn: 1 })),
    };
  }, [mesActual]);

  // Query con filtros
  const { data: solicitudes = [], isLoading } = useSolicitudesCalendario({
    fecha_inicio: inicio,
    fecha_fin: fin,
    estado: filtros.estado,
    departamento_id: filtros.departamento_id,
  });

  // Generar días del calendario (grid de 6 semanas)
  const diasDelCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    return eachDayOfInterval({
      start: startOfWeek(inicioMes, { weekStartsOn: 1 }),
      end: endOfWeek(finMes, { weekStartsOn: 1 }),
    });
  }, [mesActual]);

  // Agrupar solicitudes por fecha (EXPANDIR rangos como BloqueosCalendar)
  const solicitudesPorFecha = useMemo(() => {
    const agrupadas = {};

    solicitudes.forEach((sol) => {
      // Expandir rango fecha_inicio -> fecha_fin a fechas individuales
      const fechas = generarRangoFechas(sol.fecha_inicio, sol.fecha_fin);

      fechas.forEach((fecha) => {
        const fechaISO = aFormatoISO(fecha);
        if (!agrupadas[fechaISO]) {
          agrupadas[fechaISO] = [];
        }
        // Evitar duplicados del mismo profesional en el mismo día
        if (!agrupadas[fechaISO].find((s) => s.id === sol.id)) {
          agrupadas[fechaISO].push(sol);
        }
      });
    });

    return agrupadas;
  }, [solicitudes]);

  // Handlers de navegación
  const irMesAnterior = () => {
    setMesActual((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const irMesSiguiente = () => {
    setMesActual((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const irHoy = () => setMesActual(new Date());

  const handleCambiarMes = (nuevaFecha) => setMesActual(nuevaFecha);

  return (
    <>
      {/* Modal de detalle rápido */}
      <SolicitudVacacionesQuickView
        isOpen={!!solicitudSeleccionada}
        onClose={() => setSolicitudSeleccionada(null)}
        solicitud={solicitudSeleccionada}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Filtros */}
        <FiltrosCalendarioVacaciones
          filtros={filtros}
          onFiltrosChange={setFiltros}
          soloEquipo={soloEquipo}
        />

        {/* Header navegación */}
        <CalendarioHeader
          mesActual={mesActual}
          onMesAnterior={irMesAnterior}
          onMesSiguiente={irMesSiguiente}
          onHoy={irHoy}
          onCambiarMes={handleCambiarMes}
        />

        {/* Calendario */}
        <div className="p-4">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
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
              return (
                <CalendarioDiaVacaciones
                  key={index}
                  dia={dia}
                  solicitudes={solicitudesPorFecha[fechaISO] || []}
                  esDelMesActual={isSameMonth(dia, mesActual)}
                  esHoy={isToday(dia)}
                  onVerSolicitud={setSolicitudSeleccionada}
                  isLoading={isLoading}
                />
              );
            })}
          </div>

          {/* Leyenda de estados */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Estados:
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Aprobada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Pendiente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400 line-through">
                  Rechazada
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

CalendarioEquipoVacaciones.propTypes = {
  soloEquipo: PropTypes.bool,
};

export default CalendarioEquipoVacaciones;
