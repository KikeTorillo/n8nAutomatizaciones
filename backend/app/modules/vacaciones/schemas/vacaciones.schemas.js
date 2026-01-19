/**
 * Schemas Joi para Módulo de Vacaciones
 * Plan de Empleados Competitivo - Fase 3
 * Enero 2026
 */

const Joi = require('joi');
const { withPagination } = require('../../../schemas/shared');
const { ESTADOS_SOLICITUD, TIPOS_APROBADOR, TURNOS_MEDIO_DIA } = require('../constants/vacaciones.constants');

// ==================== POLÍTICAS ====================

const obtenerPolitica = {
  params: Joi.object({}),
  query: Joi.object({}),
};

const actualizarPolitica = {
  params: Joi.object({}),
  body: Joi.object({
    dias_por_anio: Joi.number().integer().min(1).max(365),
    dias_maximos_acumulables: Joi.number().integer().min(0).max(365).allow(null),
    dias_anticipacion_minimos: Joi.number().integer().min(0).max(365),
    requiere_aprobacion: Joi.boolean(),
    aprobador_tipo: Joi.string().valid(...Object.values(TIPOS_APROBADOR)),
    aprobador_rol_id: Joi.number().integer().positive().allow(null),
    permite_medios_dias: Joi.boolean(),
    usar_niveles_antiguedad: Joi.boolean(),
    ignorar_festivos: Joi.boolean(),
    permite_saldo_negativo: Joi.boolean(),
    dias_maximos_consecutivos: Joi.number().integer().min(1).max(365).allow(null),
    mes_inicio_periodo: Joi.number().integer().min(1).max(12),
    dia_inicio_periodo: Joi.number().integer().min(1).max(31),
  }).min(1),
};

// ==================== NIVELES ====================

const listarNiveles = {
  params: Joi.object({}),
  query: Joi.object({
    activo: Joi.boolean(),
  }),
};

const crearNivel = {
  params: Joi.object({}),
  body: Joi.object({
    nombre: Joi.string().max(100).required(),
    descripcion: Joi.string().max(500).allow('', null),
    anios_minimos: Joi.number().min(0).max(100).required(),
    anios_maximos: Joi.number().min(0).max(100).allow(null),
    dias_anuales: Joi.number().integer().min(1).max(365).required(),
    dias_extra_por_anio: Joi.number().min(0).max(30).default(0),
    orden: Joi.number().integer().min(0).default(0),
  }),
};

const actualizarNivel = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    nombre: Joi.string().max(100),
    descripcion: Joi.string().max(500).allow('', null),
    anios_minimos: Joi.number().min(0).max(100),
    anios_maximos: Joi.number().min(0).max(100).allow(null),
    dias_anuales: Joi.number().integer().min(1).max(365),
    dias_extra_por_anio: Joi.number().min(0).max(30),
    activo: Joi.boolean(),
    orden: Joi.number().integer().min(0),
  }).min(1),
};

const eliminarNivel = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const crearNivelesPreset = {
  params: Joi.object({}),
  body: Joi.object({
    pais: Joi.string().valid('mexico', 'colombia').required(),
    sobrescribir: Joi.boolean().default(false),
  }),
};

// ==================== SALDOS ====================

const obtenerMiSaldo = {
  params: Joi.object({}),
  query: Joi.object({
    anio: Joi.number().integer().min(2000).max(2100),
  }),
};

const listarSaldos = {
  params: Joi.object({}),
  query: withPagination({
    anio: Joi.number().integer().min(2000).max(2100),
    profesional_id: Joi.number().integer().positive(),
    con_pendientes: Joi.boolean(),
  }),
};

const ajustarSaldo = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    dias_ajuste: Joi.number().min(-365).max(365).required(),
    motivo: Joi.string().max(500).required(),
  }),
};

const generarSaldosAnio = {
  params: Joi.object({}),
  body: Joi.object({
    anio: Joi.number().integer().min(2000).max(2100).required(),
    profesional_id: Joi.number().integer().positive(), // Opcional: solo para un profesional
    sobrescribir: Joi.boolean().default(false),
  }),
};

// ==================== SOLICITUDES ====================

const crearSolicitud = {
  params: Joi.object({}),
  body: Joi.object({
    fecha_inicio: Joi.date().iso().required(),
    fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).required(),
    es_medio_dia: Joi.boolean().default(false),
    turno_medio_dia: Joi.string().valid(...Object.values(TURNOS_MEDIO_DIA))
      .when('es_medio_dia', { is: true, then: Joi.required() }),
    motivo_solicitud: Joi.string().max(500).allow('', null),
  }),
};

const listarMisSolicitudes = {
  params: Joi.object({}),
  query: withPagination({
    estado: Joi.string().valid(...Object.values(ESTADOS_SOLICITUD)),
    anio: Joi.number().integer().min(2000).max(2100),
  }),
};

const listarSolicitudes = {
  params: Joi.object({}),
  query: withPagination({
    estado: Joi.string().valid(...Object.values(ESTADOS_SOLICITUD)),
    profesional_id: Joi.number().integer().positive(),
    fecha_inicio: Joi.date().iso(),
    fecha_fin: Joi.date().iso(),
    anio: Joi.number().integer().min(2000).max(2100),
  }),
};

const listarPendientes = {
  params: Joi.object({}),
  query: withPagination({}),
};

const obtenerSolicitud = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const aprobarSolicitud = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    notas_internas: Joi.string().max(500).allow('', null),
  }),
};

const rechazarSolicitud = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    motivo_rechazo: Joi.string().max(500).required(),
    notas_internas: Joi.string().max(500).allow('', null),
  }),
};

const cancelarSolicitud = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    motivo: Joi.string().max(500).allow('', null),
  }),
};

// ==================== DASHBOARD / ESTADÍSTICAS ====================

const obtenerDashboard = {
  params: Joi.object({}),
  query: Joi.object({
    anio: Joi.number().integer().min(2000).max(2100),
  }),
};

const obtenerEstadisticas = {
  params: Joi.object({}),
  query: Joi.object({
    anio: Joi.number().integer().min(2000).max(2100),
    departamento_id: Joi.number().integer().positive(),
  }),
};

module.exports = {
  // Políticas
  obtenerPolitica,
  actualizarPolitica,

  // Niveles
  listarNiveles,
  crearNivel,
  actualizarNivel,
  eliminarNivel,
  crearNivelesPreset,

  // Saldos
  obtenerMiSaldo,
  listarSaldos,
  ajustarSaldo,
  generarSaldosAnio,

  // Solicitudes
  crearSolicitud,
  listarMisSolicitudes,
  listarSolicitudes,
  listarPendientes,
  obtenerSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  cancelarSolicitud,

  // Dashboard
  obtenerDashboard,
  obtenerEstadisticas,
};
