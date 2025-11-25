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

  // 🔄 Migrado de ENUM string a ID integer (tabla tipos_profesional)
  tipo_profesional_id: z
    .number({
      required_error: 'Debes seleccionar un tipo de profesional',
      invalid_type_error: 'El tipo debe ser un número válido',
    })
    .int('Debe ser un número entero')
    .positive('Debes seleccionar un tipo de profesional'),

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
