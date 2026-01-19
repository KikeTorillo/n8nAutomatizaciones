/**
 * ====================================================================
 * SCHEMAS - Barrel Export
 * ====================================================================
 * Re-exporta todos los schemas Zod del frontend.
 * Permite imports centralizados: import { clienteSchema, productoCreateSchema } from '@/schemas';
 */

// ========== CLIENTE SCHEMA ==========
export {
  TIPOS_CLIENTE_VALUES,
  clienteSchema,
  clienteDefaults,
  clienteToFormData,
  formDataToApi,
} from './cliente.schema';

// ========== PRODUCTO SCHEMA ==========
export {
  productoCreateSchema,
  productoEditSchema,
  productoDefaultValues,
  getProductoEditValues,
  // Re-exports para compatibilidad
  defaultValuesCreate as productoDefaultValuesCreate,
  getDefaultValuesEdit as getProductoDefaultValuesEdit,
} from './producto.schema';

// ========== PROFESIONALES SCHEMAS ==========
export {
  // Enums
  NIVELES_EDUCACION_VALUES,
  TIPOS_EMPLEO_VALUES,
  NIVELES_HABILIDAD_VALUES,
  CATEGORIAS_HABILIDAD_VALUES,
  TIPOS_CUENTA_BANCARIA_VALUES,
  USOS_CUENTA_VALUES,
  MONEDAS_VALUES,
  TIPOS_DOCUMENTO_VALUES,
  // Schemas
  educacionSchema,
  experienciaSchema,
  habilidadEmpleadoSchema,
  nuevaHabilidadCatalogoSchema,
  cuentaBancariaSchema,
  documentoMetadataSchema,
  // Constantes de documentos
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE,
  // Utilidades
  validateFile,
  sanitizeFormData,
} from './profesionales.schemas';

// ========== PROMOCION SCHEMA ==========
export {
  TIPOS_PROMOCION,
  DIAS_SEMANA,
  promocionCreateSchema,
  promocionEditSchema,
  promocionDefaultValues,
  getPromocionEditValues,
  transformPromocionToPayload,
  // Re-exports para compatibilidad
  defaultValuesCreate as promocionDefaultValuesCreate,
  getDefaultValuesEdit as getPromocionDefaultValuesEdit,
  transformFormToPayload,
} from './promocion.schema';

// ========== CITA SCHEMA ==========
export {
  // Constantes
  DURACION_MINIMA,
  DURACION_MAXIMA,
  MAX_SERVICIOS_POR_CITA,
  MAX_CARACTERES_NOTAS,
  // Schemas
  citaCreateSchema,
  citaEditSchema,
  // Defaults y utilidades
  citaDefaultValues,
  getCitaEditValues,
  transformCitaToPayload,
  calcularHoraFin,
} from './cita.schema';
