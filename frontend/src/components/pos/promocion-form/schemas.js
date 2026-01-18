/**
 * Re-exports de schemas de promoción
 * Schemas centralizados en @/schemas/promocion.schema.js - Ene 2026
 */
export {
  promocionCreateSchema,
  promocionEditSchema,
  promocionDefaultValues,
  getPromocionEditValues,
  transformPromocionToPayload,
  TIPOS_PROMOCION,
  DIAS_SEMANA,
  // Compatibilidad
  defaultValuesCreate,
  getDefaultValuesEdit,
  transformFormToPayload,
} from '@/schemas/promocion.schema';
