/**
 * ====================================================================
 * BLOCK EDITORS - INVITACIONES DIGITALES
 * ====================================================================
 * Barrel export para todos los editores de bloques de invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

// Editores de bloques
export { default as HeroInvitacionEditor } from './HeroInvitacionEditor';
export { default as CountdownEditor } from './CountdownEditor';
export { default as TimelineEditor } from './TimelineEditor';
export { default as UbicacionEditor } from './UbicacionEditor';
export { default as RSVPEditor } from './RSVPEditor';
export { default as MesaRegalosEditor } from './MesaRegalosEditor';
export { default as GaleriaEditor } from './GaleriaEditor';
export { default as VideoEditor } from './VideoEditor';
export { default as TextoEditor } from './TextoEditor';
export { default as SeparadorEditor } from './SeparadorEditor';

// ========== MAPA DE EDITORES POR TIPO ==========

import HeroInvitacionEditor from './HeroInvitacionEditor';
import CountdownEditor from './CountdownEditor';
import TimelineEditor from './TimelineEditor';
import UbicacionEditor from './UbicacionEditor';
import RSVPEditor from './RSVPEditor';
import MesaRegalosEditor from './MesaRegalosEditor';
import GaleriaEditor from './GaleriaEditor';
import VideoEditor from './VideoEditor';
import TextoEditor from './TextoEditor';
import SeparadorEditor from './SeparadorEditor';

/**
 * Mapa de componentes editores por tipo de bloque
 */
export const EDITORES_BLOQUE = {
  hero_invitacion: HeroInvitacionEditor,
  countdown: CountdownEditor,
  timeline: TimelineEditor,
  ubicacion: UbicacionEditor,
  rsvp: RSVPEditor,
  mesa_regalos: MesaRegalosEditor,
  galeria: GaleriaEditor,
  video: VideoEditor,
  texto: TextoEditor,
  separador: SeparadorEditor,
};

/**
 * Obtiene el componente editor para un tipo de bloque
 * @param {string} tipo - Tipo de bloque
 * @returns {React.Component|null} Componente editor o null
 */
export function getEditorComponent(tipo) {
  return EDITORES_BLOQUE[tipo] || null;
}
