/**
 * Tipos compartidos para componentes UI
 * Feb 2026 - Migración TypeScript
 */

// ============================================
// TAMAÑOS
// ============================================

/** Tamaños estándar */
export type Size = 'sm' | 'md' | 'lg';

/** Tamaños extendidos */
export type ExtendedSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ============================================
// VARIANTES
// ============================================

/** Variantes de botón */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'ghost'
  | 'warning'
  | 'success'
  | 'link';

/** Variantes de badge (error es alias de danger) */
export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

/** Variantes de badge incluyendo aliases */
export type BadgeVariantWithAliases = BadgeVariant | 'error';

// ============================================
// FORMULARIOS
// ============================================

/** Modos de resize para textarea */
export type ResizeMode = 'none' | 'vertical' | 'horizontal' | 'both';

/** Tipos de input HTML */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local';

/** Tipos de botón HTML */
export type ButtonType = 'button' | 'submit' | 'reset';

/** Opción para Select */
export interface SelectOption {
  value: string | number;
  label: string;
}
