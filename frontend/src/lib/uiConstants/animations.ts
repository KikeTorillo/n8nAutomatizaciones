/**
 * Animation Constants
 * Centralized animation and transition utilities
 *
 * Ene 2026 - UI Library Preparation
 */

// Animation presets (Tailwind compatible)
export const ANIMATE = {
  none: 'animate-none',
  spin: 'animate-spin',
  ping: 'animate-ping',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
} as const;

// Transition properties
export const TRANSITION = {
  none: 'transition-none',
  all: 'transition-all',
  default: 'transition',
  colors: 'transition-colors',
  opacity: 'transition-opacity',
  shadow: 'transition-shadow',
  transform: 'transition-transform',
} as const;

// Duration scale
export const DURATION = {
  75: 'duration-75',
  100: 'duration-100',
  150: 'duration-150',
  200: 'duration-200',
  300: 'duration-300',
  500: 'duration-500',
  700: 'duration-700',
  1000: 'duration-1000',
} as const;

// Easing functions
export const EASE = {
  linear: 'ease-linear',
  in: 'ease-in',
  out: 'ease-out',
  inOut: 'ease-in-out',
} as const;

// Common transition presets
export const TRANSITION_PRESET = {
  fast: 'transition-all duration-150 ease-out',
  default: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
  colors: 'transition-colors duration-200 ease-out',
  opacity: 'transition-opacity duration-200 ease-out',
  transform: 'transition-transform duration-200 ease-out',
  scale: 'transition-transform duration-150 ease-out',
} as const;

// Transform utilities
export const TRANSFORM = {
  scaleUp: 'hover:scale-105',
  scaleDown: 'active:scale-95',
  rotate180: 'rotate-180',
  rotateNeg180: '-rotate-180',
  translateY: 'translate-y-1',
  translateYNeg: '-translate-y-1',
} as const;
