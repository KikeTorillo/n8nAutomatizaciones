/**
 * ====================================================================
 * CITA SCHEMAS - Validación Zod para formularios de citas
 * ====================================================================
 * Ene 2026: Centralizado desde CitaFormDrawer.jsx
 */
import { z } from 'zod';
import { aFormatoISO } from '@/utils/dateHelpers';

// ========== CONSTANTES ==========

export const DURACION_MINIMA = 10; // minutos
export const DURACION_MAXIMA = 480; // 8 horas
export const MAX_SERVICIOS_POR_CITA = 10;
export const MAX_CARACTERES_NOTAS = 500;

// Regex para formato de hora HH:mm
const HORA_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// ========== SCHEMAS BASE ==========

/**
 * Schema base con campos comunes entre crear y editar
 */
const citaBaseFields = {
  cliente_id: z.string().min(1, 'Debes seleccionar un cliente'),
  profesional_id: z.string().optional(),
  servicios_ids: z
    .array(z.string())
    .min(1, 'Debes seleccionar al menos un servicio')
    .max(MAX_SERVICIOS_POR_CITA, `Máximo ${MAX_SERVICIOS_POR_CITA} servicios por cita`),
  fecha_cita: z.string().min(1, 'La fecha es requerida'),
  hora_inicio: z
    .string()
    .min(1, 'La hora de inicio es requerida')
    .regex(HORA_REGEX, 'Formato de hora inválido (HH:mm)'),
  duracion_minutos: z.coerce
    .number()
    .min(DURACION_MINIMA, `Duración mínima: ${DURACION_MINIMA} minutos`)
    .max(DURACION_MAXIMA, `Duración máxima: ${DURACION_MAXIMA / 60} horas`),
  precio_servicio: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  descuento: z.coerce.number().min(0, 'El descuento no puede ser negativo').default(0),
  notas_cliente: z.string().max(MAX_CARACTERES_NOTAS, `Máximo ${MAX_CARACTERES_NOTAS} caracteres`).optional(),
  notas_internas: z.string().max(MAX_CARACTERES_NOTAS, `Máximo ${MAX_CARACTERES_NOTAS} caracteres`).optional(),
};

// ========== REFINEMENTS ==========

/**
 * Valida que el descuento no sea mayor al precio
 */
const validateDescuento = (data, ctx) => {
  if (data.descuento > data.precio_servicio) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El descuento no puede ser mayor al precio del servicio',
      path: ['descuento'],
    });
  }
};

/**
 * Valida que la fecha no sea en el pasado
 */
const validateFechaFutura = (data, ctx) => {
  if (data.fecha_cita) {
    const hoyStr = aFormatoISO(new Date());
    if (data.fecha_cita < hoyStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha no puede ser en el pasado',
        path: ['fecha_cita'],
      });
    }
  }
};

/**
 * Valida que la cita no termine después de las 23:59
 */
const validateHoraFin = (data, ctx) => {
  if (data.hora_inicio && data.duracion_minutos) {
    const [horas, minutos] = data.hora_inicio.split(':').map(Number);
    const minutosTotal = horas * 60 + minutos + data.duracion_minutos;
    if (minutosTotal > 24 * 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La cita no puede terminar después de las 23:59',
        path: ['duracion_minutos'],
      });
    }
  }
};

// ========== SCHEMA CREAR ==========

/**
 * Schema de validación Zod para CREAR cita
 * NOTA: profesional_id es opcional cuando Round-Robin está habilitado
 */
export const citaCreateSchema = z
  .object(citaBaseFields)
  .superRefine((data, ctx) => {
    validateDescuento(data, ctx);
    validateFechaFutura(data, ctx);
    validateHoraFin(data, ctx);
  });

// ========== SCHEMA EDITAR ==========

/**
 * Schema de validación Zod para EDITAR cita
 * Todos los campos son opcionales pero al menos uno debe ser modificado
 */
export const citaEditSchema = z
  .object({
    cliente_id: z.string().optional(),
    profesional_id: z.string().optional(),
    servicios_ids: z
      .array(z.string())
      .min(1, 'Debes seleccionar al menos un servicio')
      .max(MAX_SERVICIOS_POR_CITA, `Máximo ${MAX_SERVICIOS_POR_CITA} servicios por cita`)
      .optional(),
    fecha_cita: z.string().optional(),
    hora_inicio: z.string().regex(HORA_REGEX, 'Formato de hora inválido (HH:mm)').optional(),
    duracion_minutos: z.coerce
      .number()
      .min(DURACION_MINIMA, `Duración mínima: ${DURACION_MINIMA} minutos`)
      .max(DURACION_MAXIMA, `Duración máxima: ${DURACION_MAXIMA / 60} horas`)
      .optional(),
    precio_servicio: z.coerce.number().min(0, 'El precio no puede ser negativo').optional(),
    descuento: z.coerce.number().min(0, 'El descuento no puede ser negativo').optional(),
    notas_cliente: z.string().max(MAX_CARACTERES_NOTAS, `Máximo ${MAX_CARACTERES_NOTAS} caracteres`).optional(),
    notas_internas: z.string().max(MAX_CARACTERES_NOTAS, `Máximo ${MAX_CARACTERES_NOTAS} caracteres`).optional(),
  })
  .refine((data) => Object.keys(data).some((key) => data[key] !== undefined && data[key] !== ''), {
    message: 'Debes modificar al menos un campo',
  })
  .superRefine((data, ctx) => {
    validateHoraFin(data, ctx);
  });

// ========== DEFAULT VALUES ==========

/**
 * Valores por defecto para crear cita
 */
export const citaDefaultValues = {
  cliente_id: '',
  profesional_id: '',
  servicios_ids: [],
  fecha_cita: aFormatoISO(new Date()),
  hora_inicio: '',
  duracion_minutos: 60,
  precio_servicio: 0,
  descuento: 0,
  notas_cliente: '',
  notas_internas: '',
};

/**
 * Genera valores para editar una cita existente
 * @param {Object} cita - Cita a editar
 * @returns {Object} Valores para el formulario
 */
export const getCitaEditValues = (cita) => {
  if (!cita) return citaDefaultValues;

  return {
    cliente_id: cita.cliente_id?.toString() || '',
    profesional_id: cita.profesional_id?.toString() || '',
    servicios_ids: cita.servicios?.map((s) => s.servicio_id?.toString() || s.id?.toString()) || [],
    fecha_cita: cita.fecha_cita || '',
    hora_inicio: cita.hora_inicio?.slice(0, 5) || '',
    duracion_minutos: cita.duracion_minutos || 60,
    precio_servicio: cita.precio_total || cita.precio_servicio || 0,
    descuento: cita.descuento || 0,
    notas_cliente: cita.notas_cliente || '',
    notas_internas: cita.notas_internas || '',
  };
};

// ========== UTILIDADES ==========

/**
 * Transforma los datos del formulario al formato esperado por la API
 * @param {Object} formData - Datos del formulario
 * @param {boolean} isEdit - Si es edición
 * @returns {Object} Payload para la API
 */
export const transformCitaToPayload = (formData, isEdit = false) => {
  const payload = {
    cliente_id: formData.cliente_id ? parseInt(formData.cliente_id, 10) : undefined,
    profesional_id: formData.profesional_id ? parseInt(formData.profesional_id, 10) : undefined,
    servicios_ids: formData.servicios_ids?.map((id) => parseInt(id, 10)) || [],
    fecha_cita: formData.fecha_cita || undefined,
    hora_inicio: formData.hora_inicio || undefined,
    duracion_minutos: formData.duracion_minutos || undefined,
    precio_servicio: formData.precio_servicio || undefined,
    descuento: formData.descuento || 0,
    notas_cliente: formData.notas_cliente?.trim() || undefined,
    notas_internas: formData.notas_internas?.trim() || undefined,
  };

  // En edición, eliminar campos undefined
  if (isEdit) {
    return Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );
  }

  return payload;
};

/**
 * Calcula la hora de fin basada en hora inicio y duración
 * @param {string} horaInicio - Hora de inicio (HH:mm)
 * @param {number} duracionMinutos - Duración en minutos
 * @returns {string} Hora de fin (HH:mm)
 */
export const calcularHoraFin = (horaInicio, duracionMinutos) => {
  if (!horaInicio || !duracionMinutos) return '';

  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + duracionMinutos;

  const horasFin = Math.floor(totalMinutos / 60) % 24;
  const minutosFin = totalMinutos % 60;

  return `${horasFin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`;
};
