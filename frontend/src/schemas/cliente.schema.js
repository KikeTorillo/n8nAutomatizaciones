/**
 * ====================================================================
 * SCHEMA ZOD - Modulo Clientes
 * ====================================================================
 *
 * Schema de validacion para formularios del modulo de clientes.
 * Migrado de useState + validacion manual a React Hook Form + Zod.
 *
 * Enero 2026
 */
import { z } from 'zod';

// ==================== ENUMS REUTILIZABLES ====================

export const TIPOS_CLIENTE_VALUES = ['persona', 'empresa'];

// ==================== HELPERS ====================

/**
 * Campo string opcional que acepta string vacio
 */
const optionalString = (max = 500) =>
  z
    .string()
    .max(max, `Maximo ${max} caracteres`)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined));

/**
 * Campo string requerido con trim
 */
const requiredString = (field, min = 2, max = 200) =>
  z
    .string()
    .min(min, `${field} debe tener al menos ${min} caracteres`)
    .max(max, `${field} no puede superar ${max} caracteres`)
    .transform((val) => val.trim());

/**
 * Campo fecha opcional (string vacio → undefined)
 */
const optionalDate = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((val) => (val ? val : undefined));

// ==================== SCHEMA PRINCIPAL ====================

export const clienteSchema = z
  .object({
    // Tipo de cliente
    tipo: z.enum(TIPOS_CLIENTE_VALUES).default('persona'),

    // Informacion basica
    nombre_completo: requiredString('El nombre', 2, 150),
    telefono: z
      .string()
      .min(10, 'El telefono debe tener 10 digitos')
      .max(10, 'El telefono debe tener 10 digitos')
      .regex(/^[0-9]+$/, 'Solo digitos numericos')
      .transform((val) => val.trim()),
    email: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        },
        { message: 'El email no es valido' }
      )
      .transform((val) => (val?.trim() ? val.trim() : undefined)),
    fecha_nacimiento: optionalDate,

    // Campos empresa (RFC, razon social)
    rfc: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          // RFC: 3-4 letras + 6 numeros + 3 caracteres alfanumericos
          return /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i.test(val);
        },
        { message: 'RFC invalido (formato: XAXX010101000)' }
      )
      .transform((val) => (val?.trim() ? val.trim().toUpperCase() : undefined)),
    razon_social: optionalString(200),

    // Direccion estructurada
    calle: optionalString(300),
    colonia: optionalString(150),
    ciudad: optionalString(100),
    estado_id: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    codigo_postal: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return /^[0-9]{5}$/.test(val);
        },
        { message: 'El codigo postal debe ser de 5 digitos' }
      )
      .transform((val) => (val?.trim() ? val.trim() : undefined)),
    pais_id: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? parseInt(val, 10) : 1)), // Mexico por defecto

    // Notas medicas / alergias
    notas_medicas: optionalString(2000),

    // Canales digitales
    telegram_chat_id: optionalString(50),
    whatsapp_phone: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return /^\+\d{10,15}$/.test(val);
        },
        { message: 'Formato internacional: +521XXXXXXXXXX' }
      )
      .transform((val) => (val?.trim() ? val.trim() : undefined)),

    // Preferencias
    profesional_preferido: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    lista_precios_id: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? parseInt(val, 10) : null)),

    // Configuracion
    marketing_permitido: z.boolean().default(true),
    activo: z.boolean().default(true),

    // Foto (URL, no archivo)
    foto_url: optionalString(500),
  })
  .superRefine((data, ctx) => {
    // Validacion condicional: RFC solo valido para empresas
    if (data.tipo === 'empresa' && data.rfc) {
      const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
      if (!rfcPattern.test(data.rfc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'RFC invalido para empresa',
          path: ['rfc'],
        });
      }
    }
  });

// ==================== DEFAULTS ====================

/**
 * Valores por defecto para un cliente nuevo
 */
export const clienteDefaults = {
  tipo: 'persona',
  nombre_completo: '',
  telefono: '',
  email: '',
  fecha_nacimiento: '',
  rfc: '',
  razon_social: '',
  calle: '',
  colonia: '',
  ciudad: '',
  estado_id: '',
  codigo_postal: '',
  pais_id: '1',
  notas_medicas: '',
  telegram_chat_id: '',
  whatsapp_phone: '',
  profesional_preferido: '',
  lista_precios_id: '',
  marketing_permitido: true,
  activo: true,
  foto_url: '',
};

/**
 * Transforma datos del backend al formato del formulario
 * @param {Object} cliente - Datos del cliente desde API
 * @returns {Object} Datos formateados para React Hook Form
 */
export function clienteToFormData(cliente) {
  if (!cliente) return clienteDefaults;

  return {
    tipo: cliente.tipo || 'persona',
    nombre_completo: cliente.nombre || '',
    telefono: cliente.telefono || '',
    email: cliente.email || '',
    fecha_nacimiento: cliente.fecha_nacimiento?.split('T')[0] || '',
    rfc: cliente.rfc || '',
    razon_social: cliente.razon_social || '',
    calle: cliente.calle || '',
    colonia: cliente.colonia || '',
    ciudad: cliente.ciudad || '',
    estado_id: cliente.estado_id?.toString() || '',
    codigo_postal: cliente.codigo_postal || '',
    pais_id: cliente.pais_id?.toString() || '1',
    notas_medicas: cliente.alergias || '',
    telegram_chat_id: cliente.telegram_chat_id || '',
    whatsapp_phone: cliente.whatsapp_phone || '',
    profesional_preferido: cliente.profesional_preferido_id?.toString() || '',
    lista_precios_id: cliente.lista_precios_id?.toString() || '',
    marketing_permitido: cliente.marketing_permitido ?? true,
    activo: cliente.activo ?? true,
    foto_url: cliente.foto_url || '',
  };
}

/**
 * Transforma datos del formulario al formato del backend
 * Mapea campos del frontend a los nombres que espera la API
 * @param {Object} formData - Datos validados del formulario
 * @param {string} fotoUrl - URL de la foto (si se subio una nueva)
 * @returns {Object} Datos formateados para la API
 */
export function formDataToApi(formData, fotoUrl = null) {
  const data = {
    // Campos principales (mapeados a nombres del backend)
    nombre: formData.nombre_completo,
    telefono: formData.telefono,
    email: formData.email || undefined,
    fecha_nacimiento: formData.fecha_nacimiento || undefined,
    alergias: formData.notas_medicas || undefined,
    marketing_permitido: formData.marketing_permitido,
    activo: formData.activo,

    // Tipo y datos fiscales
    tipo: formData.tipo,
    rfc: formData.tipo === 'empresa' ? formData.rfc : undefined,
    razon_social: formData.tipo === 'empresa' ? formData.razon_social : undefined,

    // Direccion
    calle: formData.calle || undefined,
    colonia: formData.colonia || undefined,
    ciudad: formData.ciudad || undefined,
    estado_id: formData.estado_id || undefined,
    codigo_postal: formData.codigo_postal || undefined,
    pais_id: formData.pais_id || 1,

    // Canales digitales
    telegram_chat_id: formData.telegram_chat_id || undefined,
    whatsapp_phone: formData.whatsapp_phone || undefined,

    // Preferencias
    profesional_preferido_id: formData.profesional_preferido || undefined,
    lista_precios_id: formData.lista_precios_id,

    // Foto
    foto_url: fotoUrl || formData.foto_url || undefined,
  };

  // Eliminar campos undefined para que Joi no los rechace
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
}

export default clienteSchema;
