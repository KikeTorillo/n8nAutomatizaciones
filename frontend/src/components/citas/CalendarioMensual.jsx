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
import ConfirmarReagendarModal from './ConfirmarReagendarModal';
import { useCitas, useActualizarCita } from '@/hooks/useCitas';
import { aFormatoISO } from '@/utils/dateHelpers';
import { validarSolapamiento } from '@/utils/citaValidators';
import { useToast } from '@/hooks/useToast';

/**
 * Componente principal del calendario mensual con funcionalidad de drag & drop
 * Muestra las citas en formato de calendario con navegación entre meses
 */
function CalendarioMensual({ onVerCita, onCrearCita }) {
  const { showToast } = useToast();
  const [mesActual, setMesActual] = useState(new Date());

  // Estado para drag & drop
  const [citaEnDrag, setCitaEnDrag] = useState(null);
  const [modalReagendarAbierto, setModalReagendarAbierto] = useState(false);
  const [fechaNuevaReagendar, setFechaNuevaReagendar] = useState(null);
  const [advertenciasReagendar, setAdvertenciasReagendar] = useState([]);

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
  const { data: citas = [], isLoading } = useCitas({
    fecha_desde: inicio,
    fecha_hasta: fin,
  });

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

      showToast('Cita reagendada exitosamente', 'success');
      setModalReagendarAbierto(false);
      setCitaEnDrag(null);
      setFechaNuevaReagendar(null);
      setAdvertenciasReagendar([]);
    } catch (error) {
      showToast(
        error.response?.data?.error || 'Error al reagendar la cita',
        'error'
      );
    }
  };

  const handleCerrarModalReagendar = () => {
    setModalReagendarAbierto(false);
    setCitaEnDrag(null);
    setFechaNuevaReagendar(null);
    setAdvertenciasReagendar([]);
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
            <div
              key={dia}
              className="text-center text-xs font-semibold text-gray-600 py-2 uppercase"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-1">
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
              />
            );
          })}
        </div>

        {/* Leyenda de estados */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">Estados de citas:</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-600">Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600">Confirmada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs text-gray-600">En curso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Completada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Cancelada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-600">No Show</span>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600">Cargando citas...</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default CalendarioMensual;
