/**
 * Funciones utilitarias para vacaciones
 */

import { ESTADOS_SOLICITUD } from './constants';

/**
 * Obtiene la configuración visual de un estado
 */
export function getEstadoSolicitud(estado) {
  return ESTADOS_SOLICITUD[estado] || ESTADOS_SOLICITUD.pendiente;
}

/**
 * Formatea días de vacaciones
 */
export function formatDias(dias) {
  if (dias === null || dias === undefined) return '-';
  const num = parseFloat(dias);
  if (num === 1) return '1 día';
  if (num === 0.5) return '½ día';
  return `${num} días`;
}

/**
 * Calcula progreso hacia siguiente nivel
 */
export function calcularProgresoNivel(nivelInfo) {
  if (!nivelInfo || !nivelInfo.anios_para_siguiente) return null;

  const aniosEnNivel = nivelInfo.anios_antiguedad;
  const aniosParaSiguiente = parseFloat(nivelInfo.anios_para_siguiente);
  const total = aniosEnNivel + aniosParaSiguiente;

  return {
    porcentaje: Math.min(100, (aniosEnNivel / total) * 100),
    aniosFaltantes: aniosParaSiguiente,
    diasSiguienteNivel: nivelInfo.dias_siguiente_nivel,
  };
}
