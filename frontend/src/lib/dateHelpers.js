/**
 * ====================================================================
 * DATE HELPERS
 * ====================================================================
 *
 * Funciones utilitarias para cálculos de fechas reutilizables
 * en todo el frontend.
 *
 * Enero 2026
 * ====================================================================
 */

/**
 * Calcula los días hasta una fecha
 * @param {string|Date} fechaFin - Fecha objetivo
 * @returns {number} Número de días (negativo si ya pasó)
 */
export function calcularDiasHastaFecha(fechaFin) {
  if (!fechaFin) return 0;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fin = new Date(fechaFin);
  fin.setHours(0, 0, 0, 0);

  const diff = fin - hoy;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcula días restantes con información detallada
 * @param {string|Date} fechaLimite - Fecha límite
 * @returns {{ dias: number|null, texto: string, vencido: boolean }}
 */
export function calcularDiasRestantesDetallado(fechaLimite) {
  if (!fechaLimite) {
    return { dias: null, texto: 'Sin fecha límite', vencido: false };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);

  const diffTime = limite - hoy;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      dias: Math.abs(diffDays),
      texto: `Vencida hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`,
      vencido: true,
    };
  }

  if (diffDays === 0) {
    return { dias: 0, texto: 'Vence hoy', vencido: false };
  }

  return {
    dias: diffDays,
    texto: `${diffDays} ${diffDays === 1 ? 'día' : 'días'} restantes`,
    vencido: false,
  };
}

/**
 * Calcula días restantes de una ausencia activa (compatibilidad con useAusencias)
 * @param {string|Date} fechaFin - Fecha de fin de la ausencia
 * @returns {number} Días restantes (mínimo 0)
 */
export function calcularDiasRestantes(fechaFin) {
  const dias = calcularDiasHastaFecha(fechaFin);
  return Math.max(0, dias);
}

/**
 * Formatea rango de fechas para mostrar
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {string|Date} fechaFin - Fecha de fin
 * @returns {string} Rango formateado (ej: "15 ene - 20 ene" o "15 ene" si son iguales)
 */
export function formatRangoFechas(fechaInicio, fechaFin) {
  const opciones = { day: 'numeric', month: 'short' };
  const inicio = new Date(fechaInicio).toLocaleDateString('es-MX', opciones);
  const fin = new Date(fechaFin).toLocaleDateString('es-MX', opciones);

  if (fechaInicio === fechaFin) {
    return inicio;
  }
  return `${inicio} - ${fin}`;
}

/**
 * Verifica si una fecha está próxima a vencer
 * @param {string|Date} fechaVencimiento - Fecha de vencimiento
 * @param {number} dias - Días de umbral (default: 30)
 * @returns {boolean}
 */
export function estaProximoAVencer(fechaVencimiento, dias = 30) {
  if (!fechaVencimiento) return false;

  const diferenciaDias = calcularDiasHastaFecha(fechaVencimiento);
  return diferenciaDias >= 0 && diferenciaDias <= dias;
}

/**
 * Verifica si una fecha ya venció
 * @param {string|Date} fechaVencimiento - Fecha de vencimiento
 * @returns {boolean}
 */
export function estaVencido(fechaVencimiento) {
  if (!fechaVencimiento) return false;

  return calcularDiasHastaFecha(fechaVencimiento) < 0;
}

/**
 * Formatea una fecha para visualización
 * @param {string|Date} fecha - Fecha a formatear
 * @param {Object} opciones - Opciones de formato (default: día, mes, año)
 * @returns {string} Fecha formateada o '-' si no hay fecha
 */
export function formatearFecha(fecha, opciones = {}) {
  if (!fecha) return '-';

  const defaultOpciones = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opciones,
  };

  return new Date(fecha).toLocaleDateString('es-MX', defaultOpciones);
}

export default {
  calcularDiasHastaFecha,
  calcularDiasRestantesDetallado,
  calcularDiasRestantes,
  formatRangoFechas,
  estaProximoAVencer,
  estaVencido,
  formatearFecha,
};
