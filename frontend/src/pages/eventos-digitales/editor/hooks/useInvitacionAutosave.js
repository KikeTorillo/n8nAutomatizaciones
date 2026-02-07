/**
 * ====================================================================
 * useInvitacionAutosave
 * ====================================================================
 * Maneja ambos autosave: bloques tradicionales y secciones de modo libre.
 *
 * Extraído de InvitacionEditorContext para reducir complejidad.
 *
 * @since 2026-02-07
 */

import { toast } from 'sonner';

import {
  useAutosave,
  hashBloques,
  seccionesToBloques,
  hashSecciones,
} from '@/components/editor-framework';

/**
 * @param {Object} options
 * @param {string} options.modoEditor - 'canvas' | 'bloques' | 'libre'
 * @param {Array} options.bloques - Bloques actuales
 * @param {string} options.estadoGuardado - Estado de guardado de bloques
 * @param {Array} options.seccionesSnapshot - Snapshot de secciones libre
 * @param {string} options.estadoGuardadoLibreSnapshot - Estado guardado libre
 * @param {Object} options.guardarBloquesMutation - Mutation de guardado
 * @param {Function} options.getFreePositionStore - Getter del store libre
 * @param {Function} options.setGuardando
 * @param {Function} options.setGuardado
 * @param {Function} options.setErrorGuardado
 * @param {Object} options.queryClient
 * @param {string} options.eventoId
 * @param {Array} options.bloquesQueryKey - Query key para invalidar
 */
export function useInvitacionAutosave({
  modoEditor,
  bloques,
  estadoGuardado,
  seccionesSnapshot,
  estadoGuardadoLibreSnapshot,
  guardarBloquesMutation,
  getFreePositionStore,
  setGuardando,
  setGuardado,
  setErrorGuardado,
  queryClient,
  eventoId,
  bloquesQueryKey,
}) {
  // Autosave para bloques tradicionales
  const { guardarAhora } = useAutosave({
    onSave: async (bloquesAGuardar) => {
      await guardarBloquesMutation.mutateAsync(bloquesAGuardar);
    },
    enabled: modoEditor !== 'libre',
    debounceMs: 2000,
    items: bloques,
    hasChanges: estadoGuardado === 'unsaved',
    computeHash: hashBloques,
    onSaving: () => setGuardando(),
    onSaved: () => {
      setGuardado();
      queryClient.invalidateQueries({ queryKey: bloquesQueryKey });
    },
    onError: (error) => {
      setErrorGuardado();
      toast.error('Error al guardar los cambios');
      console.error('[InvitacionEditor] Error guardando:', error);
    },
    onConflict: ({ mensaje }) => {
      toast.error(mensaje || 'Conflicto de versión detectado', { duration: 6000 });
    },
  });

  // Autosave para modo libre (secciones)
  const { guardarAhora: guardarSeccionesAhora } = useAutosave({
    onSave: async () => {
      const store = getFreePositionStore();
      const secciones = store.getState().secciones;
      const bloquesConvertidos = seccionesToBloques(secciones);
      await guardarBloquesMutation.mutateAsync(bloquesConvertidos);
    },
    enabled: modoEditor === 'libre',
    debounceMs: 2000,
    items: seccionesSnapshot,
    hasChanges: estadoGuardadoLibreSnapshot === 'unsaved',
    computeHash: hashSecciones,
    onSaving: () => {
      const store = getFreePositionStore();
      store.getState().setGuardando();
    },
    onSaved: () => {
      const store = getFreePositionStore();
      store.getState().setGuardado();
      queryClient.invalidateQueries({ queryKey: bloquesQueryKey });
    },
    onError: (error) => {
      const store = getFreePositionStore();
      store.getState().setErrorGuardado();
      toast.error('Error al guardar los cambios');
      console.error('[InvitacionEditor] Error guardando modo libre:', error);
    },
    onConflict: ({ mensaje }) => {
      toast.error(mensaje || 'Conflicto de versión detectado', { duration: 6000 });
    },
  });

  return { guardarAhora, guardarSeccionesAhora };
}
