/**
 * ====================================================================
 * CLIENTE FORM - Barrel Exports
 * ====================================================================
 *
 * Exporta schemas y tabs del formulario de cliente
 * Sigue patron de producto-form/index.js
 *
 * Enero 2026
 */

// Schemas de validacion Zod
export {
  clienteSchema,
  defaultValuesCreate,
  getDefaultValuesEdit,
  formDataToApi,
} from './schemas';

// Tabs del formulario
export { default as ClienteFormBasicoTab } from './ClienteFormBasicoTab';
export { default as ClienteFormDireccionTab } from './ClienteFormDireccionTab';
export { default as ClienteFormPreferenciasTab } from './ClienteFormPreferenciasTab';
export { default as ClienteFormConfigTab } from './ClienteFormConfigTab';
