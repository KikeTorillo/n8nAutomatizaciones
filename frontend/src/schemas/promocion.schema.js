import { z } from 'zod';

/**
 * Schemas de validación Zod para Promociones
 * Centralizado desde components/pos/promocion-form/ - Ene 2026
 */

/**
 * Helper para manejar campos numéricos opcionales (strings vacías → undefined)
 */
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.coerce.number().min(0).optional()
);

/**
 * Helper para manejar campos numéricos opcionales con min(1)
 */
const optionalNumberMin1 = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.coerce.number().min(1).optional()
);

/**
 * Tipos de promoción disponibles
 */
export const TIPOS_PROMOCION = {
  porcentaje: { label: 'Porcentaje', description: 'Descuento en porcentaje sobre el total' },
  monto_fijo: { label: 'Monto Fijo', description: 'Descuento de cantidad fija' },
  cantidad: { label: '2x1, 3x2...', description: 'Compra X y lleva Y gratis' },
  regalo: { label: 'Regalo', description: 'Producto gratis al cumplir condición' },
  precio_especial: { label: 'Precio Especial', description: 'Precio fijo para producto' },
};

/**
 * Días de la semana para restricciones
 */
export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

/**
 * Schema de validación Zod para CREAR promoción
 */
export const promocionCreateSchema = z.object({
  // Información básica
  codigo: z.string()
    .min(1, 'El código es requerido')
    .max(50, 'Máximo 50 caracteres')
    .transform(val => val.toUpperCase()),
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(200, 'Máximo 200 caracteres'),
  descripcion: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(500, 'Máximo 500 caracteres').optional()
  ),
  prioridad: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 0 : val),
    z.coerce.number().min(0, 'La prioridad debe ser positiva')
  ),

  // Tipo y valor
  tipo: z.enum(['porcentaje', 'monto_fijo', 'cantidad', 'regalo', 'precio_especial'], {
    required_error: 'Selecciona un tipo de promoción',
  }),
  valor_descuento: optionalNumber,

  // Reglas para tipo "cantidad" (2x1, 3x2, etc.)
  reglas: z.object({
    cantidad_requerida: optionalNumberMin1,
    cantidad_gratis: optionalNumberMin1,
    monto_minimo: optionalNumber,
    productos_ids: z.array(z.string()).optional(),
    categorias_ids: z.array(z.string()).optional(),
    clientes_ids: z.array(z.string()).optional(),
  }).optional(),

  // Vigencia
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  hora_inicio: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  hora_fin: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  dias_semana: z.array(z.number()).optional(),

  // Configuración avanzada
  exclusiva: z.boolean().default(false),
  acumulable_cupones: z.boolean().default(true),
  limite_uso_total: optionalNumberMin1,
  limite_uso_cliente: optionalNumberMin1,
  activo: z.boolean().default(true),
}).refine(
  (data) => {
    // Validar que tipo porcentaje/monto_fijo tenga valor_descuento
    if (['porcentaje', 'monto_fijo'].includes(data.tipo) && !data.valor_descuento) {
      return false;
    }
    return true;
  },
  {
    message: 'El valor del descuento es requerido para este tipo de promoción',
    path: ['valor_descuento'],
  }
).refine(
  (data) => {
    // Validar tipo cantidad tenga reglas
    if (data.tipo === 'cantidad') {
      return data.reglas?.cantidad_requerida && data.reglas?.cantidad_gratis;
    }
    return true;
  },
  {
    message: 'Debes especificar la cantidad requerida y gratis',
    path: ['reglas'],
  }
);

/**
 * Schema de validación Zod para EDITAR promoción
 */
export const promocionEditSchema = z.object({
  codigo: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(1).max(50).transform(val => val?.toUpperCase()).optional()
  ),
  nombre: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(1).max(200).optional()
  ),
  descripcion: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(500).optional()
  ),
  prioridad: optionalNumber,
  tipo: z.enum(['porcentaje', 'monto_fijo', 'cantidad', 'regalo', 'precio_especial']).optional(),
  valor_descuento: optionalNumber,
  reglas: z.object({
    cantidad_requerida: optionalNumberMin1,
    cantidad_gratis: optionalNumberMin1,
    monto_minimo: optionalNumber,
    productos_ids: z.array(z.string()).optional(),
    categorias_ids: z.array(z.string()).optional(),
    clientes_ids: z.array(z.string()).optional(),
  }).optional(),
  fecha_inicio: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  fecha_fin: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  hora_inicio: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  hora_fin: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  dias_semana: z.array(z.number()).optional(),
  exclusiva: z.boolean().optional(),
  acumulable_cupones: z.boolean().optional(),
  limite_uso_total: optionalNumberMin1,
  limite_uso_cliente: optionalNumberMin1,
  activo: z.boolean().optional(),
});

/**
 * Valores por defecto para crear promoción
 */
export const promocionDefaultValues = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo: 'porcentaje',
  valor_descuento: '',
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: '',
  hora_inicio: '',
  hora_fin: '',
  dias_semana: [],
  prioridad: 0,
  exclusiva: false,
  acumulable_cupones: true,
  limite_uso_total: '',
  limite_uso_cliente: '',
  activo: true,
  reglas: {
    cantidad_requerida: '',
    cantidad_gratis: '',
    monto_minimo: '',
    productos_ids: [],
    categorias_ids: [],
    clientes_ids: [],
  },
};

/**
 * Genera valores por defecto para editar promoción
 */
export const getPromocionEditValues = (promocion) => {
  const reglas = promocion.reglas || {};
  return {
    codigo: promocion.codigo || '',
    nombre: promocion.nombre || '',
    descripcion: promocion.descripcion || '',
    tipo: promocion.tipo || 'porcentaje',
    valor_descuento: promocion.valor_descuento?.toString() || '',
    fecha_inicio: promocion.fecha_inicio?.split('T')[0] || '',
    fecha_fin: promocion.fecha_fin?.split('T')[0] || '',
    hora_inicio: promocion.hora_inicio || '',
    hora_fin: promocion.hora_fin || '',
    dias_semana: promocion.dias_semana || [],
    prioridad: promocion.prioridad ?? 0,
    exclusiva: promocion.exclusiva || false,
    acumulable_cupones: promocion.acumulable_cupones ?? true,
    limite_uso_total: promocion.limite_uso_total?.toString() || '',
    limite_uso_cliente: promocion.limite_uso_cliente?.toString() || '',
    activo: promocion.activo ?? true,
    reglas: {
      cantidad_requerida: reglas.cantidad_requerida?.toString() || '',
      cantidad_gratis: reglas.cantidad_gratis?.toString() || '',
      monto_minimo: reglas.monto_minimo?.toString() || '',
      productos_ids: reglas.productos_ids || [],
      categorias_ids: reglas.categorias_ids || [],
      clientes_ids: reglas.clientes_ids || [],
    },
  };
};

/**
 * Transforma los datos del formulario al formato esperado por la API
 */
export const transformPromocionToPayload = (data, sucursalId) => {
  // Construir reglas según tipo
  const reglas = {};
  if (data.tipo === 'cantidad') {
    reglas.cantidad_requerida = parseInt(data.reglas?.cantidad_requerida) || 2;
    reglas.cantidad_gratis = parseInt(data.reglas?.cantidad_gratis) || 1;
  }
  if (data.reglas?.monto_minimo) {
    reglas.monto_minimo = parseFloat(data.reglas.monto_minimo);
  }
  if (data.reglas?.productos_ids?.length > 0) {
    reglas.productos_ids = data.reglas.productos_ids;
  }
  if (data.reglas?.categorias_ids?.length > 0) {
    reglas.categorias_ids = data.reglas.categorias_ids;
  }

  return {
    codigo: data.codigo.trim().toUpperCase(),
    nombre: data.nombre.trim(),
    descripcion: data.descripcion?.trim() || undefined,
    tipo: data.tipo,
    valor_descuento: data.valor_descuento ? parseFloat(data.valor_descuento) : undefined,
    reglas: Object.keys(reglas).length > 0 ? reglas : undefined,
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin || undefined,
    hora_inicio: data.hora_inicio || undefined,
    hora_fin: data.hora_fin || undefined,
    dias_semana: data.dias_semana?.length > 0 ? data.dias_semana : undefined,
    prioridad: parseInt(data.prioridad) || 0,
    exclusiva: data.exclusiva,
    acumulable_cupones: data.acumulable_cupones,
    limite_uso_total: data.limite_uso_total ? parseInt(data.limite_uso_total) : undefined,
    limite_uso_cliente: data.limite_uso_cliente ? parseInt(data.limite_uso_cliente) : undefined,
    activo: data.activo,
    sucursal_id: sucursalId,
  };
};

// Re-exports para compatibilidad
export const defaultValuesCreate = promocionDefaultValues;
export const getDefaultValuesEdit = getPromocionEditValues;
export const transformFormToPayload = transformPromocionToPayload;
