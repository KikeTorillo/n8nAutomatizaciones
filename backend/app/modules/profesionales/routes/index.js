/**
 * @fileoverview Routes del Módulo Profesionales
 * @description Re-exporta todas las rutas del módulo de profesionales
 * @version 1.2.0
 * @date Enero 2026
 *
 * Rutas incluidas:
 * - /profesionales: CRUD, jerarquía, categorías, documentos, cuentas, experiencia, educación, habilidades, onboarding
 * - /habilidades: Catálogo maestro de habilidades por organización
 * - /onboarding-empleados: Plantillas, tareas y dashboard de onboarding
 */

const profesionalesRouter = require('./profesionales');
const habilidadesRouter = require('./habilidades');
const onboardingRouter = require('./onboarding');

module.exports = {
  profesionales: profesionalesRouter,
  habilidades: habilidadesRouter,
  'onboarding-empleados': onboardingRouter
};
