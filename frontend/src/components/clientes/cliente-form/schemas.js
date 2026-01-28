/**
 * ====================================================================
 * SCHEMAS - Cliente Form Drawer
 * ====================================================================
 *
 * Re-exporta schemas existentes y adapta para uso en drawer
 * Sigue patrón de producto-form/schemas.js
 *
 * Enero 2026
 */

// Reutilizar schema existente
import {
  clienteSchema,
  clienteDefaults,
  clienteToFormData,
  formDataToApi,
} from '@/schemas/cliente.schema';

// Re-exportar para uso en drawer
export {
  clienteSchema,
  clienteDefaults as defaultValuesCreate,
  clienteToFormData,
  formDataToApi,
};

/**
 * Obtener valores por defecto para edición
 * @param {Object} cliente - Datos del cliente desde API
 * @returns {Object} Datos formateados para React Hook Form
 */
export const getDefaultValuesEdit = (cliente) => clienteToFormData(cliente);
