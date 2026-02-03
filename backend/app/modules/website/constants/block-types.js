/**
 * ====================================================================
 * BLOCK TYPES - Constantes de tipos de bloques
 * ====================================================================
 *
 * Fuente de verdad para los tipos de bloques válidos.
 * Importar desde aquí en model y schema.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

/**
 * Array de tipos de bloques válidos
 * @type {string[]}
 */
const BLOCK_TYPES = [
    'hero',
    'servicios',
    'testimonios',
    'equipo',
    'cta',
    'contacto',
    'footer',
    'texto',
    'galeria',
    'video',
    'separador',
    'pricing',
    'faq',
    'countdown',
    'stats',
    'timeline'
];

/**
 * Set para búsqueda O(1) de tipos válidos
 * @type {Set<string>}
 */
const BLOCK_TYPE_SET = new Set(BLOCK_TYPES);

/**
 * Verifica si un tipo de bloque es válido
 * @param {string} tipo - Tipo a verificar
 * @returns {boolean} true si el tipo es válido
 */
const isValidBlockType = (tipo) => BLOCK_TYPE_SET.has(tipo);

/**
 * Máximo de bloques permitidos por página
 * Límite para evitar degradación de performance en el canvas
 * @type {number}
 */
const MAX_BLOQUES_POR_PAGINA = 50;

module.exports = {
    BLOCK_TYPES,
    BLOCK_TYPE_SET,
    isValidBlockType,
    MAX_BLOQUES_POR_PAGINA
};
