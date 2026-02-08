/**
 * ====================================================================
 * USE WEBSITE AUTOSAVE
 * ====================================================================
 * Lógica de autosave extraída de WebsiteEditorContext.
 */

import { useCallback } from 'react';
import { useAutosave, hashBloques } from '@/components/editor-framework';

/**
 * Hook de autosave para el Website editor
 *
 * @param {Object} params
 * @param {Array} params.bloques - Bloques actuales
 * @param {Object} params.actualizarBloque - Mutation de actualización
 * @param {Function} params.actualizarVersionBloque - Actualiza versión en store
 * @param {boolean} params.tieneClambiosLocales - Si hay cambios sin guardar
 * @param {Function} params.setGuardando - Callback inicio guardado
 * @param {Function} params.setGuardado - Callback guardado exitoso
 * @param {Function} params.setErrorGuardado - Callback error guardado
 * @param {Function} params.setConflictoVersion - Callback conflicto de versión
 */
export function useWebsiteAutosave({
  bloques,
  actualizarBloque,
  actualizarVersionBloque,
  tieneClambiosLocales,
  setGuardando,
  setGuardado,
  setErrorGuardado,
  setConflictoVersion,
}) {
  const handleSaveAll = useCallback(
    async (bloquesToSave) => {
      for (const bloque of bloquesToSave) {
        const resultado = await actualizarBloque.mutateAsync({
          id: bloque.id,
          data: {
            contenido: bloque.contenido,
            version: bloque.version,
          },
          paginaId: bloque.pagina_id,
        });
        if (resultado?.version) {
          actualizarVersionBloque(bloque.id, resultado.version);
        }
      }
    },
    [actualizarBloque, actualizarVersionBloque]
  );

  const { guardarAhora, estaGuardando } = useAutosave({
    onSave: handleSaveAll,
    enabled: true,
    debounceMs: 3000,
    items: bloques,
    hasChanges: tieneClambiosLocales,
    computeHash: hashBloques,
    onSaving: () => setGuardando(),
    onSaved: () => setGuardado(),
    onError: () => setErrorGuardado(),
    onConflict: ({ mensaje }) =>
      setConflictoVersion({ mensaje, timestamp: new Date().toISOString() }),
  });

  return { guardarAhora, estaGuardando };
}
