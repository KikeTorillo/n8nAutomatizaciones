import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import CalendarioHeader from './CalendarioHeader';
import CalendarioDia from './CalendarioDia';
import CitasDiaDrawer from './CitasDiaDrawer';
import ConfirmarReagendarModal from './ConfirmarReagendarModal';
import { useCitas, useActualizarCita } from '@/hooks/agendamiento';
import { aFormatoISO } from '@/utils/dateHelpers';
import { validarSolapamiento } from '@/utils/citaValidators';
import { useToast, useIsMobile } from '@/hooks/utils';

/**
 * Componente principal del calendario mensual con funcionalidad de drag & drop
 * Muestra las citas en formato de calendario con navegación entre meses
 */
function CalendarioMensual({ onVerCita, onCrearCita }) {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [mesActual, setMesActual] = useState(new Date());

  // Estado para drag & drop
  const [citaEnDrag, setCitaEnDrag] = useState(null);
  const [modalReagendarAbierto, setModalReagendarAbierto] = useState(false);
  const [fechaNuevaReagendar, setFechaNuevaReagendar] = useState(null);
  const [advertenciasReagendar, setAdvertenciasReagendar] = useState([]);

  // Estado para drawer de día (móvil)
  const [drawerDia, setDrawerDia] = useState({ isOpen: false, fecha: null, citas: [] });

  // Mutation para actualizar cita
  const actualizarMutation = useActualizarCita();

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

  // Cargar citas del mes actual
  const { data: citasData, isLoading } = useCitas({
    fecha_desde: inicio,
    fecha_hasta: fin,
  });
  const citas = citasData?.citas || [];

  // Generar array de días a mostrar (42 días = 6 semanas completas)
  const diasDelCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    const inicioCalendario = startOfWeek(inicioMes, { weekStartsOn: 1 });
    const finCalendario = endOfWeek(finMes, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: inicioCalendario, end: finCalendario });
  }, [mesActual]);

  // Agrupar citas por fecha
  const citasPorFecha = useMemo(() => {
    const agrupadas = {};

    citas.forEach((cita) => {
      // Normalizar fecha a formato YYYY-MM-DD (extraer solo la parte de fecha)
      const fecha = cita.fecha_cita.split('T')[0];
      if (!agrupadas[fecha]) {
        agrupadas[fecha] = [];
      }
      agrupadas[fecha].push(cita);
    });

    // Ordenar citas de cada día por hora_inicio
    Object.keys(agrupadas).forEach((fecha) => {
      agrupadas[fecha].sort((a, b) => {
        const horaA = a.hora_inicio || '00:00:00';
        const horaB = b.hora_inicio || '00:00:00';
        return horaA.localeCompare(horaB);
      });
    });

    return agrupadas;
  }, [citas]);

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

  // Handlers de drag & drop
  const handleDragStart = (cita) => {
    setCitaEnDrag(cita);
  };

  const handleDrop = (cita, nuevaFecha) => {
    // Si es el mismo día, no hacer nada
    if (cita.fecha_cita === nuevaFecha) {
      setCitaEnDrag(null);
      return;
    }

    // Validar solapamiento
    const citasDelDiaNuevo = citasPorFecha[nuevaFecha] || [];

    const validacion = validarSolapamiento(
      {
        ...cita,
        fecha_cita: nuevaFecha,
      },
      citasDelDiaNuevo,
      cita.id // Excluir la cita actual
    );

    const advertencias = [];

    if (validacion.solapa) {
      advertencias.push({
        tipo: 'solapamiento',
        mensaje: `La cita se solapará con ${validacion.citasSolapadas.length} cita(s) existente(s) en este día`,
      });
    }

    // Si hay solapamiento, mostrar advertencia pero permitir continuar
    setFechaNuevaReagendar(nuevaFecha);
    setAdvertenciasReagendar(advertencias);
    setModalReagendarAbierto(true);
  };

  const handleConfirmarReagendar = async () => {
    if (!citaEnDrag || !fechaNuevaReagendar) return;

    try {
      await actualizarMutation.mutateAsync({
        id: citaEnDrag.id,
        fecha_cita: fechaNuevaReagendar,
      });

      toast.success('Cita reagendada exitosamente');
      setModalReagendarAbierto(false);
      setCitaEnDrag(null);
      setFechaNuevaReagendar(null);
      setAdvertenciasReagendar([]);
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Error al reagendar la cita'
      );
    }
  };

  const handleCerrarModalReagendar = () => {
    setModalReagendarAbierto(false);
    setCitaEnDrag(null);
    setFechaNuevaReagendar(null);
    setAdvertenciasReagendar([]);
  };

  // Handler para abrir drawer de día (modo móvil)
  const handleDiaClick = (fecha, citasDelDia) => {
    setDrawerDia({ isOpen: true, fecha, citas: citasDelDia });
  };

  const handleCerrarDrawerDia = () => {
    setDrawerDia({ isOpen: false, fecha: null, citas: [] });
  };

  return (
    <>
      {/* Modal de confirmación de reagendar */}
      <ConfirmarReagendarModal
        isOpen={modalReagendarAbierto}
        onClose={handleCerrarModalReagendar}
        cita={citaEnDrag}
        fechaAnterior={citaEnDrag?.fecha_cita}
        fechaNueva={fechaNuevaReagendar}
        onConfirmar={handleConfirmarReagendar}
        isLoading={actualizarMutation.isPending}
        advertencias={advertenciasReagendar}
      />
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
      <div className={isMobile ? 'p-2' : 'p-4'}>
        {/* Encabezado de días de la semana */}
        <div className={`grid grid-cols-7 ${isMobile ? 'gap-1 mb-1' : 'gap-1 mb-2'}`}>
          {(isMobile ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']).map((dia, idx) => (
            <div
              key={idx}
              className={`
                text-center font-semibold text-gray-600 dark:text-gray-400 uppercase
                ${isMobile ? 'text-[10px] py-1' : 'text-xs py-2'}
              `}
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className={`grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-1'}`}>
          {diasDelCalendario.map((dia, index) => {
            const fechaISO = aFormatoISO(dia);
            const citasDelDia = citasPorFecha[fechaISO] || [];
            const esDelMesActual = isSameMonth(dia, mesActual);
            const esHoy = isToday(dia);

            return (
              <CalendarioDia
                key={index}
                dia={dia}
                citas={citasDelDia}
                esDelMesActual={esDelMesActual}
                esHoy={esHoy}
                onVerCita={onVerCita}
                onCrearCita={() => onCrearCita(fechaISO)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                isLoading={isLoading}
                compactMode={isMobile}
                onDiaClick={handleDiaClick}
              />
            );
          })}
        </div>

        {/* Leyenda de estados */}
        <div className={`${isMobile ? 'mt-3 pt-3' : 'mt-6 pt-4'} border-t border-gray-200 dark:border-gray-700`}>
          <p className={`font-semibold text-gray-600 dark:text-gray-400 mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            Estados de citas:
          </p>
          <div className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-3'}`}>
            {[
              { color: 'bg-yellow-500', label: 'Pendiente' },
              { color: 'bg-primary-500', label: 'Confirmada' },
              { color: 'bg-secondary-500', label: 'En curso' },
              { color: 'bg-green-500', label: 'Completada' },
              { color: 'bg-red-500', label: 'Cancelada' },
              { color: 'bg-orange-500', label: 'No Show' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${color}`} />
                <span className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando citas...</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Drawer de citas del día (solo móvil) */}
    <CitasDiaDrawer
      isOpen={drawerDia.isOpen}
      onClose={handleCerrarDrawerDia}
      fecha={drawerDia.fecha}
      citas={drawerDia.citas}
      onVerCita={onVerCita}
      onCrearCita={onCrearCita}
    />
    </>
  );
}

export default CalendarioMensual;
