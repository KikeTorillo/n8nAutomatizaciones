/**
 * Constantes de mensajes de validación reutilizables
 *
 * Ene 2026: Centraliza mensajes para consistencia en toda la app.
 * Usar con los helpers de validations.js o directamente en schemas Zod.
 *
 * @example
 * import { VALIDATION_MESSAGES as VM } from '@/lib/validationMessages';
 *
 * const schema = z.object({
 *   email: z.string().email(VM.INVALID_EMAIL),
 *   nombre: z.string().min(2, VM.MIN_LENGTH('Nombre', 2)),
 * });
 */

// ==================== MENSAJES GENÉRICOS ====================

export const VALIDATION_MESSAGES = {
  // Campos requeridos
  REQUIRED: (field) => `${field} es requerido`,
  REQUIRED_SELECT: (field) => `Selecciona ${field.toLowerCase()}`,

  // Longitud de texto
  MIN_LENGTH: (field, min) => `${field} debe tener al menos ${min} caracteres`,
  MAX_LENGTH: (field, max) => `${field} no puede exceder ${max} caracteres`,
  EXACT_LENGTH: (field, len) => `${field} debe tener exactamente ${len} caracteres`,

  // Números
  POSITIVE: (field) => `${field} debe ser positivo`,
  NON_NEGATIVE: (field) => `${field} no puede ser negativo`,
  MIN_VALUE: (field, min) => `${field} debe ser al menos ${min}`,
  MAX_VALUE: (field, max) => `${field} no puede exceder ${max}`,
  INTEGER: (field) => `${field} debe ser un número entero`,

  // Formatos específicos
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido (10 dígitos)',
  INVALID_RFC: 'RFC inválido',
  INVALID_URL: 'URL inválida',
  INVALID_TIME: 'Formato HH:mm inválido',
  INVALID_DATE: 'Fecha inválida',
  INVALID_COLOR: 'Color hexadecimal inválido',

  // Arrays y selecciones
  MIN_ITEMS: (field, min) => `Selecciona al menos ${min} ${field.toLowerCase()}`,
  MAX_ITEMS: (field, max) => `Máximo ${max} ${field.toLowerCase()}`,

  // Comparaciones
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
  DISCOUNT_EXCEEDS_PRICE: 'El descuento no puede ser mayor al precio',
  END_BEFORE_START: 'La fecha de fin debe ser posterior a la de inicio',

  // Edad y fechas
  AGE_RANGE: (min, max) => `La edad debe estar entre ${min} y ${max} años`,

  // Específicos de dominio
  DUPLICATE_SKU: 'Ya existe un producto con ese SKU',
  DUPLICATE_EMAIL: 'Ya existe un usuario con ese email',
  INSUFFICIENT_STOCK: 'Stock insuficiente',
  INVALID_PERMISSION: 'No tienes permisos para esta acción',
};

// ==================== GRUPOS DE MENSAJES POR MÓDULO ====================

/**
 * Mensajes específicos para el módulo de inventario
 */
export const INVENTORY_MESSAGES = {
  SKU_REQUIRED: 'El SKU es requerido para productos con variantes',
  BARCODE_FORMAT: 'Código de barras debe tener entre 8 y 14 dígitos',
  STOCK_NEGATIVE: 'El stock no puede ser negativo',
  PRICE_REQUIRED: 'El precio de venta es requerido',
  COST_EXCEEDS_PRICE: 'El costo no debería exceder el precio de venta',
  MIN_STOCK_EXCEEDS_MAX: 'El stock mínimo no puede ser mayor al máximo',
};

/**
 * Mensajes específicos para el módulo de citas
 */
export const APPOINTMENT_MESSAGES = {
  DATE_REQUIRED: 'Selecciona una fecha para la cita',
  TIME_REQUIRED: 'Selecciona una hora de inicio',
  CLIENT_REQUIRED: 'Selecciona un cliente',
  SERVICE_REQUIRED: 'Selecciona al menos un servicio',
  DURATION_MIN: (min) => `La duración mínima es ${min} minutos`,
  DURATION_MAX: (max) => `La duración máxima es ${max} minutos`,
  TIME_SLOT_UNAVAILABLE: 'Este horario no está disponible',
  PROFESSIONAL_UNAVAILABLE: 'El profesional no está disponible en este horario',
};

/**
 * Mensajes específicos para el módulo de ventas/POS
 */
export const SALES_MESSAGES = {
  CART_EMPTY: 'El carrito está vacío',
  PAYMENT_REQUIRED: 'Selecciona un método de pago',
  AMOUNT_MISMATCH: 'El monto pagado no coincide con el total',
  INSUFFICIENT_CHANGE: 'El efectivo recibido es menor al total',
  COUPON_INVALID: 'El cupón no es válido',
  COUPON_EXPIRED: 'El cupón ha expirado',
};

/**
 * Mensajes específicos para autenticación
 */
export const AUTH_MESSAGES = {
  PASSWORD_MIN: 'La contraseña debe tener al menos 8 caracteres',
  PASSWORD_UPPERCASE: 'La contraseña debe contener al menos una mayúscula',
  PASSWORD_LOWERCASE: 'La contraseña debe contener al menos una minúscula',
  PASSWORD_NUMBER: 'La contraseña debe contener al menos un número',
  PASSWORD_POLICY: 'La contraseña debe contener: 1 mayúscula, 1 minúscula y 1 número',
  TERMS_REQUIRED: 'Debes aceptar los términos y condiciones',
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
  SESSION_EXPIRED: 'Tu sesión ha expirado, vuelve a iniciar sesión',
};

export default VALIDATION_MESSAGES;
