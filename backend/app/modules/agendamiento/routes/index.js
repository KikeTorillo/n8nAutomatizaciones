/**
 * @fileoverview Routes del Módulo Agendamiento
 * @description Re-exporta todas las rutas del módulo de agendamiento
 * @version 1.0.0
 * @date Diciembre 2025
 */

const serviciosRouter = require('./servicios');
const citasRouter = require('./citas');
const bloqueosHorariosRouter = require('./bloqueos-horarios');
const tiposBloqueoRouter = require('./tipos-bloqueo');
const horariosProfesionalesRouter = require('./horarios-profesionales');
const chatbotsRouter = require('./chatbots');
const disponibilidadRouter = require('./disponibilidad');

module.exports = {
  servicios: serviciosRouter,
  citas: citasRouter,
  'bloqueos-horarios': bloqueosHorariosRouter,
  'tipos-bloqueo': tiposBloqueoRouter,
  'horarios-profesionales': horariosProfesionalesRouter,
  chatbots: chatbotsRouter,
  disponibilidad: disponibilidadRouter
};
