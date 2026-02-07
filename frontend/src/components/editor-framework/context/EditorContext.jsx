/**
 * ====================================================================
 * EDITOR CONTEXT (Compartido)
 * ====================================================================
 * Contexto React compartido entre InvitacionEditorProvider y
 * PlantillaEditorProvider. Permite que los containers del editor
 * funcionen con cualquier provider sin cambiar imports.
 *
 * @since 2026-02-06
 */

import { createContext, useContext } from 'react';

const EditorContext = createContext(null);

/**
 * Hook para acceder al contexto del editor compartido
 * @returns {Object} Contexto del editor
 * @throws {Error} Si se usa fuera de un EditorProvider
 */
export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor debe usarse dentro de un EditorProvider (InvitacionEditorProvider o PlantillaEditorProvider)');
  }
  return context;
}

export { EditorContext };
export default EditorContext;
