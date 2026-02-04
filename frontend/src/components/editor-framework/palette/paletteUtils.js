/**
 * ====================================================================
 * PALETTE UTILS
 * ====================================================================
 * Utilidades compartidas para la paleta de bloques.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

/**
 * Colores por defecto para modo uniforme (primary)
 */
export const DEFAULT_UNIFORM_COLOR = {
  bg: 'bg-primary-100',
  text: 'text-primary-600',
  dark: 'dark:bg-primary-900/30 dark:text-primary-400',
};

/**
 * Agrupa bloques por categoría
 *
 * @param {Array} bloques - Lista de bloques con {tipo, categoria, ...}
 * @param {Object} categorias - Mapa de categorías {key: {label, orden}}
 * @returns {Array} Arreglo de [categoria, bloques[]] ordenado
 */
export function agruparBloquesPorCategoria(bloques, categorias) {
  const grupos = {};

  bloques.forEach((bloque) => {
    const cat = bloque.categoria || 'otros';
    if (!grupos[cat]) {
      grupos[cat] = [];
    }
    grupos[cat].push(bloque);
  });

  // Ordenar por el orden definido en categorías
  return Object.entries(grupos).sort((a, b) => {
    const ordenA = categorias[a[0]]?.orden || 99;
    const ordenB = categorias[b[0]]?.orden || 99;
    return ordenA - ordenB;
  });
}

/**
 * Obtiene el color para un tipo de bloque
 *
 * @param {string} tipo - Tipo de bloque
 * @param {Object} colorConfig - Configuración de colores
 * @param {string} colorConfig.mode - 'unique' | 'uniform'
 * @param {Object} colorConfig.colors - Mapa de colores por tipo (solo para mode='unique')
 * @returns {Object} {bg, text, dark}
 */
export function getBlockColor(tipo, colorConfig) {
  if (!colorConfig || colorConfig.mode === 'uniform') {
    return DEFAULT_UNIFORM_COLOR;
  }

  return colorConfig.colors?.[tipo] || DEFAULT_UNIFORM_COLOR;
}

/**
 * Genera el ID draggable para un bloque de paleta
 *
 * @param {string} tipo - Tipo de bloque
 * @param {string} prefix - Prefijo opcional (default: 'palette')
 * @returns {string} ID único para el bloque draggable
 */
export function getDraggableId(tipo, prefix = 'palette') {
  return `${prefix}-${tipo}`;
}
