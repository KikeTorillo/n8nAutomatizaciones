/**
 * ====================================================================
 * PALETTE MODULE
 * ====================================================================
 * Re-exports del módulo de paleta de bloques.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

export { default as BlockPalette } from './BlockPalette';
export { default as BlockCategoryGroup } from './BlockCategoryGroup';
export { default as DraggableBlockCard } from './DraggableBlockCard';
export { default as DraggableBlockItem } from './DraggableBlockItem';
export {
  agruparBloquesPorCategoria,
  getBlockColor,
  getDraggableId,
  DEFAULT_UNIFORM_COLOR,
} from './paletteUtils';
