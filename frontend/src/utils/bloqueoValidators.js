import { z } from 'zod';
import { parseISO, isBefore, isEqual } from 'date-fns';

/**
 * Schema de validación para formulario de bloqueos
 */
export const bloqueoFormSchema = z
  .object({
    // Campos requeridos
    titulo: z
      .string()
      .min(1, 'El título es requerido')
      .min(3, 'El título debe tener al menos 3 caracteres')
      .max(200, 'El título no puede superar los 200 caracteres')
      .trim(),

    tipo_bloqueo_id: z
      .number({
        required_error: 'Debe seleccionar un tipo de bloqueo',
        invalid_type_error: 'El tipo de bloqueo debe ser un número',
      })
      .int('El tipo de bloqueo debe ser un número entero')
      .positive('Debe seleccionar un tipo de bloqueo válido'),

    fecha_inicio: z
      .string()
      .min(1, 'La fecha de inicio es requerida')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),

    fecha_fin: z
      .string()
      .min(1, 'La fecha de fin es requerida')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),

    // Campos opcionales
    descripcion: z.string().max(1000, 'La descripción no puede superar los 1000 caracteres').optional(),

    hora_inicio: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)')
      .optional()
      .or(z.literal('')),

    hora_fin: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)')
      .optional()
      .or(z.literal('')),

    profesional_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un número positivo')
      .optional()
      .nullable(),

    es_recurrente: z.boolean().optional().default(false),

    patron_recurrencia: z
      .object({
        tipo: z.enum(['diario', 'semanal', 'mensual', 'anual']).optional(),
        intervalo: z.number().int().positive().optional(),
        dias_semana: z.array(z.number().int().min(0).max(6)).optional(),
        dia_mes: z.number().int().min(1).max(31).optional(),
        fecha_fin_recurrencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      })
      .optional()
      .nullable(),

    activo: z.boolean().optional().default(true),

    // Campo para modo de edición
    id: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    // Validación: fecha_fin debe ser >= fecha_inicio
    try {
      const fechaInicio = parseISO(data.fecha_inicio);
      const fechaFin = parseISO(data.fecha_fin);

      if (isBefore(fechaFin, fechaInicio)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
          path: ['fecha_fin'],
        });
      }

      // Validación: si es el mismo día y hay horas, hora_fin > hora_inicio
      if (isEqual(fechaInicio, fechaFin) && data.hora_inicio && data.hora_fin) {
        if (data.hora_inicio >= data.hora_fin) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La hora de fin debe ser posterior a la hora de inicio',
            path: ['hora_fin'],
          });
        }
      }

      // Validación: si hay hora_inicio, debe haber hora_fin y viceversa
      if ((data.hora_inicio && !data.hora_fin) || (!data.hora_inicio && data.hora_fin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe especificar tanto hora de inicio como hora de fin, o ninguna',
          path: ['hora_inicio'],
        });
      }

      // Validación: si es recurrente, debe tener patrón de recurrencia
      if (data.es_recurrente && !data.patron_recurrencia) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe especificar el patrón de recurrencia',
          path: ['patron_recurrencia'],
        });
      }

      // Validación: fecha no puede ser muy antigua (más de 1 año atrás)
      const unAnoAtras = new Date();
      unAnoAtras.setFullYear(unAnoAtras.getFullYear() - 1);

      if (isBefore(fechaInicio, unAnoAtras)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de inicio no puede ser anterior a un año atrás',
          path: ['fecha_inicio'],
        });
      }
    } catch {
      // Error de parsing de fechas ya manejado por el schema base
    }
  });

/**
 * Schema para validación de búsqueda de bloqueos solapados
 */
export const validarSolapamientoSchema = z.object({
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  hora_fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  profesional_id: z.number().optional().nullable(),
  excluir_id: z.number().optional(), // Para excluir el bloqueo actual en edición
});

/**
 * Valores por defecto para formulario nuevo
 */
export const bloqueoFormDefaults = {
  titulo: '',
  descripcion: '',
  tipo_bloqueo_id: null, // Se establece dinámicamente según tipos disponibles
  fecha_inicio: '',
  fecha_fin: '',
  hora_inicio: '',
  hora_fin: '',
  profesional_id: null,
  es_recurrente: false,
  patron_recurrencia: null,
  activo: true,
};

/**
 * Sanitizar datos del formulario antes de enviar al backend
 */
export const sanitizarDatosBloqueo = (data) => {
  const sanitized = {
    titulo: data.titulo.trim(),
    tipo_bloqueo_id: parseInt(data.tipo_bloqueo_id),
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin,
    activo: data.activo ?? true,
  };

  // Campos opcionales - solo incluir si tienen valor
  if (data.descripcion?.trim()) {
    sanitized.descripcion = data.descripcion.trim();
  }

  if (data.hora_inicio?.trim()) {
    sanitized.hora_inicio = data.hora_inicio.trim();
  }

  if (data.hora_fin?.trim()) {
    sanitized.hora_fin = data.hora_fin.trim();
  }

  if (data.profesional_id) {
    sanitized.profesional_id = parseInt(data.profesional_id);
  }

  if (data.es_recurrente && data.patron_recurrencia) {
    sanitized.es_recurrente = true;
    sanitized.patron_recurrencia = data.patron_recurrencia;
  }

  return sanitized;
};

/**
 * Preparar datos de bloqueo existente para el formulario
 */
export const prepararDatosParaEdicion = (bloqueo) => {
  return {
    id: bloqueo.id,
    titulo: bloqueo.titulo || '',
    descripcion: bloqueo.descripcion || '',
    tipo_bloqueo_id: bloqueo.tipo_bloqueo_id || null,
    fecha_inicio: bloqueo.fecha_inicio || '',
    fecha_fin: bloqueo.fecha_fin || '',
    hora_inicio: bloqueo.hora_inicio || '',
    hora_fin: bloqueo.hora_fin || '',
    profesional_id: bloqueo.profesional_id || null,
    es_recurrente: bloqueo.es_recurrente || false,
    patron_recurrencia: bloqueo.patron_recurrencia || null,
    activo: bloqueo.activo ?? true,
  };
};

export default {
  bloqueoFormSchema,
  validarSolapamientoSchema,
  bloqueoFormDefaults,
  sanitizarDatosBloqueo,
  prepararDatosParaEdicion,
};
