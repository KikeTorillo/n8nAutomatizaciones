/**
 * ====================================================================
 * CONSTANTES UI
 * ====================================================================
 *
 * Re-exports centralizados de constantes UI.
 *
 * Uso:
 *   import { SEMANTIC_COLORS, BUTTON_SIZES } from '@/lib/uiConstants';
 *   // o importar de archivo específico:
 *   import { SEMANTIC_COLORS } from '@/lib/uiConstants/colors';
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

// Colores
export {
  SEMANTIC_COLORS,
  COLOR_ALIASES,
  getSemanticColor,
  BADGE_COLORS,
  ICON_BG_COLORS,
} from './colors';

// Tamaños
export {
  FORM_ELEMENT_HEIGHTS,
  BUTTON_SIZES,
  ICON_SIZES,
  SPINNER_SIZES,
  BADGE_SIZES,
  INPUT_SIZES,
  AVATAR_SIZES,
  PADDING_SIZES,
  GAP_SIZES,
  TEXT_SIZES,
  ICON_CONTAINER_SIZES,
  MODAL_SIZES,
  SEARCH_INPUT_SIZES,
  PAGINATION_SIZES,
} from './sizes';

// Variantes
export {
  BUTTON_VARIANTS,
  BADGE_VARIANTS,
  ALERT_VARIANTS,
  TOAST_VARIANTS,
  CARD_VARIANTS,
  INPUT_VARIANTS,
  TOAST_EXTENDED_VARIANTS,
  TOAST_CONTAINER_STYLES,
} from './variants';

// Estados
export {
  INTERACTIVE_STATES,
  HOVER_STATES,
  VALIDATION_STATES,
  LOADING_STATES,
  VISIBILITY_STATES,
  FOCUS_STATES,
  DRAG_STATES,
  SELECTION_STATES,
  EXPAND_STATES,
} from './states';

// Estilos de Inputs (Ene 2026)
export {
  INPUT_BASE_CLASSES,
  INPUT_BORDER_STATES,
  INPUT_STYLES,
  getInputBaseStyles,
} from './inputs';

// Espaciado (Ene 2026)
export {
  GAP,
  PADDING,
  PADDING_X,
  PADDING_Y,
  MARGIN,
  MARGIN_X,
  MARGIN_Y,
  SPACE_X,
  SPACE_Y,
} from './spacing';

// Progress Bar (Ene 2026)
export {
  PROGRESS_BAR_COLORS,
  PROGRESS_TEXT_COLORS,
  PROGRESS_BAR_SIZES,
  PROGRESS_THRESHOLD_PRESETS,
  getProgressColorByThreshold,
} from './progress';

// Tabs (Ene 2026)
export {
  TAB_CONTAINER_STYLES,
  TAB_NAV_STYLES,
  TAB_BUTTON_STYLES,
  TAB_ICON_STYLES,
  getTabButtonStyles,
  getTabIconStyles,
} from './tabs';

// Filters (Ene 2026)
export {
  FILTER_PANEL_CONTAINER,
  FILTER_PANEL_HEADER,
  FILTER_PANEL_CONTENT,
  FILTER_TOGGLE_BUTTON_STYLES,
  FILTER_COUNT_BADGE,
  FILTER_CHECKBOX_STYLES,
  FILTER_SELECT_STYLES,
  FILTER_SECTION_TITLE,
  FILTER_GRID_LAYOUTS,
  getFilterToggleStyles,
} from './filters';
