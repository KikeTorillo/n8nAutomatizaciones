/**
 * ====================================================================
 * ELEMENT EDITORS
 * ====================================================================
 * Registry de editores de elementos (Map-based).
 * Los editores específicos de cada módulo se registran dinámicamente
 * con registerElementEditor/registerElementEditors.
 *
 * @version 3.0.0
 * @since 2026-02-04
 * @updated 2026-02-07 - Migrado de switch a Map registry
 */

// Built-in editors
export { default as TextoElementEditor } from './TextoElementEditor';
export { default as ImagenElementEditor } from './ImagenElementEditor';
export { default as BotonElementEditor } from './BotonElementEditor';

// Imports estáticos para el registry
import TextoElementEditorStatic from './TextoElementEditor';
import ImagenElementEditorStatic from './ImagenElementEditor';
import BotonElementEditorStatic from './BotonElementEditor';

// ========== REGISTRY ==========

const editorRegistry = new Map([
  ['texto', TextoElementEditorStatic],
  ['imagen', ImagenElementEditorStatic],
  ['boton', BotonElementEditorStatic],
]);

/**
 * Registra un editor para un tipo de elemento.
 * @param {string} tipo - Tipo del elemento
 * @param {React.ComponentType} editor - Componente editor
 */
export function registerElementEditor(tipo, editor) {
  editorRegistry.set(tipo, editor);
}

/**
 * Registra múltiples editores a la vez.
 * @param {Object} map - { tipo: EditorComponent, ... }
 */
export function registerElementEditors(map) {
  Object.entries(map).forEach(([tipo, editor]) => editorRegistry.set(tipo, editor));
}

/**
 * Obtiene el editor para un tipo de elemento.
 * @param {string} tipo - Tipo del elemento
 * @returns {React.ComponentType|null}
 */
export function getElementEditor(tipo) {
  return editorRegistry.get(tipo) || null;
}
