/**
 * ====================================================================
 * CANVAS BLOCKS - INVITACIONES DIGITALES
 * ====================================================================
 * Barrel export para todos los canvas blocks de invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

// Wrapper principal
export { default as CanvasBlock } from './CanvasBlock';

// Canvas blocks individuales
export { default as HeroInvitacionCanvasBlock } from './HeroInvitacionCanvasBlock';
export { default as ProtagonistasCanvasBlock } from './ProtagonistasCanvasBlock';
export { default as CountdownCanvasBlock } from './CountdownCanvasBlock';
export { default as TimelineCanvasBlock } from './TimelineCanvasBlock';
export { default as UbicacionCanvasBlock } from './UbicacionCanvasBlock';
export { default as RSVPCanvasBlock } from './RSVPCanvasBlock';
export { default as MesaRegalosCanvasBlock } from './MesaRegalosCanvasBlock';
export { default as GaleriaCanvasBlock } from './GaleriaCanvasBlock';
export { default as VideoCanvasBlock } from './VideoCanvasBlock';
export { default as TextoCanvasBlock } from './TextoCanvasBlock';
export { default as FaqCanvasBlock } from './FaqCanvasBlock';
export { default as SeparadorCanvasBlock } from './SeparadorCanvasBlock';

// ========== MAPA DE COMPONENTES POR TIPO ==========

import HeroInvitacionCanvasBlock from './HeroInvitacionCanvasBlock';
import ProtagonistasCanvasBlock from './ProtagonistasCanvasBlock';
import CountdownCanvasBlock from './CountdownCanvasBlock';
import TimelineCanvasBlock from './TimelineCanvasBlock';
import UbicacionCanvasBlock from './UbicacionCanvasBlock';
import RSVPCanvasBlock from './RSVPCanvasBlock';
import MesaRegalosCanvasBlock from './MesaRegalosCanvasBlock';
import GaleriaCanvasBlock from './GaleriaCanvasBlock';
import VideoCanvasBlock from './VideoCanvasBlock';
import TextoCanvasBlock from './TextoCanvasBlock';
import FaqCanvasBlock from './FaqCanvasBlock';
import SeparadorCanvasBlock from './SeparadorCanvasBlock';

/**
 * Mapa de componentes canvas por tipo de bloque
 */
export const CANVAS_BLOCKS = {
  hero_invitacion: HeroInvitacionCanvasBlock,
  protagonistas: ProtagonistasCanvasBlock,
  countdown: CountdownCanvasBlock,
  timeline: TimelineCanvasBlock,
  ubicacion: UbicacionCanvasBlock,
  rsvp: RSVPCanvasBlock,
  mesa_regalos: MesaRegalosCanvasBlock,
  galeria: GaleriaCanvasBlock,
  video: VideoCanvasBlock,
  texto: TextoCanvasBlock,
  faq: FaqCanvasBlock,
  separador: SeparadorCanvasBlock,
};

/**
 * Obtiene el componente canvas para un tipo de bloque
 * @param {string} tipo - Tipo de bloque
 * @returns {React.Component|null} Componente canvas o null
 */
export function getCanvasComponent(tipo) {
  return CANVAS_BLOCKS[tipo] || null;
}
