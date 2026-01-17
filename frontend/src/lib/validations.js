import { z } from 'zod';
import { PATTERNS } from './constants';

/**
 * Schemas de validación con Zod para el sistema
 */

// ==================== HELPERS ====================
const phoneRegex = PATTERNS.PHONE;
const emailRegex = PATTERNS.EMAIL;
const passwordRegex = PATTERNS.PASSWORD;

// ==================== PASO 1: INFORMACIÓN DEL NEGOCIO ====================
export const businessInfoSchema = z.object({
  nombre_comercial: z
    .string()
    .min(2, 'El nombre comercial debe tener al menos 2 caracteres')
    .max(100, 'El nombre comercial no puede superar 100 caracteres')
    .trim(),

  nombre_fiscal: z
    .string()
    .min(2, 'El nombre fiscal debe tener al menos 2 caracteres')
    .max(100, 'El nombre fiscal no puede superar 100 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  industria: z
    .string()
    .min(1, 'Debes seleccionar una industria'),

  // Ubicación normalizada (catálogo geográfico México)
  estado_id: z
    .string()
    .min(1, 'Debes seleccionar un estado'),

  ciudad_id: z
    .string()
    .min(1, 'Debes seleccionar una ciudad'),

  telefono_principal: z
    .string()
    .regex(phoneRegex, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)')
    .min(10, 'El teléfono debe tener 10 dígitos')
    .max(10, 'El teléfono debe tener 10 dígitos'),
});

// ==================== PASO 2: SELECCIÓN DE PLAN ====================
export const planSelectionSchema = z.object({
  plan_id: z
    .number()
    .int()
    .positive('Debes seleccionar un plan'),

  plan_nombre: z.string().optional(),
  plan_precio: z.number().optional(),
});

// ==================== HELPERS DE VALIDACIÓN ====================

/**
 * Schema reutilizable de contraseña (política unificada del sistema)
 *
 * POLÍTICA DE CONTRASEÑAS:
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula (A-Z)
 * - Al menos 1 minúscula (a-z)
 * - Al menos 1 número (0-9)
 * - Caracteres especiales: OPCIONALES
 *
 * Esta validación se usa en:
 * - Onboarding (Step 3 - Account Setup)
 * - Reset Password
 * - Cualquier cambio de contraseña
 */
const passwordValidation = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(50, 'La contraseña no puede superar 50 caracteres')
  .regex(
    passwordRegex,
    'La contraseña debe contener: 1 mayúscula, 1 minúscula y 1 número'
  );

// ==================== PASO 3: CREAR CUENTA ====================
export const accountSetupSchema = z.object({
  email: z
    .string()
    .email('El email debe tener un formato válido')
    .regex(emailRegex, 'El email debe tener un formato válido')
    .min(5, 'El email debe tener al menos 5 caracteres')
    .max(100, 'El email no puede superar 100 caracteres')
    .trim()
    .toLowerCase(),

  password: passwordValidation,

  password_confirm: z
    .string()
    .min(1, 'Debes confirmar la contraseña'),

  nombre_completo: z
    .string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(100, 'El nombre completo no puede superar 100 caracteres')
    .trim(),

  terminos: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones',
    }),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirm'],
});

// ==================== PASO 4: PROFESIONALES ====================
export const professionalSchema = z.object({
  nombre_completo: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .trim(),

  telefono: z
    .string()
    .regex(phoneRegex, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)')
    .length(10, 'El teléfono debe tener exactamente 10 dígitos')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('El email debe tener un formato válido')
    .optional()
    .or(z.literal('')),

  color_calendario: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'El color debe ser un código hexadecimal válido')
    .default('#3B82F6'),

  permite_walk_in: z
    .boolean()
    .default(true),
});

// Lista de profesionales (mínimo 1)
export const professionalsListSchema = z.object({
  professionals: z
    .array(professionalSchema)
    .min(1, 'Debes agregar al menos un profesional'),
});

// ==================== PASO 5: SERVICIOS ====================
export const serviceSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre del servicio debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .trim(),

  descripcion: z
    .string()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  categoria: z
    .string()
    .min(2, 'La categoría debe tener al menos 2 caracteres')
    .max(50, 'La categoría no puede superar 50 caracteres')
    .trim(),

  duracion_minutos: z
    .number()
    .int('La duración debe ser un número entero')
    .min(5, 'La duración mínima es 5 minutos')
    .max(480, 'La duración máxima es 480 minutos (8 horas)'),

  precio: z
    .union([z.number(), z.string()])
    .transform((val) => {
      // Convertir string vacío a 0, y strings numéricos a números
      if (val === '' || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    })
    .pipe(
      z.number()
        .min(0, 'El precio no puede ser negativo')
        .max(1000000000, 'El precio es demasiado alto')
    ),

  profesionales: z
    .array(z.number().int().positive())
    .optional()
    .default([]), // Profesionales opcionales - se pueden asignar después

  permite_walk_in: z
    .boolean()
    .default(true),

  activo: z
    .boolean()
    .default(true),
});

// Lista de servicios (mínimo 1)
export const servicesListSchema = z.object({
  services: z
    .array(serviceSchema)
    .min(1, 'Debes agregar al menos un servicio'),
});

// ==================== PASO 6: WHATSAPP ====================
// No requiere validación, solo mostrar QR

// ==================== LOGIN ====================
export const loginSchema = z.object({
  email: z
    .string()
    .email('El email debe tener un formato válido')
    .min(5, 'El email debe tener al menos 5 caracteres')
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

// ==================== RECUPERACIÓN DE CONTRASEÑA ====================

/**
 * Schema para solicitar recuperación de contraseña
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido')
    .trim()
    .toLowerCase(),
});

/**
 * Schema para restablecer contraseña
 * Usa la misma validación que el registro (passwordValidation definido arriba)
 */
export const resetPasswordSchema = z.object({
  passwordNueva: passwordValidation,

  confirmarPassword: z.string(),
}).refine((data) => data.passwordNueva === data.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});

// ==================== CLIENTES ====================
export const clienteSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres')
    .trim(),

  telefono: z
    .string()
    .regex(phoneRegex, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)')
    .length(10, 'El teléfono debe tener exactamente 10 dígitos'),

  email: z
    .string()
    .email('El email debe tener un formato válido')
    .max(150, 'El email no puede superar 150 caracteres')
    .optional()
    .or(z.literal('')),

  fecha_nacimiento: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      const fecha = new Date(val);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fecha.getFullYear();
      return edad >= 5 && edad <= 120;
    }, 'La edad debe estar entre 5 y 120 años'),

  direccion: z
    .string()
    .max(500, 'La dirección no puede superar 500 caracteres')
    .optional()
    .or(z.literal('')),

  notas_especiales: z
    .string()
    .max(1000, 'Las notas no pueden superar 1000 caracteres')
    .optional()
    .or(z.literal('')),

  alergias: z
    .string()
    .max(1000, 'Las alergias no pueden superar 1000 caracteres')
    .optional()
    .or(z.literal('')),

  como_conocio: z
    .string()
    .max(100, 'Este campo no puede superar 100 caracteres')
    .optional()
    .or(z.literal('')),

  marketing_permitido: z
    .boolean()
    .default(true),

  profesional_preferido_id: z
    .number()
    .int()
    .positive()
    .optional(),

  activo: z
    .boolean()
    .default(true),
});

// Schema simplificado para walk-in (cliente rápido)
export const clienteRapidoSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres')
    .trim(),

  telefono: z
    .string()
    .regex(phoneRegex, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)')
    .length(10, 'El teléfono debe tener exactamente 10 dígitos'),

  email: z
    .string()
    .email('El email debe tener un formato válido')
    .optional()
    .or(z.literal('')),
});

// ==================== HELPERS VALIDACIÓN ====================

/**
 * Valida un schema y retorna errores formateados
 * @param {z.ZodSchema} schema - Schema de Zod
 * @param {Object} data - Datos a validar
 * @returns {{ success: boolean, errors?: Object, data?: Object }}
 */
export const validateSchema = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Formatear errores para React Hook Form
    const errors = result.error.errors.reduce((acc, error) => {
      const path = error.path.join('.');
      acc[path] = error.message;
      return acc;
    }, {});

    return { success: false, errors };
  }

  return { success: true, data: result.data };
};

/**
 * Convierte errores de Zod a formato de React Hook Form
 * @param {z.ZodError} zodError
 * @returns {Object}
 */
export const zodErrorToFormErrors = (zodError) => {
  return zodError.errors.reduce((acc, error) => {
    const path = error.path.join('.');
    acc[path] = { type: 'manual', message: error.message };
    return acc;
  }, {});
};

// ==================== FIELD HELPERS (Ene 2026) ====================
// Helpers reutilizables para campos comunes en formularios

/**
 * String opcional que convierte "" a undefined
 * Útil para campos opcionales que Joi rechaza si vienen vacíos
 *
 * @param {string} label - Etiqueta del campo (para mensajes de error)
 * @param {number} min - Mínimo de caracteres (default: 0)
 * @param {number} max - Máximo de caracteres (default: 255)
 * @returns {z.ZodOptional}
 *
 * @example
 * const schema = z.object({
 *   descripcion: optionalString('Descripción', 0, 500),
 * });
 */
export const optionalString = (label = 'Campo', min = 0, max = 255) =>
  z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val?.trim() || undefined)
    .pipe(
      z.string()
        .min(min, min > 0 ? `${label} debe tener al menos ${min} caracteres` : undefined)
        .max(max, `${label} no puede exceder ${max} caracteres`)
        .optional()
    );

/**
 * String requerido con trim automático
 *
 * @param {string} label - Etiqueta del campo
 * @param {number} min - Mínimo de caracteres (default: 1)
 * @param {number} max - Máximo de caracteres (default: 255)
 * @returns {z.ZodString}
 *
 * @example
 * const schema = z.object({
 *   nombre: requiredString('Nombre', 2, 100),
 * });
 */
export const requiredString = (label = 'Campo', min = 1, max = 255) =>
  z.string({ required_error: `${label} es requerido` })
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} no puede exceder ${max} caracteres`)
    .transform(val => val.trim());

/**
 * Número opcional desde input HTML (maneja strings vacíos)
 * Convierte "", null, undefined a undefined
 *
 * @returns {z.ZodOptional}
 *
 * @example
 * const schema = z.object({
 *   cantidad_minima: optionalNumber(),
 * });
 */
export const optionalNumber = () =>
  z.preprocess(
    val => (val === '' || val === null || val === undefined) ? undefined : val,
    z.coerce.number().optional()
  );

/**
 * Número requerido positivo
 *
 * @param {string} label - Etiqueta del campo
 * @returns {z.ZodNumber}
 *
 * @example
 * const schema = z.object({
 *   precio: requiredPositiveNumber('Precio'),
 * });
 */
export const requiredPositiveNumber = (label = 'Campo') =>
  z.coerce.number({ required_error: `${label} es requerido` })
    .positive(`${label} debe ser positivo`);

/**
 * Número requerido no negativo (permite 0)
 *
 * @param {string} label - Etiqueta del campo
 * @returns {z.ZodNumber}
 */
export const requiredNonNegativeNumber = (label = 'Campo') =>
  z.coerce.number({ required_error: `${label} es requerido` })
    .min(0, `${label} no puede ser negativo`);

/**
 * Email opcional (convierte "" a undefined)
 *
 * @returns {z.ZodOptional}
 *
 * @example
 * const schema = z.object({
 *   email_secundario: optionalEmail(),
 * });
 */
export const optionalEmail = () =>
  z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val?.trim() || undefined)
    .pipe(z.string().email('Email inválido').optional());

/**
 * Fecha opcional (sin hora, formato YYYY-MM-DD)
 * Convierte "" a undefined y quita la parte de hora si existe
 *
 * @returns {z.ZodOptional}
 *
 * @example
 * const schema = z.object({
 *   fecha_nacimiento: optionalDate(),
 * });
 */
export const optionalDate = () =>
  z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val?.split('T')[0] || undefined);

/**
 * Fecha requerida (formato YYYY-MM-DD)
 *
 * @param {string} label - Etiqueta del campo
 * @returns {z.ZodString}
 */
export const requiredDate = (label = 'Fecha') =>
  z.string({ required_error: `${label} es requerida` })
    .min(1, `${label} es requerida`)
    .transform(val => val.split('T')[0]);

/**
 * ID numérico opcional (para selects de relaciones)
 * Convierte "", "0", null a undefined
 *
 * @returns {z.ZodOptional}
 *
 * @example
 * const schema = z.object({
 *   categoria_id: optionalId(),
 * });
 */
export const optionalId = () =>
  z.preprocess(
    val => (val === '' || val === '0' || val === 0 || val === null || val === undefined) ? undefined : val,
    z.coerce.number().int().positive().optional()
  );

/**
 * ID numérico requerido (para selects de relaciones)
 *
 * @param {string} label - Etiqueta del campo
 * @returns {z.ZodNumber}
 *
 * @example
 * const schema = z.object({
 *   categoria_id: requiredId('Categoría'),
 * });
 */
export const requiredId = (label = 'Campo') =>
  z.coerce.number({ required_error: `${label} es requerido` })
    .int(`${label} debe ser un número entero`)
    .positive(`${label} es requerido`);

/**
 * Boolean que acepta "true"/"false" strings (de checkboxes HTML)
 *
 * @param {boolean} defaultValue - Valor por defecto
 * @returns {z.ZodBoolean}
 */
export const booleanField = (defaultValue = false) =>
  z.preprocess(
    val => {
      if (val === 'true' || val === true || val === 1 || val === '1') return true;
      if (val === 'false' || val === false || val === 0 || val === '0') return false;
      return defaultValue;
    },
    z.boolean()
  );

/**
 * Array de IDs (para multi-selects)
 *
 * @param {boolean} optional - Si el array es opcional
 * @returns {z.ZodArray}
 *
 * @example
 * const schema = z.object({
 *   profesionales_ids: idsArray(true),
 * });
 */
export const idsArray = (optional = false) => {
  const schema = z.array(z.coerce.number().int().positive());
  return optional ? schema.optional().default([]) : schema.min(1, 'Selecciona al menos una opción');
};

/**
 * Precio (número con hasta 2 decimales, no negativo)
 *
 * @param {string} label - Etiqueta del campo
 * @param {boolean} required - Si es requerido
 * @returns {z.ZodNumber}
 */
export const priceField = (label = 'Precio', required = true) => {
  const schema = z.coerce.number()
    .min(0, `${label} no puede ser negativo`)
    .max(99999999.99, `${label} excede el límite`)
    .transform(val => Math.round(val * 100) / 100); // Redondear a 2 decimales

  return required
    ? schema.refine(val => val !== undefined && val !== null, { message: `${label} es requerido` })
    : schema.optional();
};

/**
 * Porcentaje (0-100)
 *
 * @param {string} label - Etiqueta del campo
 * @param {boolean} required - Si es requerido
 * @returns {z.ZodNumber}
 */
export const percentageField = (label = 'Porcentaje', required = true) => {
  const schema = z.coerce.number()
    .min(0, `${label} debe ser al menos 0%`)
    .max(100, `${label} no puede exceder 100%`);

  return required
    ? schema.refine(val => val !== undefined && val !== null, { message: `${label} es requerido` })
    : schema.optional();
};
