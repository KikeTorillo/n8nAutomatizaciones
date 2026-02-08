/**
 * ====================================================================
 * THEME CONFIG - Website
 * ====================================================================
 * Constantes de tema compartidas entre SidebarContainer y DrawersContainer.
 *
 * @since 2026-02-05
 */

import { FUENTES_DISPONIBLES } from '@/components/editor-framework';
import { WEBSITE_THEME_PRESETS, WEBSITE_DEFAULT_COLORS } from '@/constants/colors';

export const TEMAS_PREDEFINIDOS = WEBSITE_THEME_PRESETS;

export const COLOR_FIELDS = [
  { key: 'primario', label: 'Color primario' },
  { key: 'secundario', label: 'Color secundario' },
  { key: 'fondo', label: 'Fondo' },
  { key: 'texto', label: 'Texto' },
];

export const FONT_FIELDS = [
  { key: 'fuente_titulos', label: 'Títulos', options: FUENTES_DISPONIBLES },
  { key: 'fuente_cuerpo', label: 'Cuerpo', options: FUENTES_DISPONIBLES },
];

// Funciones extractoras para useThemeSave
export const extractWebsiteColors = (config) => ({
  primario: config?.tema?.colores?.primario || WEBSITE_DEFAULT_COLORS.primario,
  secundario: config?.tema?.colores?.secundario || WEBSITE_DEFAULT_COLORS.secundario,
  fondo: config?.tema?.colores?.fondo || WEBSITE_DEFAULT_COLORS.fondo,
  texto: config?.tema?.colores?.texto || WEBSITE_DEFAULT_COLORS.texto,
});

export const extractWebsiteFonts = (config) => ({
  fuente_titulos: config?.tema?.fuente_titulos || 'Inter',
  fuente_cuerpo: config?.tema?.fuente_cuerpo || 'Inter',
});

export const buildWebsiteThemePayload = (config) => ({ colores, fuentes }) => ({
  id: config.id,
  data: {
    version: config.version,
    color_primario: colores.primario,
    color_secundario: colores.secundario,
    color_fondo: colores.fondo,
    color_texto: colores.texto,
    fuente_titulos: fuentes?.fuente_titulos,
    fuente_cuerpo: fuentes?.fuente_cuerpo,
  },
});
