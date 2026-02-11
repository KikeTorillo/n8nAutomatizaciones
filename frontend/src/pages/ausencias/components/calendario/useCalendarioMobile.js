/**
 * useCalendarioMobile - Hook compartido para lógica móvil de calendarios
 * Extrae la lógica común de CalendarioMensual.jsx para reutilizar
 * en Vacaciones, Bloqueos y Ausencias
 * Ene 2026: Unificación de vista móvil
 */
import { useState } from 'react';
import { useIsMobile } from '@/hooks/utils';

/**
 * Hook para manejar estado y comportamiento móvil en calendarios
 *
 * @returns {Object} Estado y handlers para calendarios móviles
 * @property {boolean} isMobile - Si el dispositivo es móvil (< 768px)
 * @property {Object} drawerDia - Estado del drawer { isOpen, fecha, items }
 * @property {function} handleDiaClick - Handler para click en día
 * @property {function} handleCerrarDrawer - Handler para cerrar drawer
 * @property {Array} diasSemanaHeaders - Headers de días (L/M/X... o Lun/Mar...)
 */
export function useCalendarioMobile() {
  const isMobile = useIsMobile();
  const [drawerDia, setDrawerDia] = useState({
    isOpen: false,
    fecha: null,
    items: [],
  });

  /**
   * Abre el drawer con los items del día seleccionado
   * @param {string} fecha - Fecha en formato ISO (YYYY-MM-DD)
   * @param {Array} items - Items del día (citas, vacaciones, bloqueos, etc.)
   */
  const handleDiaClick = (fecha, items) => {
    setDrawerDia({ isOpen: true, fecha, items });
  };

  /**
   * Cierra el drawer y limpia el estado
   */
  const handleCerrarDrawer = () => {
    setDrawerDia({ isOpen: false, fecha: null, items: [] });
  };

  // Headers de días de la semana (compactos para móvil)
  const diasSemanaHeaders = isMobile
    ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return {
    isMobile,
    drawerDia,
    handleDiaClick,
    handleCerrarDrawer,
    diasSemanaHeaders,
  };
}

export default useCalendarioMobile;
