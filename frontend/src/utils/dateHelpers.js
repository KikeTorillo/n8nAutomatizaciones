import {
  format,
  parse,
  parseISO,
  addDays,
  addMinutes,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  differenceInMinutes,
  setHours,
  setMinutes,
  getDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Utilidades para manejo de fechas y horas en el módulo de citas
 */

// ==================== FORMATEO ====================

/**
 * Formatea una fecha según el formato especificado
 * @param {Date|string} fecha - Fecha a formatear
 * @param {string} formato - Formato de salida (default: 'dd/MM/yyyy')
 * @returns {string} Fecha formateada
 *
 * @example
 * formatearFecha('2025-10-17', 'dd/MM/yyyy') // '17/10/2025'
 * formatearFecha('2025-10-17', 'EEEE, dd MMMM') // 'viernes, 17 octubre'
 */
export function formatearFecha(fecha, formato = 'dd/MM/yyyy') {
  if (!fecha) return '';

  try {
    let fechaObj;
    if (typeof fecha === 'string') {
      // Si viene con timestamp UTC (2025-10-16T00:00:00.000Z), extraer solo la fecha
      // para evitar problemas de zona horaria
      const fechaSolo = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      fechaObj = parseISO(fechaSolo);
    } else {
      fechaObj = fecha;
    }
    return format(fechaObj, formato, { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
}

/**
 * Formatea una hora en formato HH:mm
 * @param {string|Date} hora - Hora a formatear (puede ser '14:30:00' o Date)
 * @returns {string} Hora formateada 'HH:mm'
 *
 * @example
 * formatearHora('14:30:00') // '14:30'
 * formatearHora(new Date()) // '15:45'
 */
export function formatearHora(hora) {
  if (!hora) return '';

  try {
    // Si es un string tipo '14:30:00', extraer HH:mm
    if (typeof hora === 'string') {
      return hora.substring(0, 5);
    }

    // Si es Date, formatear
    return format(hora, 'HH:mm');
  } catch (error) {
    console.error('Error al formatear hora:', error);
    return '';
  }
}

/**
 * Formatea fecha y hora juntos
 * @param {Date|string} fecha
 * @param {string} hora - Formato 'HH:mm:ss' o 'HH:mm'
 * @param {string} formato - Formato de salida
 * @returns {string} Fecha y hora formateadas
 *
 * @example
 * formatearFechaHora('2025-10-17', '14:30:00') // '17/10/2025 14:30'
 * formatearFechaHora('2025-10-17', '14:30:00', 'EEEE dd MMMM, HH:mm') // 'viernes 17 octubre, 14:30'
 */
export function formatearFechaHora(fecha, hora, formato = 'dd/MM/yyyy HH:mm') {
  if (!fecha || !hora) return '';

  try {
    // Si viene con timestamp UTC (2025-10-16T00:00:00.000Z), extraer solo la fecha
    // para evitar problemas de zona horaria
    let fechaObj;
    if (typeof fecha === 'string') {
      const fechaSolo = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      fechaObj = parseISO(fechaSolo);
    } else {
      fechaObj = fecha;
    }
    const [horas, minutos] = hora.split(':').map(Number);
    const fechaConHora = setMinutes(setHours(fechaObj, horas), minutos);

    return format(fechaConHora, formato, { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha y hora:', error);
    return '';
  }
}

/**
 * Formatea una fecha en formato relativo (hoy, mañana, ayer, etc.)
 * @param {Date|string} fecha
 * @returns {string} Fecha formateada de forma relativa
 *
 * @example
 * formatearFechaRelativa(new Date()) // 'Hoy'
 * formatearFechaRelativa(tomorrow) // 'Mañana'
 */
export function formatearFechaRelativa(fecha) {
  if (!fecha) return '';

  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    const hoy = new Date();
    const manana = addDays(hoy, 1);
    const ayer = addDays(hoy, -1);

    if (isSameDay(fechaObj, hoy)) return 'Hoy';
    if (isSameDay(fechaObj, manana)) return 'Mañana';
    if (isSameDay(fechaObj, ayer)) return 'Ayer';

    // Si es esta semana, mostrar día
    const diffDias = Math.abs(differenceInMinutes(fechaObj, hoy) / (60 * 24));
    if (diffDias <= 7) {
      return format(fechaObj, 'EEEE', { locale: es });
    }

    // Sino, mostrar fecha completa
    return format(fechaObj, 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha relativa:', error);
    return '';
  }
}

// ==================== CÁLCULOS ====================

/**
 * Calcula la duración en minutos entre dos horas
 * @param {string} horaInicio - Formato 'HH:mm:ss' o 'HH:mm'
 * @param {string} horaFin - Formato 'HH:mm:ss' o 'HH:mm'
 * @returns {number} Duración en minutos
 *
 * @example
 * calcularDuracionMinutos('14:00:00', '14:30:00') // 30
 * calcularDuracionMinutos('14:00', '15:30') // 90
 */
export function calcularDuracionMinutos(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) return 0;

  try {
    const [hiHoras, hiMinutos] = horaInicio.split(':').map(Number);
    const [hfHoras, hfMinutos] = horaFin.split(':').map(Number);

    const inicio = setMinutes(setHours(new Date(), hiHoras), hiMinutos);
    const fin = setMinutes(setHours(new Date(), hfHoras), hfMinutos);

    return differenceInMinutes(fin, inicio);
  } catch (error) {
    console.error('Error al calcular duración:', error);
    return 0;
  }
}

/**
 * Calcula la hora de fin a partir de hora de inicio y duración
 * @param {string} horaInicio - Formato 'HH:mm:ss' o 'HH:mm'
 * @param {number} duracionMinutos - Duración en minutos
 * @returns {string} Hora de fin en formato 'HH:mm:ss'
 *
 * @example
 * calcularHoraFin('14:00:00', 30) // '14:30:00'
 * calcularHoraFin('14:00', 90) // '15:30:00'
 */
export function calcularHoraFin(horaInicio, duracionMinutos) {
  if (!horaInicio || !duracionMinutos) return '';

  try {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const inicio = setMinutes(setHours(new Date(), horas), minutos);
    const fin = addMinutes(inicio, duracionMinutos);

    return format(fin, 'HH:mm:ss');
  } catch (error) {
    console.error('Error al calcular hora fin:', error);
    return '';
  }
}

// ==================== RANGOS ====================

/**
 * Obtiene el rango de fechas de la semana actual
 * @param {Date|string} fecha - Fecha de referencia (default: hoy)
 * @returns {Object} { inicio: Date, fin: Date }
 *
 * @example
 * obtenerRangoSemana(new Date()) // { inicio: lunes, fin: domingo }
 */
export function obtenerRangoSemana(fecha = new Date()) {
  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;

    return {
      inicio: startOfWeek(fechaObj, { weekStartsOn: 1 }), // Lunes
      fin: endOfWeek(fechaObj, { weekStartsOn: 1 }), // Domingo
    };
  } catch (error) {
    console.error('Error al obtener rango de semana:', error);
    return { inicio: new Date(), fin: new Date() };
  }
}

/**
 * Obtiene el rango de fechas del mes actual
 * @param {Date|string} fecha - Fecha de referencia (default: hoy)
 * @returns {Object} { inicio: Date, fin: Date }
 *
 * @example
 * obtenerRangoMes(new Date()) // { inicio: 1 del mes, fin: último día del mes }
 */
export function obtenerRangoMes(fecha = new Date()) {
  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;

    return {
      inicio: startOfMonth(fechaObj),
      fin: endOfMonth(fechaObj),
    };
  } catch (error) {
    console.error('Error al obtener rango de mes:', error);
    return { inicio: new Date(), fin: new Date() };
  }
}

// ==================== VALIDACIONES ====================

/**
 * Verifica si dos fechas son el mismo día
 * @param {Date|string} fecha1
 * @param {Date|string} fecha2
 * @returns {boolean}
 *
 * @example
 * esMismoDia('2025-10-17', '2025-10-17T14:30:00') // true
 */
export function esMismoDia(fecha1, fecha2) {
  if (!fecha1 || !fecha2) return false;

  try {
    // Normalizar fechas a formato YYYY-MM-DD para evitar problemas de zona horaria
    const normalizarFecha = (fecha) => {
      if (typeof fecha === 'string') {
        // Si ya es string, extraer solo YYYY-MM-DD
        return fecha.split('T')[0];
      }
      // Si es Date, convertir a YYYY-MM-DD
      return format(fecha, 'yyyy-MM-dd');
    };

    const fecha1Normalizada = normalizarFecha(fecha1);
    const fecha2Normalizada = normalizarFecha(fecha2);

    // Comparar strings directamente (más confiable que comparar objetos Date con zonas horarias)
    return fecha1Normalizada === fecha2Normalizada;
  } catch (error) {
    console.error('Error al comparar fechas:', error);
    return false;
  }
}

/**
 * Verifica si una fecha es hoy
 * @param {Date|string} fecha
 * @returns {boolean}
 *
 * @example
 * esHoy(new Date()) // true
 */
export function esHoy(fecha) {
  if (!fecha) return false;

  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    return isToday(fechaObj);
  } catch (error) {
    console.error('Error al verificar si es hoy:', error);
    return false;
  }
}

/**
 * Verifica si una fecha/hora es anterior a otra
 * @param {Date|string} fecha1
 * @param {Date|string} fecha2
 * @returns {boolean}
 *
 * @example
 * esAnterior('2025-10-17', '2025-10-18') // true
 */
export function esAnterior(fecha1, fecha2) {
  if (!fecha1 || !fecha2) return false;

  try {
    const f1 = typeof fecha1 === 'string' ? parseISO(fecha1) : fecha1;
    const f2 = typeof fecha2 === 'string' ? parseISO(fecha2) : fecha2;

    return isBefore(f1, f2);
  } catch (error) {
    console.error('Error al comparar fechas:', error);
    return false;
  }
}

/**
 * Verifica si una fecha/hora es posterior a otra
 * @param {Date|string} fecha1
 * @param {Date|string} fecha2
 * @returns {boolean}
 *
 * @example
 * esPosterior('2025-10-18', '2025-10-17') // true
 */
export function esPosterior(fecha1, fecha2) {
  if (!fecha1 || !fecha2) return false;

  try {
    const f1 = typeof fecha1 === 'string' ? parseISO(fecha1) : fecha1;
    const f2 = typeof fecha2 === 'string' ? parseISO(fecha2) : fecha2;

    return isAfter(f1, f2);
  } catch (error) {
    console.error('Error al comparar fechas:', error);
    return false;
  }
}

// ==================== CONVERSIONES ====================

/**
 * Convierte una fecha a formato ISO (YYYY-MM-DD)
 * @param {Date|string} fecha
 * @returns {string} Fecha en formato ISO
 *
 * @example
 * aFormatoISO(new Date()) // '2025-10-17'
 */
export function aFormatoISO(fecha) {
  if (!fecha) return '';

  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    return format(fechaObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error al convertir a ISO:', error);
    return '';
  }
}

/**
 * Convierte una hora en formato de 12 horas (AM/PM) a 24 horas
 * @param {string} hora12 - Formato '02:30 PM'
 * @returns {string} Formato '14:30:00'
 *
 * @example
 * convertirA24Horas('02:30 PM') // '14:30:00'
 */
export function convertirA24Horas(hora12) {
  if (!hora12) return '';

  try {
    const fecha = parse(hora12, 'hh:mm a', new Date());
    return format(fecha, 'HH:mm:ss');
  } catch (error) {
    console.error('Error al convertir hora:', error);
    return '';
  }
}

/**
 * Obtiene el día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * @param {Date|string} fecha
 * @returns {number} Día de la semana
 *
 * @example
 * obtenerDiaSemana('2025-10-17') // 5 (viernes)
 */
export function obtenerDiaSemana(fecha) {
  if (!fecha) return 0;

  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    return getDay(fechaObj);
  } catch (error) {
    console.error('Error al obtener día de semana:', error);
    return 0;
  }
}

/**
 * Genera un array de fechas entre dos fechas
 * @param {Date|string} fechaInicio
 * @param {Date|string} fechaFin
 * @returns {Date[]} Array de fechas
 *
 * @example
 * generarRangoFechas('2025-10-17', '2025-10-19') // [Date(17), Date(18), Date(19)]
 */
export function generarRangoFechas(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return [];

  try {
    const inicio = typeof fechaInicio === 'string' ? parseISO(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? parseISO(fechaFin) : fechaFin;

    const fechas = [];
    let fechaActual = inicio;

    while (!isAfter(fechaActual, fin)) {
      fechas.push(new Date(fechaActual));
      fechaActual = addDays(fechaActual, 1);
    }

    return fechas;
  } catch (error) {
    console.error('Error al generar rango de fechas:', error);
    return [];
  }
}

// ==================== UTILIDADES PARA CITAS ====================

/**
 * Verifica si una hora está dentro de un rango horario
 * @param {string} hora - Formato 'HH:mm:ss' o 'HH:mm'
 * @param {string} horaInicio - Formato 'HH:mm:ss' o 'HH:mm'
 * @param {string} horaFin - Formato 'HH:mm:ss' o 'HH:mm'
 * @returns {boolean}
 *
 * @example
 * estaEnRangoHorario('14:30', '09:00', '18:00') // true
 */
export function estaEnRangoHorario(hora, horaInicio, horaFin) {
  if (!hora || !horaInicio || !horaFin) return false;

  try {
    const [hHoras, hMinutos] = hora.split(':').map(Number);
    const [hiHoras, hiMinutos] = horaInicio.split(':').map(Number);
    const [hfHoras, hfMinutos] = horaFin.split(':').map(Number);

    const h = setMinutes(setHours(new Date(), hHoras), hMinutos);
    const hi = setMinutes(setHours(new Date(), hiHoras), hiMinutos);
    const hf = setMinutes(setHours(new Date(), hfHoras), hfMinutos);

    return !isBefore(h, hi) && !isAfter(h, hf);
  } catch (error) {
    console.error('Error al verificar rango horario:', error);
    return false;
  }
}

/**
 * Genera slots de tiempo disponibles en un rango horario
 * @param {string} horaInicio - Formato 'HH:mm'
 * @param {string} horaFin - Formato 'HH:mm'
 * @param {number} duracionSlot - Duración en minutos
 * @returns {string[]} Array de slots ['09:00', '09:30', '10:00', ...]
 *
 * @example
 * generarSlotsDisponibles('09:00', '12:00', 30) // ['09:00', '09:30', '10:00', ...]
 */
export function generarSlotsDisponibles(horaInicio, horaFin, duracionSlot = 30) {
  if (!horaInicio || !horaFin || !duracionSlot) return [];

  try {
    const [hiHoras, hiMinutos] = horaInicio.split(':').map(Number);
    const [hfHoras, hfMinutos] = horaFin.split(':').map(Number);

    let horaActual = setMinutes(setHours(new Date(), hiHoras), hiMinutos);
    const horaFinObj = setMinutes(setHours(new Date(), hfHoras), hfMinutos);

    const slots = [];

    while (isBefore(horaActual, horaFinObj) || isSameDay(horaActual, horaFinObj)) {
      slots.push(format(horaActual, 'HH:mm'));
      horaActual = addMinutes(horaActual, duracionSlot);

      // Evitar loop infinito
      if (slots.length > 100) break;
    }

    return slots;
  } catch (error) {
    console.error('Error al generar slots:', error);
    return [];
  }
}

export default {
  // Formateo
  formatearFecha,
  formatearHora,
  formatearFechaHora,
  formatearFechaRelativa,

  // Cálculos
  calcularDuracionMinutos,
  calcularHoraFin,

  // Rangos
  obtenerRangoSemana,
  obtenerRangoMes,

  // Validaciones
  esMismoDia,
  esHoy,
  esAnterior,
  esPosterior,

  // Conversiones
  aFormatoISO,
  convertirA24Horas,
  obtenerDiaSemana,
  generarRangoFechas,

  // Utilidades para citas
  estaEnRangoHorario,
  generarSlotsDisponibles,
};
