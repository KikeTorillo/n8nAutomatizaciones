import { z } from 'zod';

/**
 * Schema de validación Zod para eventos digitales
 * Usado en EventoFormPage con React Hook Form
 */

// ==================== CONSTANTES ====================
export const TIPOS_EVENTO = [
  { value: 'boda', label: 'Boda' },
  { value: 'xv_anos', label: 'XV Años' },
  { value: 'bautizo', label: 'Bautizo' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'otro', label: 'Otro' },
];

export const TIPOS_EVENTO_VALUES = TIPOS_EVENTO.map(t => t.value);

// ==================== SUB-SCHEMAS ====================

/**
 * Schema para configuración del evento (objeto anidado)
 */
const configuracionSchema = z.object({
  mensaje_confirmacion: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
});

// ==================== SCHEMA PRINCIPAL ====================

/**
 * Schema completo para crear/editar evento
 */
export const eventoSchema = z.object({
  // Información básica
  nombre: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres')
    .transform(val => val.trim()),

  tipo: z.enum(TIPOS_EVENTO_VALUES, {
    required_error: 'Selecciona un tipo de evento',
    invalid_type_error: 'Tipo de evento inválido',
  }),

  descripcion: z
    .string()
    .max(2000, 'La descripción no puede superar 2000 caracteres')
    .optional()
    .or(z.literal(''))
    .transform(val => val?.trim() || ''),

  // Fechas
  fecha_evento: z
    .string({ required_error: 'La fecha del evento es requerida' })
    .min(1, 'La fecha del evento es requerida'),

  hora_evento: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform(val => val?.substring(0, 5) || ''),

  fecha_limite_rsvp: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform(val => val?.split('T')[0] || ''),

  // Plantilla
  plantilla_id: z.preprocess(
    val => (val === '' || val === null || val === undefined || val === 0) ? undefined : val,
    z.coerce.number().int().positive().optional()
  ),

  // Imágenes
  portada_url: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform(val => val || null),

  galeria_urls: z
    .array(z.string().url('URL de imagen inválida'))
    .max(10, 'Máximo 10 imágenes en la galería')
    .default([]),

  // Configuración anidada
  configuracion: configuracionSchema.default({}),
});

// ==================== VALORES POR DEFECTO ====================

/**
 * Valores por defecto para crear nuevo evento
 */
export const eventoDefaults = {
  nombre: '',
  tipo: 'boda',
  descripcion: '',
  fecha_evento: '',
  hora_evento: '',
  fecha_limite_rsvp: '',
  plantilla_id: '',
  portada_url: '',
  galeria_urls: [],
  configuracion: {
    mensaje_confirmacion: '',
  },
};

// ==================== TRANSFORMADORES ====================

/**
 * Transforma datos de la API a formato del formulario
 * @param {Object} evento - Evento desde la API
 * @returns {Object} - Datos formateados para el formulario
 */
export const eventoToFormData = (evento) => {
  if (!evento) return eventoDefaults;

  return {
    nombre: evento.nombre || '',
    tipo: evento.tipo || 'boda',
    descripcion: evento.descripcion || '',
    fecha_evento: evento.fecha_evento ? evento.fecha_evento.split('T')[0] : '',
    hora_evento: evento.hora_evento ? evento.hora_evento.substring(0, 5) : '',
    fecha_limite_rsvp: evento.fecha_limite_rsvp ? evento.fecha_limite_rsvp.split('T')[0] : '',
    plantilla_id: evento.plantilla_id || '',
    portada_url: evento.portada_url || '',
    galeria_urls: evento.galeria_urls || [],
    configuracion: {
      mensaje_confirmacion: evento.configuracion?.mensaje_confirmacion || '',
    },
  };
};

/**
 * Transforma datos del formulario a formato de la API
 * @param {Object} formData - Datos del formulario validados
 * @returns {Object} - Payload para la API
 */
export const formDataToApi = (formData) => {
  return {
    nombre: formData.nombre.trim(),
    tipo: formData.tipo,
    descripcion: formData.descripcion?.trim() || undefined,
    fecha_evento: formData.fecha_evento,
    hora_evento: formData.hora_evento ? formData.hora_evento.substring(0, 5) : undefined,
    fecha_limite_rsvp: formData.fecha_limite_rsvp || undefined,
    plantilla_id: formData.plantilla_id ? parseInt(formData.plantilla_id) : undefined,
    portada_url: formData.portada_url || null,
    galeria_urls: formData.galeria_urls || [],
    configuracion: {
      mensaje_confirmacion: formData.configuracion.mensaje_confirmacion?.trim() || undefined,
    },
  };
};

/**
 * Alias para compatibilidad con otros schemas
 */
export const getEventoEditValues = eventoToFormData;
export const transformEventoToPayload = formDataToApi;
