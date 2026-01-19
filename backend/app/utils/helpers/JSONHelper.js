/**
 * Helper para operaciones seguras con JSON
 * @module utils/helpers/JSONHelper
 *
 * Proporciona métodos seguros para parsear, serializar y manipular JSON
 * sin lanzar excepciones, con valores por defecto configurables.
 *
 * @example
 * const { JSONHelper } = require('../helpers');
 *
 * // Parse seguro
 * const data = JSONHelper.safeParse('{"name": "test"}', {});
 *
 * // Stringify seguro
 * const json = JSONHelper.safeStringify({ circular: obj }, '{}');
 *
 * // Clonar objetos
 * const clone = JSONHelper.deepClone(original);
 *
 * // Comparar por valor
 * const areEqual = JSONHelper.isEqual(obj1, obj2);
 */

class JSONHelper {
  /**
   * Parsea JSON de forma segura, retornando un valor por defecto si falla
   *
   * @param {string} str - String JSON a parsear
   * @param {*} [defaultValue=null] - Valor por defecto si el parse falla
   * @returns {*} Objeto parseado o valor por defecto
   *
   * @example
   * const data = JSONHelper.safeParse('{"valid": true}', {});
   * // => { valid: true }
   *
   * const fallback = JSONHelper.safeParse('invalid json', { error: true });
   * // => { error: true }
   *
   * const nullResult = JSONHelper.safeParse(null, []);
   * // => []
   */
  static safeParse(str, defaultValue = null) {
    if (str === null || str === undefined) {
      return defaultValue;
    }

    if (typeof str !== 'string') {
      // Si ya es un objeto, retornarlo directamente
      if (typeof str === 'object') {
        return str;
      }
      return defaultValue;
    }

    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Serializa objeto a JSON de forma segura, manejando referencias circulares
   *
   * @param {*} value - Valor a serializar
   * @param {string} [defaultValue='null'] - Valor por defecto si falla
   * @param {number} [indent=0] - Espacios de indentación (0 = sin formato)
   * @returns {string} JSON serializado o valor por defecto
   *
   * @example
   * const json = JSONHelper.safeStringify({ name: 'test' });
   * // => '{"name":"test"}'
   *
   * const formatted = JSONHelper.safeStringify({ name: 'test' }, '{}', 2);
   * // => '{\n  "name": "test"\n}'
   *
   * // Objetos con referencias circulares
   * const obj = { name: 'circular' };
   * obj.self = obj;
   * const result = JSONHelper.safeStringify(obj, '{}');
   * // => '{}' (fallback porque hay referencia circular)
   */
  static safeStringify(value, defaultValue = 'null', indent = 0) {
    if (value === undefined) {
      return defaultValue;
    }

    try {
      // Intentar stringify normal primero
      return indent > 0
        ? JSON.stringify(value, null, indent)
        : JSON.stringify(value);
    } catch {
      // Si falla (ej: referencias circulares), intentar con replacer personalizado
      try {
        const seen = new WeakSet();
        return JSON.stringify(value, (key, val) => {
          if (typeof val === 'object' && val !== null) {
            if (seen.has(val)) {
              return '[Circular]';
            }
            seen.add(val);
          }
          return val;
        }, indent > 0 ? indent : undefined);
      } catch {
        return defaultValue;
      }
    }
  }

  /**
   * Clona un objeto profundamente usando JSON
   *
   * NOTA: No funciona con funciones, símbolos, undefined, o referencias circulares.
   * Para esos casos, usar structuredClone() de Node 17+.
   *
   * @param {Object} obj - Objeto a clonar
   * @returns {Object|null} Clon del objeto o null si falla
   *
   * @example
   * const original = { nested: { value: 42 } };
   * const clone = JSONHelper.deepClone(original);
   * clone.nested.value = 100;
   * // original.nested.value sigue siendo 42
   */
  static deepClone(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Para tipos primitivos, retornar directamente
    if (typeof obj !== 'object') {
      return obj;
    }

    try {
      // Usar structuredClone si está disponible (Node 17+)
      if (typeof structuredClone === 'function') {
        return structuredClone(obj);
      }

      // Fallback a JSON parse/stringify
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return null;
    }
  }

  /**
   * Compara dos valores por su contenido JSON (deep equality)
   *
   * @param {*} a - Primer valor
   * @param {*} b - Segundo valor
   * @returns {boolean} true si son iguales por valor
   *
   * @example
   * JSONHelper.isEqual({ a: 1 }, { a: 1 });
   * // => true
   *
   * JSONHelper.isEqual([1, 2, 3], [1, 2, 3]);
   * // => true
   *
   * JSONHelper.isEqual({ a: 1 }, { a: 2 });
   * // => false
   */
  static isEqual(a, b) {
    // Igualdad por referencia o primitivos iguales
    if (a === b) {
      return true;
    }

    // Si alguno es null/undefined
    if (a === null || b === null || a === undefined || b === undefined) {
      return false;
    }

    // Tipos diferentes
    if (typeof a !== typeof b) {
      return false;
    }

    // Para objetos, comparar JSON serializado
    if (typeof a === 'object') {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch {
        return false;
      }
    }

    // Para primitivos que no son iguales por ===
    return false;
  }

  /**
   * Fusiona objetos profundamente
   *
   * @param {Object} target - Objeto destino
   * @param {...Object} sources - Objetos fuente
   * @returns {Object} Objeto fusionado
   *
   * @example
   * const result = JSONHelper.deepMerge(
   *   { a: { b: 1 } },
   *   { a: { c: 2 } }
   * );
   * // => { a: { b: 1, c: 2 } }
   */
  static deepMerge(target, ...sources) {
    if (!sources.length) return target;

    const source = sources.shift();

    if (this.isPlainObject(target) && this.isPlainObject(source)) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          if (this.isPlainObject(source[key])) {
            if (!target[key]) {
              Object.assign(target, { [key]: {} });
            }
            this.deepMerge(target[key], source[key]);
          } else {
            Object.assign(target, { [key]: source[key] });
          }
        }
      }
    }

    return this.deepMerge(target, ...sources);
  }

  /**
   * Verifica si un valor es un objeto plano (no array, no null, no Date, etc.)
   *
   * @param {*} obj - Valor a verificar
   * @returns {boolean} true si es un objeto plano
   */
  static isPlainObject(obj) {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }
    return Object.getPrototypeOf(obj) === Object.prototype;
  }

  /**
   * Obtiene un valor anidado de un objeto usando notación de punto
   *
   * @param {Object} obj - Objeto fuente
   * @param {string} path - Ruta en notación de punto (ej: 'user.address.city')
   * @param {*} [defaultValue=undefined] - Valor por defecto si no existe
   * @returns {*} Valor encontrado o valor por defecto
   *
   * @example
   * const obj = { user: { address: { city: 'CDMX' } } };
   * JSONHelper.get(obj, 'user.address.city');
   * // => 'CDMX'
   *
   * JSONHelper.get(obj, 'user.phone', 'N/A');
   * // => 'N/A'
   */
  static get(obj, path, defaultValue = undefined) {
    if (!obj || typeof path !== 'string') {
      return defaultValue;
    }

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result === undefined ? defaultValue : result;
  }
}

module.exports = JSONHelper;
