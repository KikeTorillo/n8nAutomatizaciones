/**
 * @fileoverview Routes del Módulo Profesionales
 * @description Re-exporta todas las rutas del módulo de profesionales
 * @version 1.3.0
 * @date Enero 2026
 *
 * Rutas incluidas:
 * - /profesionales: CRUD, jerarquía, categorías, documentos, cuentas, experiencia, educación, habilidades, onboarding
 * - /habilidades: Catálogo maestro de habilidades por organización
 * - /onboarding-empleados: Plantillas, tareas y dashboard de onboarding
 * - /motivos-salida: Catálogo de motivos de terminación (GAP-001)
 * - /categorias-pago: Categorías de pago para nómina (GAP-004)
 */

const profesionalesRouter = require('./profesionales');
const habilidadesRouter = require('./habilidades');
const onboardingRouter = require('./onboarding');
const motivosSalidaRouter = require('./motivos-salida');
const categoriasPagoRouter = require('./categorias-pago');

module.exports = {
  profesionales: profesionalesRouter,
  habilidades: habilidadesRouter,
  'onboarding-empleados': onboardingRouter,
  'motivos-salida': motivosSalidaRouter,
  'categorias-pago': categoriasPagoRouter
};
