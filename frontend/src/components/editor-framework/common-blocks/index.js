/**
 * ====================================================================
 * COMMON BLOCKS - Barrel Export
 * ====================================================================
 * Bloques comunes compartidos entre editores (Website, Invitaciones).
 *
 * @version 1.1.0
 * @since 2026-02-04
 */

// Hooks
export { useCommonBlockEditor } from './hooks';

// Config y defaults
export * from './config';

// Bloques
export {
  // Separador
  SeparadorEditor,
  SEPARADOR_CONFIG_INVITACIONES,
  SEPARADOR_CONFIG_WEBSITE,
  // Video
  VideoEditor,
  VIDEO_CONFIG_INVITACIONES,
  VIDEO_CONFIG_WEBSITE,
  // Galería
  GaleriaEditor,
  GALERIA_CONFIG_INVITACIONES,
  GALERIA_CONFIG_WEBSITE,
  // FAQ
  FaqEditor,
  FAQ_CONFIG_INVITACIONES,
  FAQ_CONFIG_WEBSITE,
  // Countdown
  CountdownEditor,
  COUNTDOWN_CONFIG_INVITACIONES,
  COUNTDOWN_CONFIG_WEBSITE,
} from './blocks';
