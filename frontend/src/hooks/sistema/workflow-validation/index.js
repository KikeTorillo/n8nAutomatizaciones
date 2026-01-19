/**
 * ====================================================================
 * HOOKS - Workflow Validation (Modular)
 * ====================================================================
 * Re-exportación de todos los elementos del módulo de validación de workflows.
 *
 * Estructura:
 * - constants.js: Tipos de error y severidades
 * - validators.js: Funciones de validación puras
 * - useWorkflowValidation.js: Hook principal
 */

// Constantes
export { ERROR_TYPES, ERROR_SEVERITY } from './constants';

// Funciones de validación (para testing o uso directo)
export {
  validarNodoInicio,
  validarNodosFin,
  validarNodosConectados,
  validarSalidaInicio,
  validarNodosFinSinSalida,
  validarNodosCondicion,
  validarNodosAprobacion,
  validarNodosAccion,
  detectarCiclos,
  validarCaminoCompleto,
  validarDatosWorkflow,
} from './validators';

// Hook principal
export { useWorkflowValidation } from './useWorkflowValidation';
export { default } from './useWorkflowValidation';
