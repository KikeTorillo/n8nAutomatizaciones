/**
 * Constantes centralizadas del módulo eventos-digitales
 */
import { TIPOS_EVENTO } from '@/schemas/evento.schema';

/**
 * Tema por defecto para invitaciones (7 colores + 2 fuentes)
 * Usado como fallback cuando una plantilla no define tema propio.
 */
export const INVITACION_TEMA_DEFAULT = {
  color_primario: '#ec4899',
  color_secundario: '#fce7f3',
  color_fondo: '#fdf2f8',
  color_texto: '#1f2937',
  color_texto_claro: '#6b7280',
  fuente_titulo: 'Playfair Display',
  fuente_cuerpo: 'Inter',
};

/**
 * Campos extra de decoración para admin (PlantillasPage)
 */
export const INVITACION_TEMA_DECORACION_DEFAULTS = {
  patron_fondo: 'none',
  patron_opacidad: 0.1,
  decoracion_esquinas: 'none',
  icono_principal: 'none',
  animacion_entrada: 'fade',
  efecto_titulo: 'none',
  marco_fotos: 'none',
  stickers: [],
};

/**
 * Emojis por tipo de evento (para galería pública)
 */
export const TIPOS_EVENTO_EMOJIS = {
  boda: '💍',
  xv_anos: '👑',
  cumpleanos: '🎂',
  bautizo: '✨',
  corporativo: '🏢',
  otro: '🎉',
};

/**
 * Categorías para TemplateGalleryModal/Panel
 * Derivadas de TIPOS_EVENTO del schema (source of truth)
 */
export const TIPOS_EVENTO_CATEGORIES = TIPOS_EVENTO.map(t => ({
  key: t.value,
  label: t.label,
}));
