/**
 * Constantes para el módulo de Agendamiento
 * Query keys y configuración compartida
 * Ene 2026 - Centralización de query keys
 */

/**
 * Query keys para React Query - Agendamiento
 */
export const AGENDAMIENTO_KEYS = {
  all: ['agendamiento'],

  // Citas
  citas: {
    all: () => ['citas'],
    list: (params) => [...AGENDAMIENTO_KEYS.citas.all(), 'list', params],
    detail: (id) => ['citas', id],
    buscar: (termino) => ['citas', 'buscar', termino],
    byProfesional: (params) => ['citas', 'profesional', params],
    byCliente: (clienteId) => ['citas', 'cliente', clienteId],
    hoy: (fecha) => ['citas', 'hoy', fecha],
    pendientes: () => ['citas', 'pendientes'],
    serie: (serieId, options) => ['citas', 'serie', serieId, options],
    recordatorios: (citaId) => ['citas', citaId, 'recordatorios'],
  },

  // Bloqueos
  bloqueos: {
    all: () => ['bloqueos'],
    list: (params) => [...AGENDAMIENTO_KEYS.bloqueos.all(), 'list', params],
    detail: (id) => ['bloqueo', id],
    byProfesional: (profesionalId, params) => ['bloqueos', 'profesional', profesionalId, params],
    organizacionales: (params) => ['bloqueos', 'organizacionales', params],
    byRango: (fechaInicio, fechaFin, params) => ['bloqueos', 'rango', fechaInicio, fechaFin, params],
    byTipo: (tipo, params) => ['bloqueos', 'tipo', tipo, params],
  },

  // Servicios
  servicios: {
    all: () => ['servicios'],
    list: (params) => [...AGENDAMIENTO_KEYS.servicios.all(), 'list', params],
    detail: (id) => ['servicio', id],
    buscar: (termino) => ['buscar-servicios', termino],
    profesionales: (servicioId) => ['servicio-profesionales', servicioId],
    dashboard: () => ['servicios-dashboard'],
  },

  // Horarios
  horarios: {
    all: () => ['horarios'],
    byProfesional: (profesionalId, options) => ['horarios', profesionalId, options],
    detail: (id) => ['horarios', id],
    validacion: (profesionalId) => ['horarios', 'validacion', profesionalId],
  },

  // Disponibilidad
  disponibilidad: {
    all: () => ['disponibilidad'],
    inmediata: (params) => ['disponibilidad-inmediata', params],
    profesional: (profesionalId, fecha) => ['disponibilidad', 'profesional', profesionalId, fecha],
    servicio: (servicioId, fecha) => ['disponibilidad', 'servicio', servicioId, fecha],
  },

  // Estadísticas
  estadisticas: {
    all: () => ['estadisticas-agendamiento'],
    asignaciones: () => ['estadisticas-asignaciones'],
    ocupacion: (profesionalId, periodo) => ['estadisticas', 'ocupacion', profesionalId, periodo],
  },
};

/**
 * Estados de Citas
 */
export const ESTADOS_CITA = {
  PROGRAMADA: 'programada',
  CONFIRMADA: 'confirmada',
  EN_SALA: 'en_sala',
  EN_SERVICIO: 'en_servicio',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
  NO_SHOW: 'no_show',
};

/**
 * Tipos de Bloqueo
 */
export const TIPOS_BLOQUEO = {
  VACACIONES: 'vacaciones',
  FERIADO: 'feriado',
  MANTENIMIENTO: 'mantenimiento',
  CAPACITACION: 'capacitacion',
  PERSONAL: 'personal',
  OTRO: 'otro',
};

/**
 * Tipos de Recurrencia
 */
export const TIPOS_RECURRENCIA = {
  NINGUNA: 'ninguna',
  DIARIA: 'diaria',
  SEMANAL: 'semanal',
  BISEMANAL: 'bisemanal',
  MENSUAL: 'mensual',
};

/**
 * Estados de Recordatorio
 */
export const ESTADOS_RECORDATORIO = {
  PENDIENTE: 'pendiente',
  ENVIADO: 'enviado',
  FALLIDO: 'fallido',
  CONFIRMADO: 'confirmado',
};
