/**
 * Utilidad para estados de vigencia de entidades con fechas
 * Ene 2026 - Refactorización Frontend
 */

export const ESTADO_VIGENCIA_COLORS = {
  inactivo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  programado: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  expirado: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  activo: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

const DEFAULT_LABELS = {
  inactivo: 'Inactivo',
  programado: 'Programado',
  expirado: 'Expirado',
  activo: 'Activo',
};

export const LABELS_FEMENINO = {
  inactivo: 'Inactiva',
  programado: 'Programada',
  expirado: 'Expirada',
  activo: 'Activa',
};

/**
 * Obtiene estado de vigencia de una entidad
 * @param {Object} entidad - Entidad con {activo, fecha_inicio, fecha_fin}
 * @param {Object} options - { labels, campoActivo, campoFechaInicio, campoFechaFin }
 * @returns {{ color: string, label: string, estado: string }}
 */
export function getEstadoVigencia(entidad, options = {}) {
  const {
    labels = DEFAULT_LABELS,
    campoActivo = 'activo',
    campoFechaInicio = 'fecha_inicio',
    campoFechaFin = 'fecha_fin',
  } = options;

  if (!entidad[campoActivo]) {
    return { color: ESTADO_VIGENCIA_COLORS.inactivo, label: labels.inactivo, estado: 'inactivo' };
  }

  const hoy = new Date();
  const inicio = entidad[campoFechaInicio] ? new Date(entidad[campoFechaInicio]) : null;
  const fin = entidad[campoFechaFin] ? new Date(entidad[campoFechaFin]) : null;

  if (inicio && hoy < inicio) {
    return { color: ESTADO_VIGENCIA_COLORS.programado, label: labels.programado, estado: 'programado' };
  }

  if (fin && hoy > fin) {
    return { color: ESTADO_VIGENCIA_COLORS.expirado, label: labels.expirado, estado: 'expirado' };
  }

  return { color: ESTADO_VIGENCIA_COLORS.activo, label: labels.activo, estado: 'activo' };
}

export default getEstadoVigencia;
