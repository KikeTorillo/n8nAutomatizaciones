import { useState, useEffect, useMemo, useCallback } from 'react';
import { serviciosApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';

/**
 * Hook para cargar servicios de un profesional específico
 * y calcular servicios disponibles con estado
 *
 * @param {string} profesionalId - ID del profesional seleccionado
 * @param {Array} serviciosCatalogo - Lista completa de servicios (catálogo general)
 * @param {boolean} roundRobinHabilitado - Si Round-Robin está habilitado
 */
export function useProfesionalServices(profesionalId, serviciosCatalogo, roundRobinHabilitado = false) {
  const toast = useToast();
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);

  // Cargar servicios del profesional seleccionado
  useEffect(() => {
    const cargarServiciosProfesional = async () => {
      // Si es 'auto' (Round-Robin) o vacío, no cargar servicios de un profesional específico
      if (!profesionalId || profesionalId === '' || profesionalId === 'auto') {
        setServiciosDisponibles([]);
        return;
      }

      setCargandoServicios(true);
      try {
        const response = await serviciosApi.obtenerServiciosPorProfesional(
          parseInt(profesionalId)
        );
        const serviciosProf = response.data.data || [];
        setServiciosDisponibles(serviciosProf);
      } catch (error) {
        console.error('Error al cargar servicios del profesional:', error);
        toast.error('Error al cargar servicios del profesional');
        setServiciosDisponibles([]);
      } finally {
        setCargandoServicios(false);
      }
    };

    cargarServiciosProfesional();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalId]);

  // Servicios con estado de disponibilidad (filtrado dual)
  const serviciosDisponiblesConEstado = useMemo(() => {
    // Si NO hay profesional seleccionado o es 'auto' (Round-Robin): mostrar TODOS los servicios con estado
    if (!profesionalId || profesionalId === '' || profesionalId === 'auto') {
      return serviciosCatalogo?.servicios?.map(s => ({
        ...s,
        disponible: s.total_profesionales_asignados > 0,
        razon_no_disponible: s.total_profesionales_asignados === 0
          ? 'Sin profesionales asignados' : null
      })) || [];
    }

    // Si HAY profesional seleccionado: solo mostrar servicios del profesional (todos disponibles)
    return serviciosDisponibles.map(s => ({
      ...s,
      disponible: true,
      razon_no_disponible: null
    }));
  }, [serviciosCatalogo, serviciosDisponibles, profesionalId]);

  // Limpiar servicios disponibles (para usar al abrir modal en modo creación)
  // IMPORTANTE: Memoizado para evitar re-ejecución del useEffect en CitaFormDrawer
  const limpiarServicios = useCallback(() => {
    setServiciosDisponibles([]);
  }, []);

  // Verificar si el usuario puede seleccionar servicios
  const puedeSeleccionarServicios = useMemo(() => {
    return (profesionalId && profesionalId !== '') || roundRobinHabilitado;
  }, [profesionalId, roundRobinHabilitado]);

  // Mensaje de ayuda para el campo de servicios
  const mensajeAyudaServicios = useMemo(() => {
    if (!profesionalId || profesionalId === '') {
      if (roundRobinHabilitado) {
        return {
          tipo: 'round-robin',
          mensaje: 'Round-Robin: el sistema asignará automáticamente al profesional disponible'
        };
      }
      return {
        tipo: 'seleccionar-profesional',
        mensaje: 'Primero selecciona un profesional'
      };
    }
    if (profesionalId === 'auto') {
      return {
        tipo: 'round-robin',
        mensaje: 'Round-Robin: el sistema asignará automáticamente al profesional disponible'
      };
    }
    return null;
  }, [profesionalId, roundRobinHabilitado]);

  return {
    serviciosDisponibles,
    serviciosDisponiblesConEstado,
    cargandoServicios,
    limpiarServicios,
    puedeSeleccionarServicios,
    mensajeAyudaServicios,
  };
}

export default useProfesionalServices;
