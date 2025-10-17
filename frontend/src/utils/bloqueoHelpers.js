import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Colores por tipo de bloqueo (clases Tailwind)
 */
export const COLORES_TIPO_BLOQUEO = {
  vacaciones: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-500',
    badge: 'bg-blue-500',
    hex: '#3B82F6',
  },
  feriado: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-500',
    badge: 'bg-red-500',
    hex: '#EF4444',
  },
  mantenimiento: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-500',
    badge: 'bg-amber-500',
    hex: '#F59E0B',
  },
  evento_especial: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-500',
    badge: 'bg-purple-500',
    hex: '#8B5CF6',
  },
  emergencia: {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-500',
    badge: 'bg-rose-600',
    hex: '#DC2626',
  },
  personal: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-500',
    badge: 'bg-green-500',
    hex: '#10B981',
  },
  organizacional: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-500',
    badge: 'bg-gray-500',
    hex: '#6B7280',
  },
};

/**
 * Iconos por tipo de bloqueo (nombres de lucide-react)
 */
export const ICONOS_TIPO_BLOQUEO = {
  vacaciones: 'Palmtree',
  feriado: 'Calendar',
  mantenimiento: 'Wrench',
  evento_especial: 'Star',
  emergencia: 'AlertTriangle',
  personal: 'User',
  organizacional: 'Building',
};

/**
 * Labels en español para tipos de bloqueo
 */
export const LABELS_TIPO_BLOQUEO = {
  vacaciones: 'Vacaciones',
  feriado: 'Feriado',
  mantenimiento: 'Mantenimiento',
  evento_especial: 'Evento Especial',
  emergencia: 'Emergencia',
  personal: 'Personal',
  organizacional: 'Organizacional',
};

/**
 * Obtener configuración de color para un tipo de bloqueo
 * @param {string} tipo - Tipo de bloqueo
 * @returns {Object} Objeto con clases Tailwind y color hex
 */
export const obtenerColorTipoBloqueo = (tipo) => {
  return COLORES_TIPO_BLOQUEO[tipo] || COLORES_TIPO_BLOQUEO.organizacional;
};

/**
 * Obtener nombre del ícono para un tipo de bloqueo
 * @param {string} tipo - Tipo de bloqueo
 * @returns {string} Nombre del ícono de lucide-react
 */
export const obtenerIconoTipoBloqueo = (tipo) => {
  return ICONOS_TIPO_BLOQUEO[tipo] || 'Calendar';
};

/**
 * Obtener label en español para un tipo de bloqueo
 * @param {string} tipo - Tipo de bloqueo
 * @returns {string} Label traducido
 */
export const obtenerLabelTipoBloqueo = (tipo) => {
  return LABELS_TIPO_BLOQUEO[tipo] || tipo;
};

/**
 * Calcular cantidad de días de un bloqueo
 * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD o Date)
 * @param {string} fechaFin - Fecha fin (YYYY-MM-DD o Date)
 * @returns {number} Cantidad de días (incluyendo primer y último día)
 */
export const calcularDiasBloqueo = (fechaInicio, fechaFin) => {
  try {
    const inicio = typeof fechaInicio === 'string' ? parseISO(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? parseISO(fechaFin) : fechaFin;
    return differenceInDays(fin, inicio) + 1; // +1 para incluir ambos días
  } catch (error) {
    return 0;
  }
};

/**
 * Validar si dos bloqueos se solapan
 * @param {Object} bloqueo1 - { fecha_inicio, fecha_fin, hora_inicio, hora_fin, profesional_id }
 * @param {Object} bloqueo2 - { fecha_inicio, fecha_fin, hora_inicio, hora_fin, profesional_id }
 * @returns {boolean} true si se solapan
 */
export const validarSolapamientoBloqueos = (bloqueo1, bloqueo2) => {
  // Si son de profesionales diferentes (y no son organizacionales), no se solapan
  if (
    bloqueo1.profesional_id &&
    bloqueo2.profesional_id &&
    bloqueo1.profesional_id !== bloqueo2.profesional_id
  ) {
    return false;
  }

  const inicio1 = parseISO(bloqueo1.fecha_inicio);
  const fin1 = parseISO(bloqueo1.fecha_fin);
  const inicio2 = parseISO(bloqueo2.fecha_inicio);
  const fin2 = parseISO(bloqueo2.fecha_fin);

  // Verificar solapamiento de fechas
  const fechasSeSolapan = inicio1 <= fin2 && fin1 >= inicio2;

  if (!fechasSeSolapan) {
    return false;
  }

  // Si ambos tienen horas específicas, verificar solapamiento de horas
  if (
    bloqueo1.hora_inicio &&
    bloqueo1.hora_fin &&
    bloqueo2.hora_inicio &&
    bloqueo2.hora_fin
  ) {
    const horaInicio1 = bloqueo1.hora_inicio;
    const horaFin1 = bloqueo1.hora_fin;
    const horaInicio2 = bloqueo2.hora_inicio;
    const horaFin2 = bloqueo2.hora_fin;

    return horaInicio1 < horaFin2 && horaFin1 > horaInicio2;
  }

  // Si al menos uno es de día completo, se solapan
  return true;
};

/**
 * Formatear rango de bloqueo para mostrar
 * @param {string} fechaInicio - Fecha inicio
 * @param {string} fechaFin - Fecha fin
 * @param {string} horaInicio - Hora inicio (opcional)
 * @param {string} horaFin - Hora fin (opcional)
 * @returns {string} Rango formateado
 */
export const formatearRangoBloqueo = (fechaInicio, fechaFin, horaInicio, horaFin) => {
  try {
    const inicio = parseISO(fechaInicio);
    const fin = parseISO(fechaFin);
    const dias = calcularDiasBloqueo(fechaInicio, fechaFin);

    const fechaInicioStr = format(inicio, "d 'de' MMMM", { locale: es });
    const fechaFinStr = format(fin, "d 'de' MMMM, yyyy", { locale: es });

    let rangoStr = `${fechaInicioStr} - ${fechaFinStr}`;

    if (dias === 1) {
      rangoStr = format(inicio, "d 'de' MMMM, yyyy", { locale: es });
    }

    // Agregar horario si existe
    if (horaInicio && horaFin) {
      const horaInicioStr = horaInicio.substring(0, 5); // HH:mm
      const horaFinStr = horaFin.substring(0, 5);
      rangoStr += ` (${horaInicioStr} - ${horaFinStr})`;
    }

    return rangoStr;
  } catch (error) {
    return 'Rango inválido';
  }
};

/**
 * Verificar si un bloqueo es de día completo
 * @param {Object} bloqueo - { hora_inicio, hora_fin }
 * @returns {boolean}
 */
export const esBloqueoDiaCompleto = (bloqueo) => {
  return !bloqueo.hora_inicio || !bloqueo.hora_fin;
};

/**
 * Verificar si un bloqueo es organizacional
 * @param {Object} bloqueo - { profesional_id }
 * @returns {boolean}
 */
export const esBloqueoOrganizacional = (bloqueo) => {
  return !bloqueo.profesional_id;
};

/**
 * Obtener todas las fechas individuales de un bloqueo
 * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
 * @returns {Array<Date>} Array de fechas
 */
export const obtenerFechasBloqueo = (fechaInicio, fechaFin) => {
  try {
    const inicio = parseISO(fechaInicio);
    const fin = parseISO(fechaFin);
    const fechas = [];

    let fechaActual = new Date(inicio);
    while (fechaActual <= fin) {
      fechas.push(new Date(fechaActual));
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return fechas;
  } catch (error) {
    return [];
  }
};

/**
 * Filtrar bloqueos por criterios múltiples
 * @param {Array} bloqueos - Array de bloqueos
 * @param {Object} filtros - { tipo, profesionalId, soloOrganizacionales, activo, busqueda }
 * @returns {Array} Bloqueos filtrados
 */
export const filtrarBloqueos = (bloqueos, filtros = {}) => {
  if (!Array.isArray(bloqueos)) return [];

  return bloqueos.filter((bloqueo) => {
    // Filtro por tipo
    if (filtros.tipo && bloqueo.tipo_bloqueo !== filtros.tipo) {
      return false;
    }

    // Filtro por profesional
    if (filtros.profesionalId && bloqueo.profesional_id !== filtros.profesionalId) {
      return false;
    }

    // Filtro solo organizacionales
    if (filtros.soloOrganizacionales && bloqueo.profesional_id !== null) {
      return false;
    }

    // Filtro por activo
    if (filtros.activo !== undefined && bloqueo.activo !== filtros.activo) {
      return false;
    }

    // Filtro por búsqueda de texto
    if (filtros.busqueda) {
      const termino = filtros.busqueda.toLowerCase();
      const titulo = (bloqueo.titulo || '').toLowerCase();
      const descripcion = (bloqueo.descripcion || '').toLowerCase();

      if (!titulo.includes(termino) && !descripcion.includes(termino)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Agrupar bloqueos por profesional
 * @param {Array} bloqueos - Array de bloqueos
 * @returns {Object} Bloqueos agrupados { profesional_id: [...bloqueos] }
 */
export const agruparBloqueosPorProfesional = (bloqueos) => {
  if (!Array.isArray(bloqueos)) return {};

  return bloqueos.reduce((agrupados, bloqueo) => {
    const key = bloqueo.profesional_id || 'organizacionales';
    if (!agrupados[key]) {
      agrupados[key] = [];
    }
    agrupados[key].push(bloqueo);
    return agrupados;
  }, {});
};

/**
 * Calcular estadísticas de bloqueos
 * @param {Array} bloqueos - Array de bloqueos
 * @returns {Object} { totalDias, totalBloqueos, porTipo, ingresosPerdidos }
 */
export const calcularEstadisticasBloqueos = (bloqueos) => {
  if (!Array.isArray(bloqueos)) {
    return {
      totalDias: 0,
      totalBloqueos: 0,
      porTipo: {},
      ingresosPerdidos: 0,
    };
  }

  const totalDias = bloqueos.reduce((suma, bloqueo) => {
    return suma + calcularDiasBloqueo(bloqueo.fecha_inicio, bloqueo.fecha_fin);
  }, 0);

  const porTipo = bloqueos.reduce((conteo, bloqueo) => {
    const tipo = bloqueo.tipo_bloqueo;
    conteo[tipo] = (conteo[tipo] || 0) + 1;
    return conteo;
  }, {});

  const ingresosPerdidos = bloqueos.reduce((suma, bloqueo) => {
    return suma + (parseFloat(bloqueo.ingresos_perdidos) || 0);
  }, 0);

  return {
    totalDias,
    totalBloqueos: bloqueos.length,
    porTipo,
    ingresosPerdidos,
  };
};

export default {
  COLORES_TIPO_BLOQUEO,
  ICONOS_TIPO_BLOQUEO,
  LABELS_TIPO_BLOQUEO,
  obtenerColorTipoBloqueo,
  obtenerIconoTipoBloqueo,
  obtenerLabelTipoBloqueo,
  calcularDiasBloqueo,
  validarSolapamientoBloqueos,
  formatearRangoBloqueo,
  esBloqueoDiaCompleto,
  esBloqueoOrganizacional,
  obtenerFechasBloqueo,
  filtrarBloqueos,
  agruparBloqueosPorProfesional,
  calcularEstadisticasBloqueos,
};
