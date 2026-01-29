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
import {
  optionalString,
  requiredString,
  optionalDate,
} from '@/lib/validations';

// ==================== ENUMS REUTILIZABLES ====================

export const TIPOS_CLIENTE_VALUES = ['persona', 'empresa'];

// ==================== SCHEMA PRINCIPAL ====================

export const clienteSchema = z
  .object({
    // Tipo de cliente
    tipo: z.enum(TIPOS_CLIENTE_VALUES).default('persona'),

    // Informacion basica
    nombre_completo: requiredString('El nombre', 2, 150),
    telefono: z
      .string()
      .length(10, 'El teléfono debe tener exactamente 10 dígitos')
      .regex(/^[1-9]\d{9}$/, 'El teléfono no puede empezar con 0')
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
        { message: 'El email no es válido' }
      )
      .transform((val) => (val?.trim() ? val.trim() : undefined)),
    fecha_nacimiento: optionalDate(),

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
        { message: 'RFC inválido (formato: XAXX010101000)' }
      )
      .transform((val) => (val?.trim() ? val.trim().toUpperCase() : undefined)),
    razon_social: optionalString('Razón social', 0, 200),

    // Direccion estructurada
    calle: optionalString('Calle', 0, 300),
    colonia: optionalString('Colonia', 0, 150),
    ciudad: optionalString('Ciudad', 0, 100),
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
        { message: 'El código postal debe ser de 5 dígitos' }
      )
      .transform((val) => (val?.trim() ? val.trim() : undefined)),
    pais_id: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? parseInt(val, 10) : 1)), // Mexico por defecto

    // Notas medicas / alergias
    notas_medicas: optionalString('Notas médicas', 0, 2000),

    // Canales digitales
    telegram_chat_id: optionalString('Telegram Chat ID', 0, 50),
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
    foto_url: optionalString('URL de foto', 0, 500),

    // Configuración de Crédito/Fiado
    permite_credito: z.boolean().default(false),
    limite_credito: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => {
        if (!val || val === '') return undefined;
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      })
      .refine(
        (val) => val === undefined || (val >= 0 && val <= 9999999999.99),
        { message: 'El límite de crédito debe ser entre 0 y 9,999,999,999.99' }
      ),
    dias_credito: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => {
        if (!val || val === '') return undefined;
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      })
      .refine(
        (val) => val === undefined || (val >= 1 && val <= 365),
        { message: 'Los días de crédito deben ser entre 1 y 365' }
      ),
  })
  .superRefine((data, ctx) => {
    // Validacion condicional: RFC solo valido para empresas
    if (data.tipo === 'empresa' && data.rfc) {
      const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
      if (!rfcPattern.test(data.rfc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'RFC inválido para empresa',
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
  // Crédito/Fiado
  permite_credito: false,
  limite_credito: '',
  dias_credito: '',
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
    // Crédito/Fiado
    permite_credito: cliente.permite_credito ?? false,
    limite_credito: cliente.limite_credito?.toString() || '',
    dias_credito: cliente.dias_credito?.toString() || '',
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

    // Crédito/Fiado
    permite_credito: formData.permite_credito,
    limite_credito: formData.permite_credito ? formData.limite_credito : undefined,
    dias_credito: formData.permite_credito ? formData.dias_credito : undefined,
  };

  // Eliminar campos undefined para que Joi no los rechace
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
}

export default clienteSchema;
