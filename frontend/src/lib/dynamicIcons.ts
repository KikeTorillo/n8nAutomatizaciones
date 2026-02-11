/**
 * Iconos dinámicos — delega a ICONOS_MAP de @nexo2/ui
 *
 * Provee `getDynamicIcon()` para acceso por nombre string con fallback seguro.
 * Usado por editores de timeline, servicios, botones, etc.
 */
import { ICONOS_MAP } from '@nexo2/ui';
import type { LucideIcon } from 'lucide-react';

/** @deprecated Usar ICONOS_MAP de '@nexo2/ui' directamente */
export const DYNAMIC_ICONS = ICONOS_MAP;

/**
 * Obtiene un icono dinámico por nombre con fallback seguro.
 * Reemplaza el patrón `LucideIcons[name] || FallbackIcon`.
 */
export function getDynamicIcon(
  name: string | undefined | null,
  fallback?: LucideIcon
): LucideIcon | null {
  if (!name) return fallback ?? null;
  return ICONOS_MAP[name] ?? fallback ?? null;
}

export { type LucideIcon };
