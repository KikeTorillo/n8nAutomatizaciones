/**
 * ====================================================================
 * UTILIDADES PARA SANITIZACIÓN DE DATOS
 * ====================================================================
 *
 * 1. Sanitización HTML (XSS): sanitizeHTML() con DOMPurify
 * 2. Sanitización de formularios: sanitizeFields() para API mutations
 *
 * Backend Joi rechaza strings vacíos en campos opcionales. Este módulo
 * centraliza la lógica de sanitización que estaba duplicada en 15+ hooks.
 *
 * Ene 2026 - Fase 1.1 + 2.2 Auditoría Frontend
 * ====================================================================
 */

import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir ataques XSS
 * Usar SIEMPRE antes de dangerouslySetInnerHTML
 *
 * @param {string} html - HTML potencialmente peligroso
 * @param {Object} options - Opciones de DOMPurify
 * @returns {string} - HTML sanitizado
 *
 * @example
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(contenido.html) }} />
 */
export function sanitizeHTML(html, options = {}) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Configuración por defecto: permitir tags seguros de formato
  const defaultConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title', 'width', 'height',
      'class', 'style',
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'], // Permitir target="_blank"
    ...options,
  };

  return DOMPurify.sanitize(html, defaultConfig);
}

/**
 * Tipos de campo soportados para sanitización
 * @typedef {'string' | 'number' | 'boolean' | 'id' | 'date' | 'array' | 'object' | 'email' | 'phone'} FieldType
 */

/**
 * Configuración de campo para sanitización
 * @typedef {Object} FieldConfig
 * @property {FieldType} type - Tipo de campo
 * @property {boolean} [required] - Si el campo es requerido (no se transforma a undefined)
 * @property {any} [default] - Valor por defecto si está vacío
 * @property {Function} [transform] - Función de transformación adicional
 */

/**
 * Sanitiza un valor según su tipo
 * @param {any} value - Valor a sanitizar
 * @param {FieldType} type - Tipo de campo
 * @returns {any} - Valor sanitizado o undefined
 */
function sanitizeValue(value, type) {
  // Null/undefined siempre retorna undefined
  if (value === null || value === undefined) {
    return undefined;
  }

  switch (type) {
    case 'string':
      // String vacío → undefined, otherwise trim
      const trimmed = String(value).trim();
      return trimmed === '' ? undefined : trimmed;

    case 'email':
      // Email: lowercase + trim
      const email = String(value).trim().toLowerCase();
      return email === '' ? undefined : email;

    case 'phone':
      // Phone: remove spaces, keep only digits and +
      const phone = String(value).replace(/[^\d+]/g, '');
      return phone === '' ? undefined : phone;

    case 'number':
      // Empty string o NaN → undefined
      if (value === '' || value === null) return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;

    case 'boolean':
      // Solo true/false son válidos
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === 1) return true;
      if (value === 'false' || value === 0) return false;
      return undefined;

    case 'id':
      // ID: debe ser número positivo o undefined
      if (value === '' || value === null || value === 0) return undefined;
      const id = Number(value);
      return isNaN(id) || id <= 0 ? undefined : id;

    case 'date':
      // Date: string ISO o Date object
      if (value === '') return undefined;
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? undefined : value.toISOString();
      }
      // Validar que es fecha válida
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : value;

    case 'array':
      // Array vacío → undefined
      if (!Array.isArray(value)) return undefined;
      return value.length === 0 ? undefined : value;

    case 'object':
      // Object vacío → undefined
      if (typeof value !== 'object' || value === null) return undefined;
      return Object.keys(value).length === 0 ? undefined : value;

    default:
      // Tipo desconocido: solo filtrar strings vacíos
      return value === '' ? undefined : value;
  }
}

/**
 * Sanitiza campos de un objeto según configuración de tipos
 *
 * @param {Object} data - Datos a sanitizar
 * @param {Object<string, FieldType|FieldConfig>} config - Configuración de campos
 * @returns {Object} - Datos sanitizados
 *
 * @example
 * // Configuración simple (solo tipos)
 * sanitizeFields({
 *   nombre: 'Juan',
 *   descripcion: '',
 *   categoria_id: 0,
 *   email: ' JUAN@TEST.COM ',
 * }, {
 *   nombre: 'string',
 *   descripcion: 'string',
 *   categoria_id: 'id',
 *   email: 'email',
 * });
 * // Resultado: { nombre: 'Juan', email: 'juan@test.com' }
 *
 * @example
 * // Configuración avanzada
 * sanitizeFields(data, {
 *   nombre: { type: 'string', required: true },
 *   precio: { type: 'number', default: 0 },
 *   tags: { type: 'array', transform: (v) => v.map(t => t.toLowerCase()) },
 * });
 */
export function sanitizeFields(data, config) {
  const result = {};

  Object.entries(config).forEach(([key, fieldConfig]) => {
    const value = data[key];

    // Normalizar config: string → { type: string }
    const { type, required, default: defaultValue, transform } =
      typeof fieldConfig === 'string'
        ? { type: fieldConfig }
        : fieldConfig;

    // Sanitizar según tipo
    let sanitized = sanitizeValue(value, type);

    // Aplicar transformación custom si existe
    if (transform && sanitized !== undefined) {
      sanitized = transform(sanitized);
    }

    // Aplicar default si está vacío y hay default definido
    if (sanitized === undefined && defaultValue !== undefined) {
      sanitized = defaultValue;
    }

    // Solo agregar si tiene valor o es requerido
    if (sanitized !== undefined || required) {
      result[key] = sanitized;
    }
  });

  // Incluir campos que no están en config (passthrough)
  Object.keys(data).forEach((key) => {
    if (!(key in config) && !(key in result)) {
      result[key] = data[key];
    }
  });

  return result;
}

/**
 * Configuraciones predefinidas para campos comunes
 * Usar con spread: { ...COMMON_FIELDS.contacto, ...tuConfig }
 */
export const COMMON_FIELDS = {
  // Campos de contacto
  contacto: {
    email: 'email',
    telefono: 'phone',
    telefono_celular: 'phone',
    telefono_fijo: 'phone',
    direccion: 'string',
    ciudad: 'string',
    estado: 'string',
    codigo_postal: 'string',
    pais: 'string',
  },

  // Campos de descripción/notas
  descripcion: {
    descripcion: 'string',
    notas: 'string',
    observaciones: 'string',
    comentarios: 'string',
  },

  // Campos de producto
  producto: {
    nombre: 'string',
    descripcion: 'string',
    sku: 'string',
    codigo_barras: 'string',
    categoria_id: 'id',
    proveedor_id: 'id',
    precio_compra: 'number',
    precio_venta: 'number',
    stock_minimo: 'number',
    stock_maximo: 'number',
    dias_vida_util: 'number',
    notas: 'string',
  },

  // Campos de persona (cliente/profesional)
  persona: {
    nombre: 'string',
    apellido_paterno: 'string',
    apellido_materno: 'string',
    nombre_completo: 'string',
    email: 'email',
    telefono: 'phone',
    fecha_nacimiento: 'date',
    genero: 'string',
    notas: 'string',
  },

  // Campos de categoría
  categoria: {
    nombre: 'string',
    descripcion: 'string',
    categoria_padre_id: 'id',
    icono: 'string',
    color: 'string',
    orden: 'number',
  },

  // Campos de proveedor
  proveedor: {
    nombre: 'string',
    razon_social: 'string',
    rfc: 'string',
    email: 'email',
    telefono: 'phone',
    direccion: 'string',
    ciudad: 'string',
    estado: 'string',
    codigo_postal: 'string',
    plazo_pago_dias: 'number',
    notas: 'string',
  },
};

/**
 * Sanitiza datos de producto para crear/actualizar
 * @param {Object} data - Datos del producto
 * @returns {Object} - Datos sanitizados
 */
export function sanitizeProducto(data) {
  return sanitizeFields(data, COMMON_FIELDS.producto);
}

/**
 * Sanitiza datos de categoría para crear/actualizar
 * @param {Object} data - Datos de la categoría
 * @returns {Object} - Datos sanitizados
 */
export function sanitizeCategoria(data) {
  return sanitizeFields(data, COMMON_FIELDS.categoria);
}

/**
 * Sanitiza datos de proveedor para crear/actualizar
 * @param {Object} data - Datos del proveedor
 * @returns {Object} - Datos sanitizados
 */
export function sanitizeProveedor(data) {
  return sanitizeFields(data, COMMON_FIELDS.proveedor);
}

/**
 * Sanitiza datos de persona (cliente/profesional)
 * @param {Object} data - Datos de la persona
 * @returns {Object} - Datos sanitizados
 */
export function sanitizePersona(data) {
  return sanitizeFields(data, {
    ...COMMON_FIELDS.persona,
    ...COMMON_FIELDS.contacto,
  });
}

export default sanitizeFields;
