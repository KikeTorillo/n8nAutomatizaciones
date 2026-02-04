/**
 * ====================================================================
 * COMPARE UTILS
 * ====================================================================
 * Utilidades de comparacion optimizadas para evitar JSON.stringify en hot paths.
 * Estas funciones son mas eficientes porque pueden hacer early-exit cuando
 * encuentran una diferencia, mientras que JSON.stringify siempre serializa todo.
 */

/**
 * Comparacion profunda de dos valores
 * Mas eficiente que JSON.stringify para objetos pequenos/medianos
 * porque puede hacer early-exit cuando encuentra diferencias.
 *
 * @param {*} a - Primer valor
 * @param {*} b - Segundo valor
 * @returns {boolean} - true si son iguales
 */
export function deepEqual(a, b) {
  // Misma referencia o valores primitivos iguales
  if (a === b) return true;

  // Null/undefined check
  if (a == null || b == null) return a === b;

  // Tipos diferentes
  const typeA = typeof a;
  const typeB = typeof b;
  if (typeA !== typeB) return false;

  // Primitivos
  if (typeA !== 'object') return a === b;

  // Arrays
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Objetos
  if (Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Genera un hash simple de un array de bloques
 * Mucho mas rapido que JSON.stringify para deteccion de cambios
 * Solo considera id y version de cada bloque
 *
 * @param {Array} bloques - Array de bloques
 * @returns {string} - Hash string
 */
export function hashBloques(bloques) {
  if (!Array.isArray(bloques) || bloques.length === 0) {
    return '';
  }

  return bloques
    .map(b => `${b.id}:${b.version || 0}:${b.orden || 0}`)
    .join('|');
}

/**
 * Comparacion rapida de arrays de bloques
 * Compara solo ids, versiones y orden para deteccion rapida de cambios
 *
 * @param {Array} a - Primer array de bloques
 * @param {Array} b - Segundo array de bloques
 * @returns {boolean} - true si son iguales (mismos ids, versiones, orden)
 */
export function bloquesEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return a === b;
  }

  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].version !== b[i].version) return false;
    if (a[i].orden !== b[i].orden) return false;
    // Comparar contenido solo si cambia la estructura basica
    if (!deepEqual(a[i].contenido, b[i].contenido)) return false;
  }

  return true;
}
