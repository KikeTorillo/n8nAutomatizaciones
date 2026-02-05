/**
 * ====================================================================
 * ELEMENT RENDERERS
 * ====================================================================
 * Barrel export de todos los renderers de elementos.
 *
 * @version 1.2.0
 * @since 2026-02-04
 */

// Built-in renderers
export { default as TextoElementRenderer } from './TextoElementRenderer';
export { default as ImagenElementRenderer } from './ImagenElementRenderer';
export { default as BotonElementRenderer } from './BotonElementRenderer';
export { default as FormaElementRenderer } from './FormaElementRenderer';
export { default as SeparadorElementRenderer } from './SeparadorElementRenderer';

// Invitaciones-specific renderers
export { default as CountdownElementRenderer } from './CountdownElementRenderer';
export { default as CalendarioElementRenderer } from './CalendarioElementRenderer';
export { default as RsvpButtonElementRenderer } from './RsvpButtonElementRenderer';
export { default as TimelineElementRenderer } from './TimelineElementRenderer';
export { default as HeroInvitacionElementRenderer } from './HeroInvitacionElementRenderer';
export { default as ProtagonistasElementRenderer } from './ProtagonistasElementRenderer';
export { default as UbicacionElementRenderer } from './UbicacionElementRenderer';
export { default as GaleriaElementRenderer } from './GaleriaElementRenderer';
export { default as FaqElementRenderer } from './FaqElementRenderer';
export { default as MesaRegalosElementRenderer } from './MesaRegalosElementRenderer';

// Imports estáticos para getElementRenderer
import TextoElementRendererStatic from './TextoElementRenderer';
import ImagenElementRendererStatic from './ImagenElementRenderer';
import BotonElementRendererStatic from './BotonElementRenderer';
import FormaElementRendererStatic from './FormaElementRenderer';
import SeparadorElementRendererStatic from './SeparadorElementRenderer';
import CountdownElementRendererStatic from './CountdownElementRenderer';
import CalendarioElementRendererStatic from './CalendarioElementRenderer';
import RsvpButtonElementRendererStatic from './RsvpButtonElementRenderer';
import TimelineElementRendererStatic from './TimelineElementRenderer';
import HeroInvitacionElementRendererStatic from './HeroInvitacionElementRenderer';
import ProtagonistasElementRendererStatic from './ProtagonistasElementRenderer';
import UbicacionElementRendererStatic from './UbicacionElementRenderer';
import GaleriaElementRendererStatic from './GaleriaElementRenderer';
import FaqElementRendererStatic from './FaqElementRenderer';
import MesaRegalosElementRendererStatic from './MesaRegalosElementRenderer';

/**
 * Obtiene el renderer para un tipo de elemento
 * @param {string} tipo - Tipo del elemento
 * @returns {React.ComponentType|null}
 */
export function getElementRenderer(tipo) {
  switch (tipo) {
    // Built-in
    case 'texto':
      return TextoElementRendererStatic;
    case 'imagen':
      return ImagenElementRendererStatic;
    case 'boton':
      return BotonElementRendererStatic;
    case 'forma':
      return FormaElementRendererStatic;
    case 'separador':
      return SeparadorElementRendererStatic;
    // Invitaciones - básicos
    case 'countdown':
      return CountdownElementRendererStatic;
    case 'calendario':
      return CalendarioElementRendererStatic;
    case 'rsvp_button':
      return RsvpButtonElementRendererStatic;
    case 'timeline':
      return TimelineElementRendererStatic;
    // Invitaciones - complejos
    case 'hero_invitacion':
      return HeroInvitacionElementRendererStatic;
    case 'protagonistas':
      return ProtagonistasElementRendererStatic;
    case 'ubicacion':
      return UbicacionElementRendererStatic;
    case 'galeria':
      return GaleriaElementRendererStatic;
    case 'faq':
      return FaqElementRendererStatic;
    case 'mesa_regalos':
      return MesaRegalosElementRendererStatic;
    default:
      return null;
  }
}
