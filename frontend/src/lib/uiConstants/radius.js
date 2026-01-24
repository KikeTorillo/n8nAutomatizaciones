/**
 * Border Radius Constants
 * Centralized border-radius scale for consistent roundness
 *
 * Ene 2026 - UI Library Preparation
 */

// Core radius scale (Tailwind compatible)
export const RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

// Directional radius
export const RADIUS_DIRECTIONAL = {
  top: {
    none: 'rounded-t-none',
    sm: 'rounded-t-sm',
    md: 'rounded-t',
    lg: 'rounded-t-lg',
    xl: 'rounded-t-xl',
  },
  bottom: {
    none: 'rounded-b-none',
    sm: 'rounded-b-sm',
    md: 'rounded-b',
    lg: 'rounded-b-lg',
    xl: 'rounded-b-xl',
  },
  left: {
    none: 'rounded-l-none',
    sm: 'rounded-l-sm',
    md: 'rounded-l',
    lg: 'rounded-l-lg',
    xl: 'rounded-l-xl',
  },
  right: {
    none: 'rounded-r-none',
    sm: 'rounded-r-sm',
    md: 'rounded-r',
    lg: 'rounded-r-lg',
    xl: 'rounded-r-xl',
  },
};

// Context-specific radius
export const RADIUS_CONTEXT = {
  button: 'rounded-lg',
  buttonSm: 'rounded-md',
  input: 'rounded-lg',
  card: 'rounded-xl',
  modal: 'rounded-xl',
  drawer: 'rounded-l-xl',
  badge: 'rounded-full',
  avatar: 'rounded-full',
  chip: 'rounded-full',
  tooltip: 'rounded-lg',
  dropdown: 'rounded-lg',
  tab: 'rounded-lg',
};
