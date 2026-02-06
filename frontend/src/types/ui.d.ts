/**
 * Tipos compartidos para componentes UI
 * Feb 2026 - Migración TypeScript
 */

// ============================================
// TAMAÑOS
// ============================================

/** Escala de tamaños unificada para todos los componentes UI */
export type UISize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** @deprecated Usar UISize. Alias temporal para backwards-compat */
export type Size = UISize;

/** @deprecated Usar UISize. Alias temporal para backwards-compat */
export type ExtendedSize = UISize;

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

// ============================================
// MOLECULES - ALERT
// ============================================

/** Variantes de alerta (danger es canónico, error es alias) */
export type AlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'error' | 'rose';

// ============================================
// MOLECULES - CARD
// ============================================

/** Variantes de card */
export type CardVariant = 'base' | 'elevated' | 'flat' | 'outline';

/** Estados de card */
export type CardStatus = 'success' | 'warning' | 'error' | 'info';

/** Padding de card */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

// ============================================
// MOLECULES - PROGRESS
// ============================================

/** Layout de barra de progreso */
export type ProgressLayout = 'horizontal' | 'vertical';

/** Presets de colores para progress */
export type ProgressPreset = 'completion' | 'usage' | 'neutral';

// ============================================
// MOLECULES - STATCARD
// ============================================

/** Variantes de StatCard */
export type StatCardVariant = 'compact' | 'expanded';

/** Tendencia para StatCard */
export interface StatCardTrend {
  value: number;
  isPositive: boolean;
}

// ============================================
// MOLECULES - SKELETON
// ============================================

/** Variantes de skeleton */
export type SkeletonVariant = 'compact' | 'expanded';

/** Anchos de columnas para SkeletonTable */
export type SkeletonColumnWidth = 'sm' | 'md' | 'lg' | 'xl';

// ============================================
// MOLECULES - TOAST
// ============================================

/** Tipos de toast */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// ============================================
// MOLECULES - FILTERCHIP
// ============================================

/** Variantes de FilterChip */
export type FilterChipVariant = 'primary' | 'gray';

// ============================================
// MOLECULES - DROPDOWN
// ============================================

/** Item de DropdownMenu */
export interface DropdownMenuItem {
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  divider?: boolean;
}

// ============================================
// MOLECULES - BREADCRUMB
// ============================================

/** Item de Breadcrumb */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ============================================
// MOLECULES - VIEWTABS
// ============================================

/** Tab para ViewTabs */
export interface ViewTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ============================================
// MOLECULES - NAVIGATION
// ============================================

/** Tamaños para RecordNavigation */
export type RecordNavigationSize = 'sm' | 'md';

// ============================================
// LUCIDE ICON TYPE
// ============================================

/** Tipo genérico para iconos de Lucide React */
export type LucideIcon = React.ComponentType<{ className?: string }>
