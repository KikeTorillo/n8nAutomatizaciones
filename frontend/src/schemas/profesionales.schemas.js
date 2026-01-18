/**
 * ====================================================================
 * SCHEMAS ZOD - Modulo Profesionales
 * ====================================================================
 *
 * Schemas de validacion para los Drawers del modulo de profesionales.
 * Migrado de useState + validacion manual a React Hook Form + Zod.
 *
 * Enero 2026
 */
import { z } from 'zod';
import {
  optionalString,
  requiredString,
  optionalDate,
  requiredDate,
} from '@/lib/validations';

// ==================== ENUMS REUTILIZABLES ====================

export const NIVELES_EDUCACION_VALUES = [
  'basica',
  'intermedia',
  'preparatoria',
  'tecnica',
  'licenciatura',
  'especialidad',
  'maestria',
  'doctorado',
];

export const TIPOS_EMPLEO_VALUES = [
  'tiempo_completo',
  'medio_tiempo',
  'freelance',
  'contrato',
  'practicas',
  'voluntariado',
];

export const NIVELES_HABILIDAD_VALUES = [
  'basico',
  'intermedio',
  'avanzado',
  'experto',
];

export const CATEGORIAS_HABILIDAD_VALUES = [
  'tecnica',
  'blanda',
  'idioma',
  'software',
  'certificacion',
  'otro',
];

export const TIPOS_CUENTA_BANCARIA_VALUES = [
  'debito',
  'ahorro',
  'nomina',
  'credito',
];

export const USOS_CUENTA_VALUES = [
  'nomina',
  'reembolsos',
  'comisiones',
  'todos',
];

export const MONEDAS_VALUES = ['MXN', 'USD', 'COP', 'EUR'];

export const TIPOS_DOCUMENTO_VALUES = [
  'identificacion',
  'pasaporte',
  'licencia_conducir',
  'contrato',
  'visa',
  'certificado',
  'seguro_social',
  'comprobante_domicilio',
  'carta_recomendacion',
  'acta_nacimiento',
  'curp',
  'rfc',
  'titulo_profesional',
  'cedula_profesional',
  'otro',
];

// ==================== 1. EDUCACION FORMAL ====================

export const educacionSchema = z
  .object({
    institucion: requiredString('La institución', 2, 200),
    titulo: requiredString('El título', 2, 200),
    nivel: z.enum(NIVELES_EDUCACION_VALUES, {
      errorMap: () => ({ message: 'Selecciona un nivel de educación' }),
    }),
    campo_estudio: optionalString('Campo de estudio', 0, 150),
    fecha_inicio: requiredDate('Fecha de inicio'),
    fecha_fin: optionalDate(),
    en_curso: z.boolean().default(false),
    promedio: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          const num = parseFloat(val);
          return !isNaN(num) && num >= 0 && num <= 10;
        },
        { message: 'El promedio debe estar entre 0 y 10' }
      )
      .transform((val) => (val?.trim() ? val.trim() : null)),
    descripcion: optionalString('Descripción', 0, 1000),
    ubicacion: optionalString('Ubicación', 0, 200),
  })
  .superRefine((data, ctx) => {
    // Validacion condicional: si en_curso, fecha_fin debe ser null/vacio
    if (data.en_curso && data.fecha_fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'No se puede especificar fecha de fin si está en curso',
        path: ['fecha_fin'],
      });
    }
    // Validacion cruzada: fecha_fin >= fecha_inicio
    if (data.fecha_inicio && data.fecha_fin && !data.en_curso) {
      if (new Date(data.fecha_fin) < new Date(data.fecha_inicio)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de fin debe ser posterior a la de inicio',
          path: ['fecha_fin'],
        });
      }
    }
  });

// ==================== 2. EXPERIENCIA LABORAL ====================

export const experienciaSchema = z
  .object({
    empresa: requiredString('La empresa', 2, 200),
    puesto: requiredString('El puesto', 2, 150),
    tipo_empleo: z.enum(TIPOS_EMPLEO_VALUES).default('tiempo_completo'),
    fecha_inicio: requiredDate('Fecha de inicio'),
    fecha_fin: optionalDate(),
    empleo_actual: z.boolean().default(false),
    descripcion: optionalString('Descripción', 0, 2000),
    ubicacion: optionalString('Ubicación', 0, 200),
    sector_industria: optionalString('Sector/Industria', 0, 100),
  })
  .superRefine((data, ctx) => {
    // Validacion: si NO es empleo_actual, fecha_fin es requerida
    if (!data.empleo_actual && !data.fecha_fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Especifica fecha de fin o marca como empleo actual',
        path: ['fecha_fin'],
      });
    }
    // Si empleo_actual, fecha_fin debe ser null
    if (data.empleo_actual && data.fecha_fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'No se puede especificar fecha de fin si es empleo actual',
        path: ['fecha_fin'],
      });
    }
    // Validacion cruzada fechas
    if (data.fecha_inicio && data.fecha_fin && !data.empleo_actual) {
      if (new Date(data.fecha_fin) < new Date(data.fecha_inicio)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de fin debe ser posterior a la de inicio',
          path: ['fecha_fin'],
        });
      }
    }
  });

// ==================== 3. HABILIDAD EMPLEADO ====================

/**
 * Schema para asignar/editar habilidad de empleado
 * Nota: habilidad_id solo es requerido en CREATE, no en UPDATE
 */
export const habilidadEmpleadoSchema = z.object({
  habilidad_id: z
    .number({
      required_error: 'Selecciona una habilidad del catálogo',
      invalid_type_error: 'Selecciona una habilidad del catálogo',
    })
    .positive('Selecciona una habilidad')
    .nullable()
    .optional(),
  nivel: z.enum(NIVELES_HABILIDAD_VALUES).default('basico'),
  anios_experiencia: z.coerce.number().min(0).max(70).default(0),
  notas: optionalString('Notas', 0, 500),
  certificaciones: optionalString('Certificaciones', 0, 1000),
});

/**
 * Schema para crear habilidad en el catalogo (formulario secundario)
 */
export const nuevaHabilidadCatalogoSchema = z.object({
  nombre: requiredString('Nombre', 2, 100),
  categoria: z.enum(CATEGORIAS_HABILIDAD_VALUES).default('tecnica'),
  descripcion: optionalString('Descripción', 0, 500),
});

// ==================== 4. CUENTA BANCARIA ====================

export const cuentaBancariaSchema = z.object({
  banco: requiredString('El banco', 2, 100),
  numero_cuenta: z
    .string()
    .min(4, 'El número de cuenta debe tener al menos 4 caracteres')
    .max(50, 'El número de cuenta no puede superar 50 caracteres')
    .transform((val) => val.trim()),
  clabe: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val === '') return true;
        return /^[0-9]{18}$/.test(val);
      },
      { message: 'La CLABE debe tener exactamente 18 dígitos numéricos' }
    )
    .transform((val) => (val?.trim() ? val.trim() : null)),
  tipo_cuenta: z.enum(TIPOS_CUENTA_BANCARIA_VALUES).default('debito'),
  moneda: z.enum(MONEDAS_VALUES).default('MXN'),
  uso: z.enum(USOS_CUENTA_VALUES).default('nomina'),
  titular_nombre: optionalString('Nombre del titular', 0, 150),
  titular_documento: optionalString('Documento del titular', 0, 30),
  es_principal: z.boolean().default(false),
});

// ==================== 5. DOCUMENTO EMPLEADO ====================

/**
 * Tipos MIME aceptados para documentos
 */
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Tamanio maximo de archivo: 25MB
 */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Schema para metadata del documento (sin el archivo)
 */
export const documentoMetadataSchema = z
  .object({
    tipo_documento: z.enum(TIPOS_DOCUMENTO_VALUES, {
      errorMap: () => ({ message: 'Selecciona un tipo de documento' }),
    }),
    nombre: z
      .string()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(150, 'El nombre no puede superar 150 caracteres')
      .transform((val) => val.trim()),
    descripcion: optionalString('Descripción', 0, 500),
    numero_documento: optionalString('Número de documento', 0, 100),
    fecha_emision: optionalDate(),
    fecha_vencimiento: optionalDate(),
  })
  .superRefine((data, ctx) => {
    // Validacion: fecha_vencimiento > fecha_emision
    if (data.fecha_emision && data.fecha_vencimiento) {
      if (new Date(data.fecha_vencimiento) < new Date(data.fecha_emision)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de vencimiento debe ser posterior a la emisión',
          path: ['fecha_vencimiento'],
        });
      }
    }
  });

/**
 * Validacion de archivo (separada porque File no es serializable en Zod)
 * @param {File|null} file - Archivo a validar
 * @returns {string[]} Array de mensajes de error (vacio si es valido)
 */
export function validateFile(file) {
  const errors = [];

  if (!file) {
    return errors; // Archivo es opcional en algunos casos
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push('El archivo excede el tamaño máximo (25MB)');
  }

  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    errors.push('Tipo de archivo no permitido. Use PDF o imagenes.');
  }

  return errors;
}

// ==================== UTILIDADES ====================

/**
 * Sanitiza valores antes de enviar a la API
 * Convierte strings vacios y nulls a undefined para que Joi no los rechace
 * @param {Object} data - Datos del formulario
 * @returns {Object} Datos sanitizados
 */
export function sanitizeFormData(data) {
  const sanitized = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === '' || value === null) {
      sanitized[key] = undefined;
    } else if (typeof value === 'string') {
      sanitized[key] = value.trim() || undefined;
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}
