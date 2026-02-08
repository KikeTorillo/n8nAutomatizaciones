/**
 * ====================================================================
 * THEME COLORS HELPER
 * ====================================================================
 * Centraliza resolución de colores de tema con fallbacks.
 * Elimina las 5-6 líneas de resolución repetidas en cada canvas block.
 *
 * Uso:
 *   import { getThemeColors } from '@/components/editor-framework';
 *   const colors = getThemeColors(tema, 'website');
 */

import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * Resuelve colores del tema con fallbacks según contexto.
 *
 * @param {Object} tema - Objeto tema del editor
 * @param {'website'|'invitacion'} context - Contexto para fallbacks
 * @returns {Object} Colores resueltos
 */
export function getThemeColors(tema, context = 'website') {
  const FB = THEME_FALLBACK_COLORS[context] || THEME_FALLBACK_COLORS.website;
  return {
    primario: tema?.color_primario || FB.primario,
    secundario: tema?.color_secundario || (FB.acento || FB.secundario),
    fondo: tema?.color_fondo || FB.fondo,
    texto: tema?.color_texto || FB.texto,
    textoClaro: tema?.color_texto_claro || FB.textoClaro,
  };
}
