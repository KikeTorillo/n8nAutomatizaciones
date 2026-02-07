/**
 * Barrel export para configuración del editor de invitaciones
 */
export {
  BLOQUES_INVITACION,
  CATEGORIAS_BLOQUES,
  BLOCK_ICONS,
  BLOCK_NAMES,
  BLOCK_DESCRIPTIONS,
  BLOCK_CONFIGS,
  BLOCK_DEFAULTS,
  getBlockDefaults,
  getBlockConfig,
  crearBloqueNuevo,
} from './invitacionBlocks';

export {
  ANIMACIONES_DECORATIVAS,
  VELOCIDADES,
  TAMANOS,
  getAnimacionById,
  getTamanoHeight,
} from './animacionesDecorativas';

export { MARCOS_PRESETS } from './marcosPresets';

export {
  TEMAS_POR_TIPO,
  COLOR_FIELDS,
  FONT_FIELDS,
  PATRONES_FONDO,
  DECORACIONES_ESQUINAS,
  ICONOS_PRINCIPALES,
  EFECTOS_TITULO,
  MARCOS_FOTOS,
  ANIMACIONES_ENTRADA,
  STICKERS_DISPONIBLES,
  extractInvitacionColors,
  extractInvitacionFonts,
  buildInvitacionThemePayload,
} from './themeConfig';
