/**
 * ====================================================================
 * WEBSITE EDITOR STORE
 * ====================================================================
 * Store de Zustand para el editor del Website Builder.
 * Creado usando createEditorStore factory function.
 *
 * Migrado de 567 líneas manuales a factory (Feb 2026 - Auditoría Fase 1).
 */

import { createEditorStore, createEditorSelectors } from './createEditorStore';

// ========== CREAR STORE ==========

const useWebsiteEditorStore = createEditorStore({
  name: 'website-editor-storage',
  persist: true,
  storage: 'localStorage',
  deselectOnPreview: true,
  persistFields: (state) => ({
    bloques: state.bloques,
    recursoId: state.recursoId,
    zoom: state.zoom,
    breakpoint: state.breakpoint,
  }),
  persistVersion: 2,
  persistMigrate: (persistedState, version) => {
    if (version < 2) {
      // v1 → v2: renombrar paginaActivaId → recursoId
      const { paginaActivaId, ...rest } = persistedState;
      return { ...rest, recursoId: paginaActivaId ?? null };
    }
    return persistedState;
  },
});

// ========== SELECTORES ==========

const sel = createEditorSelectors(useWebsiteEditorStore);

// Bloques
export const selectBloques = sel.selectBloques;
export const selectBloqueSeleccionado = (state) => state.bloqueSeleccionado;
export const selectBloqueEditandoInline = sel.selectBloqueEditandoInline;

// Selector para obtener el bloque seleccionado completo (equivale a sel.selectBloqueSeleccionado)
export const selectBloqueSeleccionadoCompleto = sel.selectBloqueSeleccionado;

// Modo y UI
export const selectModoEdicion = sel.selectModoEdicion;
export const selectBreakpoint = sel.selectBreakpoint;
export const selectZoom = sel.selectZoom;

// Estado guardado
export const selectEstadoGuardado = sel.selectEstadoGuardado;
export const selectUltimoGuardado = sel.selectUltimoGuardado;
export const selectTieneCambiosLocales = sel.selectTieneCambios;

// Historial (undo/redo)
export const selectPuedeUndo = sel.selectPuedeUndo;
export const selectPuedeRedo = sel.selectPuedeRedo;

// Página activa (alias de recursoId)
export const selectPaginaActivaId = sel.selectRecursoId;

// Bloque recien agregado (para animacion)
export const selectBloqueRecienAgregado = sel.selectBloqueRecienAgregado;

// Conflicto de versión (bloqueo optimista)
export const selectConflictoVersion = sel.selectConflictoVersion;

// ========== ACCIONES ==========

export const selectSetBloques = sel.selectSetBloques;
export const selectActualizarBloqueLocal = sel.selectActualizarBloqueLocal;
export const selectActualizarEstilosLocal = sel.selectActualizarEstilosLocal;
export const selectReordenarBloquesLocal = sel.selectReordenarBloquesLocal;
export const selectAgregarBloqueLocal = sel.selectAgregarBloqueLocal;
export const selectEliminarBloqueLocal = sel.selectEliminarBloqueLocal;
export const selectDuplicarBloqueLocal = sel.selectDuplicarBloqueLocal;
export const selectToggleVisibilidadBloque = sel.selectToggleVisibilidad;
export const selectInsertarBloqueEnPosicion = sel.selectInsertarBloqueEnPosicion;

export const selectSeleccionarBloque = sel.selectSeleccionarBloque;
export const selectDeseleccionarBloque = sel.selectDeseleccionarBloque;
// Alias: website usa activarInlineEditing, factory usa activarEdicionInline
export const selectActivarInlineEditing = sel.selectActivarEdicionInline;
export const selectDesactivarInlineEditing = sel.selectDesactivarEdicionInline;

export const selectSetModoEdicion = sel.selectSetModoEdicion;
export const selectSetBreakpoint = sel.selectSetBreakpoint;
export const selectSetZoom = sel.selectSetZoom;

export const selectSetGuardando = sel.selectSetGuardando;
export const selectSetGuardado = sel.selectSetGuardado;
export const selectSetErrorGuardado = sel.selectSetErrorGuardado;

export const selectSetBloqueRecienAgregado = sel.selectSetBloqueRecienAgregado;
export const selectClearBloqueRecienAgregado = sel.selectClearBloqueRecienAgregado;

export const selectSetConflictoVersion = sel.selectSetConflictoVersion;
export const selectClearConflictoVersion = sel.selectClearConflictoVersion;
export const selectActualizarVersionBloque = sel.selectActualizarVersionBloque;

export const selectReset = sel.selectReset;

// ========== TEMPORAL STORE (UNDO/REDO) ==========

/**
 * Hook para acceder al historial temporal
 * @example
 * const { undo, redo, clear, pastStates, futureStates } = useTemporalStore();
 */
export const useTemporalStore = () => useWebsiteEditorStore.temporal.getState();

/**
 * Hook para ejecutar undo
 */
export const useUndo = () => {
  const temporal = useWebsiteEditorStore.temporal;
  return () => {
    const { undo, pastStates } = temporal.getState();
    if (pastStates.length > 0) {
      undo();
    }
  };
};

/**
 * Hook para ejecutar redo
 */
export const useRedo = () => {
  const temporal = useWebsiteEditorStore.temporal;
  return () => {
    const { redo, futureStates } = temporal.getState();
    if (futureStates.length > 0) {
      redo();
    }
  };
};

/**
 * Hook para obtener si puede hacer undo/redo
 */
export const useCanUndoRedo = () => {
  const temporal = useWebsiteEditorStore.temporal;
  const { pastStates, futureStates } = temporal.getState();
  return {
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
};

export default useWebsiteEditorStore;
