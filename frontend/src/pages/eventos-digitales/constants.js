/**
 * Constantes centralizadas del módulo eventos-digitales
 */
import { TIPOS_EVENTO } from '@/schemas/evento.schema';

/**
 * Tema por defecto para invitaciones (7 colores + 2 fuentes)
 * Usado como fallback cuando una plantilla no define tema propio.
 */
export const INVITACION_TEMA_DEFAULT = {
  // Colores (rosa = default para invitaciones)
  color_primario: '#ec4899',
  color_secundario: '#fce7f3',
  color_fondo: '#fdf2f8',
  color_texto: '#1f2937',
  color_texto_claro: '#6b7280',
  // Fuentes
  fuente_titulo: 'Playfair Display',
  fuente_cuerpo: 'Inter',
  // Decoraciones
  patron_fondo: 'none',
  patron_opacidad: 0.1,
  decoracion_esquinas: 'none',
  icono_principal: 'none',
  efecto_titulo: 'none',
  marco_fotos: 'none',
  animacion_entrada: 'fade',
  stickers: [],
};

/**
 * Migración lazy: crea bloque apertura a partir de config legacy.
 * Duplicado anteriormente en InvitacionEditorContext y EventoPublicoPage.
 *
 * @param {Object|null} configuracion - evento.configuracion
 * @returns {Object|null} Bloque apertura o null si no hay config legacy
 */
export function crearBloqueAperturaLegacy(configuracion) {
  if (!configuracion) return null;
  const cfg = configuracion;
  const tieneConfigLegacy =
    (cfg.animacion_apertura && cfg.animacion_apertura !== 'none') ||
    (cfg.modo_apertura === 'imagen' && cfg.imagen_apertura);
  if (!tieneConfigLegacy) return null;
  return {
    id: crypto.randomUUID(),
    tipo: 'apertura',
    orden: -1,
    visible: true,
    contenido: {
      modo: cfg.modo_apertura || 'animacion',
      animacion: cfg.animacion_apertura || 'sobre',
      imagen_url: cfg.imagen_apertura || '',
      texto: cfg.texto_apertura || 'Desliza para abrir',
    },
    estilos: {},
    version: 1,
  };
}

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
