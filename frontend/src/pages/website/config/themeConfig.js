/**
 * ====================================================================
 * THEME CONFIG - Website
 * ====================================================================
 * Constantes de tema compartidas entre SidebarContainer y DrawersContainer.
 *
 * @since 2026-02-05
 */

import { FUENTES_DISPONIBLES } from '@/components/editor-framework';

export const TEMAS_PREDEFINIDOS = [
  { id: 'default', nombre: 'Clásico', colores: { primario: '#4F46E5', secundario: '#6366F1', fondo: '#FFFFFF', texto: '#1F2937' } },
  { id: 'dark', nombre: 'Oscuro', colores: { primario: '#8B5CF6', secundario: '#A78BFA', fondo: '#111827', texto: '#F9FAFB' } },
  { id: 'nature', nombre: 'Natural', colores: { primario: '#059669', secundario: '#10B981', fondo: '#ECFDF5', texto: '#064E3B' } },
  { id: 'sunset', nombre: 'Atardecer', colores: { primario: '#DC2626', secundario: '#F97316', fondo: '#FFF7ED', texto: '#7C2D12' } },
  { id: 'ocean', nombre: 'Océano', colores: { primario: '#0284C7', secundario: '#38BDF8', fondo: '#F0F9FF', texto: '#0C4A6E' } },
];

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
  primario: config?.tema?.colores?.primario || '#4F46E5',
  secundario: config?.tema?.colores?.secundario || '#6366F1',
  fondo: config?.tema?.colores?.fondo || '#FFFFFF',
  texto: config?.tema?.colores?.texto || '#1F2937',
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
