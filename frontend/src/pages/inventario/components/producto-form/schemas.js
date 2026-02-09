/**
 * Re-exports de schemas de producto
 * Schemas centralizados en @/schemas/producto.schema.js - Ene 2026
 */
export {
  productoCreateSchema,
  productoEditSchema,
  productoDefaultValues,
  getProductoEditValues,
  // Compatibilidad
  defaultValuesCreate,
  getDefaultValuesEdit,
} from '@/schemas/producto.schema';
