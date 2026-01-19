/**
 * Constantes para el módulo de Vacaciones
 */

/**
 * Estados de solicitud de vacaciones
 */
export const ESTADOS_SOLICITUD = {
  pendiente: { value: 'pendiente', label: 'Pendiente', color: 'yellow', icon: '⏳' },
  aprobada: { value: 'aprobada', label: 'Aprobada', color: 'green', icon: '✅' },
  rechazada: { value: 'rechazada', label: 'Rechazada', color: 'red', icon: '❌' },
  cancelada: { value: 'cancelada', label: 'Cancelada', color: 'gray', icon: '🚫' },
};

/**
 * Tipos de aprobador
 */
export const TIPOS_APROBADOR = {
  supervisor: { value: 'supervisor', label: 'Supervisor directo' },
  rrhh: { value: 'rrhh', label: 'Responsable de RRHH' },
  rol_especifico: { value: 'rol_especifico', label: 'Rol específico' },
};

/**
 * Turnos de medio día
 */
export const TURNOS_MEDIO_DIA = {
  manana: { value: 'manana', label: 'Mañana (hasta 14:00)' },
  tarde: { value: 'tarde', label: 'Tarde (desde 14:00)' },
};

/**
 * Query Keys para React Query
 */
export const VACACIONES_KEYS = {
  all: ['vacaciones'],
  politica: () => [...VACACIONES_KEYS.all, 'politica'],
  niveles: (filtros) => [...VACACIONES_KEYS.all, 'niveles', filtros],
  miSaldo: (anio) => [...VACACIONES_KEYS.all, 'mi-saldo', anio],
  saldos: (filtros) => [...VACACIONES_KEYS.all, 'saldos', filtros],
  misSolicitudes: (filtros) => [...VACACIONES_KEYS.all, 'mis-solicitudes', filtros],
  solicitudes: (filtros) => [...VACACIONES_KEYS.all, 'solicitudes', filtros],
  pendientes: (filtros) => [...VACACIONES_KEYS.all, 'pendientes', filtros],
  solicitud: (id) => [...VACACIONES_KEYS.all, 'solicitud', id],
  dashboard: (anio) => [...VACACIONES_KEYS.all, 'dashboard', anio],
  estadisticas: (filtros) => [...VACACIONES_KEYS.all, 'estadisticas', filtros],
};
