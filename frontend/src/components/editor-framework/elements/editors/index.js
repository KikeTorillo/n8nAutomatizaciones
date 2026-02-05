/**
 * ====================================================================
 * ELEMENT EDITORS
 * ====================================================================
 * Barrel export de editores de elementos built-in.
 * Los editores específicos de cada módulo se registran dinámicamente.
 *
 * @version 2.0.0
 * @since 2026-02-04
 * @updated 2026-02-05 - Movidos editors de invitación al módulo eventos-digitales
 */

// Built-in editors
export { default as TextoElementEditor } from './TextoElementEditor';
export { default as ImagenElementEditor } from './ImagenElementEditor';
export { default as BotonElementEditor } from './BotonElementEditor';

// Imports estáticos para getElementEditor
import TextoElementEditorStatic from './TextoElementEditor';
import ImagenElementEditorStatic from './ImagenElementEditor';
import BotonElementEditorStatic from './BotonElementEditor';

/**
 * Obtiene el editor para un tipo de elemento built-in.
 * @param {string} tipo - Tipo del elemento
 * @returns {React.ComponentType|null}
 */
export function getElementEditor(tipo) {
  switch (tipo) {
    case 'texto':
      return TextoElementEditorStatic;
    case 'imagen':
      return ImagenElementEditorStatic;
    case 'boton':
      return BotonElementEditorStatic;
    default:
      return null;
  }
}
