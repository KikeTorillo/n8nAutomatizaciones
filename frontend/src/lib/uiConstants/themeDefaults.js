/**
 * ====================================================================
 * THEME FALLBACK COLORS
 * ====================================================================
 *
 * Colores de fallback centralizados para cuando no hay tema disponible.
 * Reemplaza los hex hardcodeados dispersos en canvas-blocks, editors y renderers.
 *
 * Uso:
 *   import { THEME_FALLBACK_COLORS, getThemeFallback } from '@/lib/uiConstants/themeDefaults';
 *
 *   // Acceso directo
 *   const color = tema?.color_primario || THEME_FALLBACK_COLORS.invitacion.primario;
 *
 *   // Con helper
 *   const color = tema?.color_primario || getThemeFallback('invitacion', 'primario');
 *
 * Feb 2026
 * ====================================================================
 */

export const THEME_FALLBACK_COLORS = {
  website: {
    primario: '#4F46E5',
    secundario: '#6366F1',
    fondo: '#FFFFFF',
    texto: '#1F2937',
    textoClaro: '#6B7280',
  },
  invitacion: {
    primario: '#753572',
    secundario: '#fce7f3',
    fondo: '#FFFFFF',
    fondoHero: '#fdf2f8',
    texto: '#1f2937',
    textoClaro: '#6b7280',
    overlay: '#000000',
    acento: '#F59E0B',
  },
  common: {
    separador: '#E5E7EB',
    fondoOscuro: '#1F2937',
    textoBlanco: '#FFFFFF',
    fondoClaro: '#F9FAFB',
    fondoGris: '#F3F4F6',
  },
};

/**
 * Obtiene un color de fallback por modulo y key.
 * Si no existe en el modulo, busca en common, luego en website.
 */
export const getThemeFallback = (module, key) =>
  THEME_FALLBACK_COLORS[module]?.[key]
  ?? THEME_FALLBACK_COLORS.common?.[key]
  ?? THEME_FALLBACK_COLORS.website?.[key];
