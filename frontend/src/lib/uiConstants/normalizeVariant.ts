/**
 * Normalización centralizada de aliases de variantes UI
 *
 * Mapea aliases comunes a variantes canónicas:
 * - 'error' → 'danger'
 */

const VARIANT_ALIASES: Record<string, string> = {
  error: 'danger',
};

export function normalizeVariant<T extends string>(variant: T): string {
  return VARIANT_ALIASES[variant] || variant;
}
