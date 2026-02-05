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
  SEPARADOR_CONFIG_MINIMAL,
  SEPARADOR_CONFIG_FULL,
  // Video
  VideoEditor,
  VIDEO_CONFIG_MINIMAL,
  VIDEO_CONFIG_FULL,
  // Galería
  GaleriaEditor,
  GALERIA_CONFIG_MINIMAL,
  GALERIA_CONFIG_FULL,
  // FAQ
  FaqEditor,
  FAQ_CONFIG_MINIMAL,
  FAQ_CONFIG_FULL,
  // Countdown
  CountdownEditor,
  COUNTDOWN_CONFIG_MINIMAL,
  COUNTDOWN_CONFIG_FULL,
} from './blocks';
