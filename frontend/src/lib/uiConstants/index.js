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
  STATUS_COLORS,
  getStatusColor,
  CARD_THEME_COLORS,
  getCardThemeColor,
  TOGGLE_COLORS,
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
  TEXT_SIZES,
  ICON_CONTAINER_SIZES,
  MODAL_SIZES,
  DRAWER_SIZES,
  SEARCH_INPUT_SIZES,
  PAGINATION_SIZES,
  TOGGLE_SIZES,
} from './sizes';

// Re-exports desde spacing para compatibilidad (fuente única de verdad)
// Usar GAP y PADDING de spacing.js en vez de los eliminados *_SIZES
export { GAP as GAP_SIZES, PADDING as PADDING_SIZES } from './spacing';

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
  // Estilos de campos de filtro
  FILTER_INPUT_STYLES,
  FILTER_LABEL_STYLES,
  FILTER_CONTAINER_STYLES,
  FILTER_ICON_STYLES,
  // Estilos de paneles de filtro
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

// Tables (Ene 2026)
export {
  TABLE_ALIGN_CLASSES,
  TABLE_WIDTH_CLASSES,
  TABLE_WIDTH_MAP,
  TABLE_BASE_STYLES,
  TABLE_HEADER_CELL,
  TABLE_BODY_CELL,
  TABLE_ROW_STYLES,
} from './tables';

// Empty State (Ene 2026)
export {
  EMPTY_STATE_SIZES,
  EMPTY_STATE_BASE,
  getEmptyStateSize,
} from './emptyState';

// Surfaces (Ene 2026)
export {
  CARD_BASE,
  CARD_ELEVATED,
  CARD_FLAT,
  CARD_OUTLINE,
  CARD_STATUS_STYLES,
  CARD_PADDING_STYLES,
  SURFACE_HOVER,
  SURFACE_HOVER_SUBTLE,
  OVERLAY_BACKDROP,
  OVERLAY_SIMPLE,
  SCROLLABLE_CONTAINER,
  SECTION_HEADER,
  SECTION_FOOTER,
} from './surfaces';

// Z-Index (Ene 2026)
export {
  Z_INDEX,
  Z_LAYER,
  Z_FIXED_POSITIONS,
} from './zIndex';

// Shadows (Ene 2026)
export {
  SHADOW,
  SHADOW_DARK,
  SHADOW_CONTEXT,
  ELEVATION,
} from './shadows';

// Border Radius (Ene 2026)
export {
  RADIUS,
  RADIUS_DIRECTIONAL,
  RADIUS_CONTEXT,
} from './radius';

// Animations (Ene 2026)
export {
  ANIMATE,
  TRANSITION,
  DURATION,
  EASE,
  TRANSITION_PRESET,
  TRANSFORM,
} from './animations';

// Accesibilidad (Ene 2026)
export {
  ARIA_ROLES,
  ARIA_LIVE,
  ARIA_LABELS,
  getAriaDescribedBy,
  getCharCountAriaLabel,
  getPaginationAriaLabel,
  getLoadingAriaLabel,
  getValidationAriaLabel,
} from './accessibility';

// Formularios (Ene 2026)
export {
  CHECKBOX_BASE,
  CHECKBOX_STATES,
  CHECKBOX_SIZE_CLASSES,
  RADIO_SIZE_CLASSES,
  getCheckboxStyles,
  SELECT_BASE,
  SELECT_STATES,
  SELECT_ARROW,
  SELECT_SIZE_CLASSES,
  getSelectStyles,
  TEXTAREA_BASE,
  TEXTAREA_STATES,
  TEXTAREA_RESIZE,
  getTextareaStyles,
  LABEL_BASE,
  LABEL_REQUIRED,
  INPUT_SIZE_CLASSES,
  INPUT_AFFIX,
  getInputPaddingStyles,
  FORM_GROUP,
  FIELD_WRAPPER,
} from './forms';

// State Nav Tabs (Ene 2026)
export {
  STATE_TAB_STYLES,
  TAB_STYLES,
  STATE_COUNT_STYLES,
  COUNT_STYLES,
  STATE_DROPDOWN_ITEM_STYLES,
  DROPDOWN_ITEM_STYLES,
  getStateTabStyles,
  getStateCountStyles,
  getStateDropdownItemStyles,
  STATE_NAV_CONTAINER_STYLES,
  STATE_DROPDOWN_MENU_STYLES,
  STATE_MOBILE_SELECTOR_STYLES,
} from './stateNavTabs';

// Page Header (Ene 2026)
export {
  PAGE_HEADER_ICON_COLORS,
  getPageHeaderIconColor,
  PAGE_HEADER_STYLES,
} from './pageHeader';

// Theme Defaults (Feb 2026)
export {
  THEME_FALLBACK_COLORS,
  getThemeFallback,
} from './themeDefaults';
