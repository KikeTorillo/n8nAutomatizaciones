/**
 * Helper para parseo de query params y filtros
 * Centraliza lógica de parseo duplicada en 19+ controllers
 *
 * @module utils/helpers/ParseHelper
 *
 * @example
 * const { ParseHelper } = require('../utils/helpers');
 *
 * // Parseo simple
 * const activo = ParseHelper.parseBoolean(req.query.activo);
 * const page = ParseHelper.parseInt(req.query.page, 1);
 *
 * // Paginación estandarizada
 * const { page, limit, offset } = ParseHelper.parsePagination(req.query);
 *
 * // Parseo según schema de tipos
 * const filtros = ParseHelper.parseFilters(req.query, {
 *   activo: 'boolean',
 *   departamento_id: 'int',
 *   nombre: 'string'
 * });
 */

class ParseHelper {
  /**
   * Convierte 'true'/'false'/undefined a boolean
   * @param {string|boolean|undefined} value - Valor a parsear
   * @param {boolean|null} defaultValue - Valor por defecto si es undefined/null/''
   * @returns {boolean|null}
   *
   * @example
   * ParseHelper.parseBoolean('true')     // true
   * ParseHelper.parseBoolean('false')    // false
   * ParseHelper.parseBoolean(undefined)  // null
   * ParseHelper.parseBoolean('', false)  // false
   */
  static parseBoolean(value, defaultValue = null) {
    if (value === undefined || value === null || value === '') return defaultValue;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }

  /**
   * Parseo seguro de enteros
   * @param {string|number|undefined} value - Valor a parsear
   * @param {number|null} defaultValue - Valor por defecto si es inválido
   * @returns {number|null}
   *
   * @example
   * ParseHelper.parseInt('42')        // 42
   * ParseHelper.parseInt('abc', 0)    // 0
   * ParseHelper.parseInt(undefined)   // null
   */
  static parseInt(value, defaultValue = null) {
    if (value === undefined || value === null || value === '') return defaultValue;
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parseo seguro de floats
   * @param {string|number|undefined} value - Valor a parsear
   * @param {number|null} defaultValue - Valor por defecto si es inválido
   * @returns {number|null}
   *
   * @example
   * ParseHelper.parseFloat('3.14')    // 3.14
   * ParseHelper.parseFloat('abc', 0)  // 0
   */
  static parseFloat(value, defaultValue = null) {
    if (value === undefined || value === null || value === '') return defaultValue;
    if (typeof value === 'number') return value;
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parseo de fechas
   * @param {string|Date|undefined} value - Valor a parsear
   * @param {Date|null} defaultValue - Valor por defecto si es inválido
   * @returns {Date|null}
   *
   * @example
   * ParseHelper.parseDate('2024-01-15')  // Date object
   * ParseHelper.parseDate('invalid')     // null
   */
  static parseDate(value, defaultValue = null) {
    if (value === undefined || value === null || value === '') return defaultValue;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? defaultValue : parsed;
  }

  /**
   * Parseo de string con trim
   * @param {string|undefined} value - Valor a parsear
   * @param {string|null} defaultValue - Valor por defecto si es vacío
   * @returns {string|null}
   */
  static parseString(value, defaultValue = null) {
    if (value === undefined || value === null) return defaultValue;
    const trimmed = String(value).trim();
    return trimmed === '' ? defaultValue : trimmed;
  }

  /**
   * Parseo de array desde string CSV o array
   * @param {string|Array|undefined} value - Valor a parsear
   * @returns {Array}
   *
   * @example
   * ParseHelper.parseArray('1,2,3')     // ['1', '2', '3']
   * ParseHelper.parseArray(['a', 'b'])  // ['a', 'b']
   * ParseHelper.parseArray(undefined)   // []
   */
  static parseArray(value) {
    if (value === undefined || value === null || value === '') return [];
    if (Array.isArray(value)) return value;
    return String(value).split(',').map(s => s.trim()).filter(Boolean);
  }

  /**
   * Parseo de array de enteros
   * @param {string|Array|undefined} value - Valor a parsear
   * @returns {number[]}
   *
   * @example
   * ParseHelper.parseIntArray('1,2,3')  // [1, 2, 3]
   * ParseHelper.parseIntArray('1,a,3')  // [1, 3] (filtra inválidos)
   */
  static parseIntArray(value) {
    const arr = this.parseArray(value);
    return arr
      .map(v => this.parseInt(v))
      .filter(v => v !== null);
  }

  /**
   * Paginación estandarizada
   * @param {Object} query - Query params del request
   * @param {Object} options - Opciones de configuración
   * @param {number} options.defaultLimit - Límite por defecto (default: 20)
   * @param {number} options.maxLimit - Límite máximo permitido (default: 100)
   * @returns {{ page: number, limit: number, offset: number }}
   *
   * @example
   * const { page, limit, offset } = ParseHelper.parsePagination(req.query);
   * // page: 1-indexed, limit: constrained to max, offset: calculated
   */
  static parsePagination(query, options = {}) {
    const { defaultLimit = 20, maxLimit = 100 } = options;

    const page = Math.max(1, this.parseInt(query.page, 1));
    const limit = Math.min(maxLimit, Math.max(1, this.parseInt(query.limit, defaultLimit)));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Parseo de ordenamiento
   * @param {Object} query - Query params del request
   * @param {string[]} allowedFields - Campos permitidos para ordenar
   * @param {string} defaultField - Campo por defecto
   * @returns {{ orderBy: string, orderDirection: 'ASC'|'DESC' }}
   *
   * @example
   * const { orderBy, orderDirection } = ParseHelper.parseOrdering(
   *   req.query,
   *   ['nombre', 'creado_en'],
   *   'creado_en'
   * );
   */
  static parseOrdering(query, allowedFields = [], defaultField = 'creado_en') {
    const orderBy = allowedFields.includes(query.order_by)
      ? query.order_by
      : defaultField;

    const orderDirection = ['ASC', 'DESC'].includes(query.order_direction?.toUpperCase())
      ? query.order_direction.toUpperCase()
      : 'DESC';

    return { orderBy, orderDirection };
  }

  /**
   * Parseo de filtros según schema de tipos
   * Útil para construir filtros desde query params de forma consistente
   *
   * @param {Object} query - Query params del request
   * @param {Object} schema - Schema de tipos para cada campo
   * @returns {Object} Objeto con filtros parseados (null para campos vacíos)
   *
   * @example
   * const filtros = ParseHelper.parseFilters(req.query, {
   *   activo: 'boolean',
   *   departamento_id: 'int',
   *   precio_min: 'float',
   *   nombre: 'string',
   *   fecha_desde: 'date',
   *   categorias: 'intArray'
   * });
   */
  static parseFilters(query, schema) {
    const result = {};

    for (const [field, type] of Object.entries(schema)) {
      const value = query[field];

      switch (type) {
        case 'boolean':
          result[field] = this.parseBoolean(value);
          break;
        case 'int':
          result[field] = this.parseInt(value);
          break;
        case 'float':
          result[field] = this.parseFloat(value);
          break;
        case 'date':
          result[field] = this.parseDate(value);
          break;
        case 'string':
          result[field] = this.parseString(value);
          break;
        case 'array':
          result[field] = this.parseArray(value);
          break;
        case 'intArray':
          result[field] = this.parseIntArray(value);
          break;
        default:
          result[field] = value ?? null;
      }
    }

    return result;
  }

  /**
   * Combina paginación y filtros en un solo objeto
   * Patrón común en controllers de listado
   *
   * @param {Object} query - Query params del request
   * @param {Object} filterSchema - Schema de tipos para filtros
   * @param {Object} options - Opciones de paginación y ordenamiento
   * @returns {{ pagination: Object, filters: Object, ordering: Object }}
   *
   * @example
   * const { pagination, filters, ordering } = ParseHelper.parseListParams(
   *   req.query,
   *   { activo: 'boolean', departamento_id: 'int' },
   *   { allowedOrderFields: ['nombre', 'creado_en'] }
   * );
   */
  static parseListParams(query, filterSchema = {}, options = {}) {
    const { allowedOrderFields = [], defaultOrderField = 'creado_en' } = options;

    return {
      pagination: this.parsePagination(query, options),
      filters: this.parseFilters(query, filterSchema),
      ordering: this.parseOrdering(query, allowedOrderFields, defaultOrderField)
    };
  }
}

module.exports = ParseHelper;
