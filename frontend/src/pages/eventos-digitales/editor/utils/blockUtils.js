/**
 * ====================================================================
 * BLOCK UTILS - INVITACIONES
 * ====================================================================
 * Utilidades para crear y manipular bloques de invitación.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { getBlockDefaults } from '../config';

/**
 * Crea un nuevo bloque con valores por defecto
 *
 * @param {string} tipo - Tipo de bloque (ej: 'hero', 'countdown', etc.)
 * @param {number} orden - Posición del bloque (default: 0)
 * @returns {Object} Bloque nuevo con estructura completa
 *
 * @example
 * const nuevoBloque = crearBloqueNuevo('hero', 0);
 * // { id: 'uuid...', tipo: 'hero', orden: 0, visible: true, contenido: {...}, estilos: {}, version: 1 }
 */
export function crearBloqueNuevo(tipo, orden = 0) {
  return {
    id: crypto.randomUUID(),
    tipo,
    orden,
    visible: true,
    contenido: getBlockDefaults(tipo),
    estilos: {},
    version: 1,
  };
}
