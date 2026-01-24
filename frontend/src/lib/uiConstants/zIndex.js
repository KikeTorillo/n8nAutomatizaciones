/**
 * Z-Index Constants
 * Centralized z-index scale for consistent layering
 *
 * Ene 2026 - UI Library Preparation
 */

// Core z-index scale (Tailwind compatible)
export const Z_INDEX = {
  auto: 'z-auto',
  0: 'z-0',
  10: 'z-10',
  20: 'z-20',
  30: 'z-30',
  40: 'z-40',
  50: 'z-50',
};

// Semantic z-index layers
export const Z_LAYER = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  popover: 'z-50',
  tooltip: 'z-[60]',
  toast: 'z-[100]',
};

// Fixed position elements (specific values for complex layouts)
export const Z_FIXED_POSITIONS = {
  sidebar: 'z-30',
  header: 'z-40',
  overlay: 'z-40',
  modal: 'z-50',
  drawer: 'z-50',
  dropdown: 'z-[60]',
  tooltip: 'z-[70]',
  toast: 'z-[100]',
};
