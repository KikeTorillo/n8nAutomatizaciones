/**
 * Campos Joi compartidos
 * Centraliza campos repetidos en 56+ schemas
 *
 * @module schemas/shared/common-fields
 *
 * @example
 * const { fields, toUpdateSchema, createBaseSchema } = require('../../schemas/shared');
 *
 * // Usar campos predefinidos
 * const crearSchema = Joi.object({
 *   nombre: fields.nombre.required(),
 *   descripcion: fields.descripcion,
 *   email: fields.email.required(),
 *   precio: fields.precio
 * });
 *
 * // Generar schema de actualización automáticamente
 * const actualizarSchema = toUpdateSchema(crearSchema);
 */

const Joi = require('joi');

// ======================
// CAMPOS DE TEXTO
// ======================

/**
 * Campo nombre estándar (2-150 caracteres)
 */
const nombre = Joi.string().trim().min(2).max(150);

/**
 * Campo descripción opcional (hasta 1000 caracteres)
 */
const descripcion = Joi.string().trim().max(1000).allow(null, '');

/**
 * Campo código/SKU (alfanumérico, 1-50 caracteres)
 */
const codigo = Joi.string().trim().max(50).pattern(/^[A-Za-z0-9_-]+$/);

/**
 * Campo referencia/código externo
 */
const referencia = Joi.string().trim().max(100).allow(null, '');

/**
 * Campo notas/observaciones (hasta 2000 caracteres)
 */
const notas = Joi.string().trim().max(2000).allow(null, '');

// ======================
// CAMPOS DE CONTACTO
// ======================

/**
 * Email con validación
 */
const email = Joi.string().email().lowercase().trim().max(150);

/**
 * Teléfono (10 dígitos, formato LATAM)
 */
const telefono = Joi.string().pattern(/^[1-9]\d{9}$/).messages({
  'string.pattern.base': 'El teléfono debe tener 10 dígitos'
});

/**
 * Teléfono con lada (+52, +57, +1)
 */
const telefonoConLada = Joi.string().pattern(/^\+?\d{10,15}$/).messages({
  'string.pattern.base': 'Formato de teléfono inválido'
});

/**
 * URL válida
 */
const url = Joi.string().uri().max(500).allow(null, '');

/**
 * RFC mexicano (persona física o moral)
 * Formato: 3-4 letras + 6 dígitos fecha + 3 caracteres homoclave
 * Ejemplos: XAXX010101000, XEXX010101000
 */
const rfc = Joi.string()
  .max(13)
  .pattern(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i)
  .uppercase()
  .allow(null, '')
  .messages({
    'string.pattern.base': 'RFC no válido (formato: XXXX000000XXX)'
  });

// ======================
// CAMPOS MONETARIOS
// ======================

/**
 * Precio/monto (>= 0, 2 decimales)
 */
const precio = Joi.number().min(0).precision(2);

/**
 * Porcentaje (0-100)
 */
const porcentaje = Joi.number().min(0).max(100).precision(2);

/**
 * Cantidad entera (>= 0)
 */
const cantidad = Joi.number().integer().min(0);

/**
 * Cantidad decimal (>= 0, 4 decimales para unidades de medida)
 */
const cantidadDecimal = Joi.number().min(0).precision(4);

// ======================
// CAMPOS DE FECHA
// ======================

/**
 * Fecha ISO (YYYY-MM-DD)
 */
const fecha = Joi.date().iso();

/**
 * Fecha-hora ISO
 */
const fechaHora = Joi.date().iso();

/**
 * Hora (HH:MM:SS o HH:MM)
 */
const hora = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).messages({
  'string.pattern.base': 'Formato de hora inválido (HH:MM o HH:MM:SS)'
});

// ======================
// CAMPOS BOOLEANOS
// ======================

/**
 * Campo activo (default: true)
 */
const activo = Joi.boolean().default(true);

/**
 * Campo booleano genérico
 */
const booleano = Joi.boolean();

// ======================
// CAMPOS DE ID
// ======================

/**
 * ID numérico positivo
 */
const id = Joi.number().integer().positive();

/**
 * UUID v4
 */
const uuid = Joi.string().uuid({ version: 'uuidv4' });

/**
 * Array de IDs numéricos
 */
const ids = Joi.array().items(Joi.number().integer().positive()).min(1).max(100);

// ======================
// CAMPOS DE COLOR/ICONO
// ======================

/**
 * Color hexadecimal (#RRGGBB)
 */
const colorHex = Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).messages({
  'string.pattern.base': 'El color debe estar en formato hexadecimal (#RRGGBB)'
});

/**
 * Nombre de icono (FontAwesome, Lucide, etc.)
 */
const icono = Joi.string().trim().max(100).allow(null, '');

// ======================
// CAMPOS DE ORDENAMIENTO
// ======================

/**
 * Orden/posición numérica
 */
const orden = Joi.number().integer().min(0);

// ======================
// CAMPOS DE METADATA
// ======================

/**
 * JSON genérico para metadata
 */
const metadata = Joi.object().allow(null);

/**
 * Tags/etiquetas (array de strings)
 */
const tags = Joi.array().items(Joi.string().trim().max(50)).max(20);

// ======================
// HELPERS
// ======================

/**
 * Convierte un schema de creación a schema de actualización
 * Hace todos los campos opcionales y requiere al menos uno
 *
 * @param {Joi.ObjectSchema} createSchema - Schema de creación
 * @returns {Joi.ObjectSchema} Schema de actualización
 *
 * @example
 * const crearSchema = Joi.object({
 *   nombre: fields.nombre.required(),
 *   descripcion: fields.descripcion
 * });
 *
 * const actualizarSchema = toUpdateSchema(crearSchema);
 * // Ahora nombre es opcional, pero debe haber al menos un campo
 */
const toUpdateSchema = (createSchema) => {
  const keys = Object.keys(createSchema.describe().keys);
  return createSchema
    .fork(keys, (schema) => schema.optional())
    .min(1)
    .messages({
      'object.min': 'Debe proporcionar al menos un campo para actualizar'
    });
};

/**
 * Crea un schema base con campos comunes (activo, metadata)
 *
 * @param {Object} fields - Campos específicos del schema
 * @returns {Joi.ObjectSchema}
 *
 * @example
 * const miSchema = createBaseSchema({
 *   nombre: fields.nombre.required(),
 *   precio: fields.precio
 * });
 * // Incluye automáticamente activo y metadata
 */
const createBaseSchema = (customFields) => {
  return Joi.object({
    ...customFields,
    activo: activo,
    metadata: metadata
  });
};

// Exportar campos agrupados
const fields = {
  // Texto
  nombre,
  descripcion,
  codigo,
  referencia,
  notas,

  // Contacto
  email,
  telefono,
  telefonoConLada,
  url,
  rfc,

  // Monetarios
  precio,
  porcentaje,
  cantidad,
  cantidadDecimal,

  // Fechas
  fecha,
  fechaHora,
  hora,

  // Booleanos
  activo,
  booleano,

  // IDs
  id,
  uuid,
  ids,

  // Visual
  colorHex,
  icono,
  orden,

  // Metadata
  metadata,
  tags
};

module.exports = {
  fields,
  toUpdateSchema,
  createBaseSchema,
  // Exportar también individualmente para destructuring directo
  ...fields
};
