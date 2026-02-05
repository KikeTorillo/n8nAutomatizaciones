/**
 * ====================================================================
 * ELEMENT EDITORS
 * ====================================================================
 * Barrel export de todos los editores de elementos.
 *
 * @version 1.1.0
 * @since 2026-02-04
 */

// Built-in editors
export { default as TextoElementEditor } from './TextoElementEditor';
export { default as ImagenElementEditor } from './ImagenElementEditor';
export { default as BotonElementEditor } from './BotonElementEditor';

// Invitaciones-specific editors
export { default as CountdownElementEditor } from './CountdownElementEditor';
export { default as CalendarioElementEditor } from './CalendarioElementEditor';
export { default as RsvpButtonElementEditor } from './RsvpButtonElementEditor';
export { default as TimelineElementEditor } from './TimelineElementEditor';

// Imports estáticos para getElementEditor
import TextoElementEditorStatic from './TextoElementEditor';
import ImagenElementEditorStatic from './ImagenElementEditor';
import BotonElementEditorStatic from './BotonElementEditor';
import CountdownElementEditorStatic from './CountdownElementEditor';
import CalendarioElementEditorStatic from './CalendarioElementEditor';
import RsvpButtonElementEditorStatic from './RsvpButtonElementEditor';
import TimelineElementEditorStatic from './TimelineElementEditor';

/**
 * Obtiene el editor para un tipo de elemento
 * @param {string} tipo - Tipo del elemento
 * @returns {React.ComponentType|null}
 */
export function getElementEditor(tipo) {
  switch (tipo) {
    // Built-in
    case 'texto':
      return TextoElementEditorStatic;
    case 'imagen':
      return ImagenElementEditorStatic;
    case 'boton':
      return BotonElementEditorStatic;
    // Invitaciones
    case 'countdown':
      return CountdownElementEditorStatic;
    case 'calendario':
      return CalendarioElementEditorStatic;
    case 'rsvp_button':
      return RsvpButtonElementEditorStatic;
    case 'timeline':
      return TimelineElementEditorStatic;
    default:
      return null;
  }
}
