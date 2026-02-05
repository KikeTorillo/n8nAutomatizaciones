/**
 * Declaraciones de tipos para constantes UI
 * Feb 2026 - Migración TypeScript
 */

// ============================================
// VARIANTES
// ============================================

export interface BadgeVariantsType {
  default: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  [key: string]: string;
}

export interface ButtonVariantsType {
  primary: string;
  secondary: string;
  outline: string;
  danger: string;
  ghost: string;
  warning: string;
  success: string;
  link: string;
  [key: string]: string;
}

// ============================================
// TAMAÑOS
// ============================================

export interface SizeMapType {
  sm: string;
  md: string;
  lg: string;
  [key: string]: string;
}

export interface ExtendedSizeMapType {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  [key: string]: string;
}

// ============================================
// ACCESIBILIDAD
// ============================================

export interface AriaRolesType {
  status: 'status';
  alert: 'alert';
  progressbar: 'progressbar';
  dialog: 'dialog';
  alertdialog: 'alertdialog';
  [key: string]: string;
}

export interface AriaLiveType {
  polite: 'polite';
  assertive: 'assertive';
  off: 'off';
}

export interface AriaLabelsType {
  loading: string;
  loadingData: string;
  required: string;
  [key: string]: string;
}

// ============================================
// FORMULARIOS
// ============================================

export interface InputAffixType {
  container: string;
  left: string;
  right: string;
  text: string;
}

export interface SelectArrowType {
  container: string;
  icon: string;
}

export interface LabelRequiredType {
  asterisk: string;
  srOnly: string;
}

// ============================================
// COLORES SEMÁNTICOS
// ============================================

export interface SemanticColorType {
  text: string;
  bg?: string;
  border?: string;
}

export interface SemanticColorsType {
  primary: SemanticColorType;
  neutral: SemanticColorType;
  success: SemanticColorType;
  warning: SemanticColorType;
  danger: SemanticColorType;
  [key: string]: SemanticColorType;
}

// ============================================
// FUNCIONES HELPER
// ============================================

export interface AriaDescribedByOptions {
  hasError?: boolean;
  hasHelper?: boolean;
  hasHint?: boolean;
}

export type GetAriaDescribedBy = (
  id: string,
  options?: AriaDescribedByOptions
) => string | undefined;

export type GetLoadingAriaLabel = (text?: string) => string;

export type GetCheckboxStyles = (options: { disabled?: boolean; error?: boolean }) => string;

export type GetSelectStyles = (hasError?: boolean) => string;

export type GetTextareaStyles = (hasError?: boolean, resizable?: string) => string;

export type GetInputPaddingStyles = (hasPrefix?: boolean, hasSuffix?: boolean) => string;
