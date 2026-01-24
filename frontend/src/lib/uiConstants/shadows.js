/**
 * Shadow Constants
 * Centralized box-shadow scale for consistent elevation
 *
 * Ene 2026 - UI Library Preparation
 */

// Core shadow scale (Tailwind compatible)
export const SHADOW = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
};

// Dark mode shadows
export const SHADOW_DARK = {
  none: 'dark:shadow-none',
  sm: 'dark:shadow-sm dark:shadow-gray-900/20',
  md: 'dark:shadow dark:shadow-gray-900/30',
  lg: 'dark:shadow-lg dark:shadow-gray-900/40',
  xl: 'dark:shadow-xl dark:shadow-gray-900/50',
  '2xl': 'dark:shadow-2xl dark:shadow-gray-900/60',
};

// Context-specific shadows (combined light + dark)
export const SHADOW_CONTEXT = {
  card: 'shadow-sm dark:shadow-gray-900/20',
  cardHover: 'shadow-md dark:shadow-gray-900/30',
  dropdown: 'shadow-lg dark:shadow-gray-900/40',
  modal: 'shadow-xl dark:shadow-gray-900/50',
  tooltip: 'shadow-md dark:shadow-gray-900/30',
  button: 'shadow-sm dark:shadow-gray-900/10',
  input: 'shadow-sm dark:shadow-gray-900/10',
};

// Elevation helpers
export const ELEVATION = {
  flat: '',
  raised: 'shadow-sm dark:shadow-gray-900/20',
  floating: 'shadow-lg dark:shadow-gray-900/40',
  overlay: 'shadow-xl dark:shadow-gray-900/50',
};
