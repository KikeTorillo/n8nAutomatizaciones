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
 * Campo nombre corto (1-100 caracteres)
 */
const nombreCorto = Joi.string().trim().min(1).max(100);

/**
 * Campo nombre medio (2-150 caracteres)
 */
const nombreMedio = Joi.string().trim().min(2).max(150);

/**
 * Campo nombre largo (2-200 caracteres)
 */
const nombreLargo = Joi.string().trim().min(2).max(200);

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

/**
 * Descripci\u00f3n larga para textos extensos (hasta 2000 caracteres)
 * Ideal para descripciones detalladas de productos, servicios, etc.
 */
const descripcionLarga = Joi.string().trim().max(2000).allow(null, '');

/**
 * SKU (Stock Keeping Unit) - C\u00f3digo de producto
 * Alfanum\u00e9rico con guiones bajos y medios, hasta 50 caracteres
 */
const sku = Joi.string().trim().max(50).pattern(/^[A-Za-z0-9_-]+$/).messages({
  'string.pattern.base': 'SKU debe ser alfanum\u00e9rico (letras, n\u00fameros, guiones)'
});

/**
 * C\u00f3digo de barras (EAN-8, EAN-13, UPC-A)
 * Entre 8 y 14 d\u00edgitos
 */
const codigoBarras = Joi.string().trim().max(20).pattern(/^[0-9]{8,14}$/).allow(null, '').messages({
  'string.pattern.base': 'C\u00f3digo de barras debe tener entre 8 y 14 d\u00edgitos'
});

/**
 * Slug URL-friendly (para URLs amigables)
 * Solo min\u00fasculas, n\u00fameros y guiones
 * Ejemplo: mi-producto-2024
 */
const slug = Joi.string().trim().max(200).pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).lowercase().messages({
  'string.pattern.base': 'Slug debe ser URL-friendly (min\u00fasculas, n\u00fameros, guiones)'
});

// ======================
// CAMPOS DE CONTACTO
// ======================

/**
 * Email con validación (max 255 para compatibilidad con estándares RFC)
 */
const email = Joi.string().email().lowercase().trim().max(255);

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
 * Teléfono genérico (hasta 20 caracteres, permite formatos varios)
 */
const telefonoGenerico = Joi.string().trim().max(20).allow(null, '');

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

/**
 * ✅ FIX v2.1: Código de moneda ISO 4217 (3 letras mayúsculas)
 * Ejemplos: MXN, USD, EUR
 */
const codigoMoneda = Joi.string()
  .length(3)
  .uppercase()
  .pattern(/^[A-Z]{3}$/)
  .messages({
    'string.pattern.base': 'Código de moneda debe ser 3 letras mayúsculas (ISO 4217)'
  });

/**
 * ✅ FIX v2.1: Código postal (5 dígitos para México)
 */
const codigoPostal = Joi.string()
  .pattern(/^[0-9]{5}$/)
  .messages({
    'string.pattern.base': 'Código postal debe tener 5 dígitos'
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
 * Campo activo para query params (acepta string 'true'/'false' o boolean)
 */
const activoQuery = Joi.alternatives().try(
  Joi.boolean(),
  Joi.string().valid('true', 'false')
);

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
// CAMPOS DE DIRECCIÓN
// ======================

/**
 * Calle/dirección principal (hasta 200 caracteres)
 */
const calle = Joi.string().trim().max(200).allow(null, '');

/**
 * Número exterior
 */
const numeroExterior = Joi.string().trim().max(20).allow(null, '');

/**
 * Número interior
 */
const numeroInterior = Joi.string().trim().max(20).allow(null, '');

/**
 * Colonia/barrio (hasta 100 caracteres)
 */
const colonia = Joi.string().trim().max(100).allow(null, '');

/**
 * Ciudad (hasta 100 caracteres)
 */
const ciudad = Joi.string().trim().max(100).allow(null, '');

/**
 * Estado/provincia (hasta 100 caracteres)
 */
const estado = Joi.string().trim().max(100).allow(null, '');

/**
 * Objeto dirección completa
 * Uso: ...fields.direccion en el schema
 */
const direccion = {
  calle,
  numero_exterior: numeroExterior,
  numero_interior: numeroInterior,
  colonia,
  ciudad,
  estado_id: id.optional().allow(null),
  codigo_postal: codigoPostal.allow(null, ''),
  pais_id: id.optional().allow(null).default(1)
};

// ======================
// PRECIO MULTI-MONEDA
// ======================

/**
 * Schema para precio en una moneda específica
 * Uso en productos con precios multi-moneda
 */
const precioMoneda = Joi.object({
  moneda: codigoMoneda.required(),
  precio: precio.required(),
  precio_compra: precio.optional().allow(null),
  precio_venta: precio.optional(),
  precio_minimo: precio.optional().allow(null),
  precio_maximo: precio.optional().allow(null)
});

/**
 * Array de precios multi-moneda (máximo 10 monedas)
 */
const preciosMultiMoneda = Joi.array()
  .items(precioMoneda)
  .max(10);

// ======================
// VARIANTES PRECIO (v2.2)
// ======================

/**
 * Precio para inventario (compra/venta)
 * Usado en productos, órdenes de compra, etc.
 */
const precioMonedaInventario = Joi.object({
  moneda: codigoMoneda.required(),
  precio_venta: precio.required().messages({
    'any.required': 'El precio de venta es requerido',
    'number.min': 'El precio de venta debe ser mayor o igual a 0'
  }),
  precio_compra: precio.optional().allow(null)
});

/**
 * Array de precios para inventario (máximo 10 monedas)
 */
const preciosInventario = Joi.array()
  .items(precioMonedaInventario)
  .max(10);

/**
 * Precio para servicios (rango negociable)
 * Usado en servicios con precios flexibles
 */
const precioMonedaRango = Joi.object({
  moneda: codigoMoneda.required(),
  precio: precio.required(),
  precio_minimo: precio.optional().allow(null),
  precio_maximo: precio.optional().allow(null)
});

/**
 * Array de precios con rango (máximo 10 monedas)
 */
const preciosRango = Joi.array()
  .items(precioMonedaRango)
  .max(10);

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
  nombreCorto,
  nombreMedio,
  nombreLargo,
  descripcion,
  descripcionLarga,
  codigo,
  referencia,
  notas,
  sku,
  codigoBarras,
  slug,

  // Contacto
  email,
  telefono,
  telefonoConLada,
  telefonoGenerico,
  url,
  rfc,
  codigoPostal,
  codigoMoneda,

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
  activoQuery,
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
  tags,

  // Dirección (v2.1)
  calle,
  numeroExterior,
  numeroInterior,
  colonia,
  ciudad,
  estado,
  direccion,  // Objeto completo para spread

  // Precio multi-moneda (v2.1)
  precioMoneda,
  preciosMultiMoneda,

  // Variantes especializadas de precio (v2.2)
  precioMonedaInventario,
  preciosInventario,
  precioMonedaRango,
  preciosRango
};

module.exports = {
  fields,
  toUpdateSchema,
  createBaseSchema,
  // Exportar también individualmente para destructuring directo
  ...fields
};
