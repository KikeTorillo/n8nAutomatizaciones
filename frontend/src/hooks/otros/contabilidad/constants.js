/**
 * Constantes para el módulo de Contabilidad
 * Query keys y configuración compartida
 */

/**
 * Query keys para React Query
 */
export const CONTABILIDAD_KEYS = {
  all: ['contabilidad'],
  // Dashboard
  dashboard: () => [...CONTABILIDAD_KEYS.all, 'dashboard'],
  // Cuentas
  cuentas: {
    all: () => [...CONTABILIDAD_KEYS.all, 'cuentas'],
    list: (params) => [...CONTABILIDAD_KEYS.cuentas.all(), params],
    arbol: (params) => [...CONTABILIDAD_KEYS.cuentas.all(), 'arbol', params],
    afectables: (params) => [...CONTABILIDAD_KEYS.cuentas.all(), 'afectables', params],
    detail: (id) => [...CONTABILIDAD_KEYS.cuentas.all(), id],
  },
  // Asientos
  asientos: {
    all: () => [...CONTABILIDAD_KEYS.all, 'asientos'],
    list: (params) => [...CONTABILIDAD_KEYS.asientos.all(), params],
    detail: (id, fecha) => [...CONTABILIDAD_KEYS.asientos.all(), id, fecha],
  },
  // Períodos
  periodos: {
    all: () => [...CONTABILIDAD_KEYS.all, 'periodos'],
    list: (params) => [...CONTABILIDAD_KEYS.periodos.all(), params],
  },
  // Reportes
  reportes: {
    all: () => [...CONTABILIDAD_KEYS.all, 'reportes'],
    balanza: (periodoId) => [...CONTABILIDAD_KEYS.reportes.all(), 'balanza', periodoId],
    libroMayor: (cuentaId, fechaInicio, fechaFin) => [
      ...CONTABILIDAD_KEYS.reportes.all(),
      'libro-mayor',
      cuentaId,
      fechaInicio,
      fechaFin,
    ],
    estadoResultados: (fechaInicio, fechaFin) => [
      ...CONTABILIDAD_KEYS.reportes.all(),
      'estado-resultados',
      fechaInicio,
      fechaFin,
    ],
    balanceGeneral: (fecha) => [...CONTABILIDAD_KEYS.reportes.all(), 'balance-general', fecha],
  },
  // Configuración
  configuracion: () => [...CONTABILIDAD_KEYS.all, 'configuracion'],
};

/**
 * Estados de asientos contables
 */
export const ESTADOS_ASIENTO = {
  BORRADOR: 'borrador',
  PUBLICADO: 'publicado',
  ANULADO: 'anulado',
};

/**
 * Tipos de cuentas contables
 */
export const TIPOS_CUENTA = {
  ACTIVO: 'activo',
  PASIVO: 'pasivo',
  CAPITAL: 'capital',
  INGRESO: 'ingreso',
  GASTO: 'gasto',
};

/**
 * Naturaleza de cuentas
 */
export const NATURALEZA_CUENTA = {
  DEUDORA: 'deudora',
  ACREEDORA: 'acreedora',
};
