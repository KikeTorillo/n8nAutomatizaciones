/**
 * ====================================================================
 * INVITACION EDITOR STORE
 * ====================================================================
 * Store de Zustand para el editor de invitaciones digitales.
 * Creado usando createEditorStore factory function.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { createEditorStore, createEditorSelectors } from './createEditorStore';
import { getBlockDefaults } from '@/pages/eventos-digitales/editor/config';

// ========== CREAR STORE ==========

export const useInvitacionEditorStore = createEditorStore({
  name: 'invitacion-editor-store',
  persist: true,
  getDefaults: getBlockDefaults,
});

// ========== SELECTORES ==========

const baseSelectors = createEditorSelectors(useInvitacionEditorStore);

// Exportar selectores individuales
export const selectBloques = baseSelectors.selectBloques;
export const selectBloqueSeleccionado = baseSelectors.selectBloqueSeleccionado;
export const selectBloqueSeleccionadoId = baseSelectors.selectBloqueSeleccionadoId;
export const selectBloquesVisibles = baseSelectors.selectBloquesVisibles;
export const selectModoEdicion = baseSelectors.selectModoEdicion;
export const selectBreakpoint = baseSelectors.selectBreakpoint;
export const selectZoom = baseSelectors.selectZoom;
export const selectBloqueEditandoInline = baseSelectors.selectBloqueEditandoInline;
export const selectEstadoGuardado = baseSelectors.selectEstadoGuardado;
export const selectTieneCambios = baseSelectors.selectTieneCambios;
export const selectUltimoGuardado = baseSelectors.selectUltimoGuardado;
export const selectPuedeUndo = baseSelectors.selectPuedeUndo;
export const selectPuedeRedo = baseSelectors.selectPuedeRedo;
export const selectConflictoVersion = baseSelectors.selectConflictoVersion;
export const selectBloqueRecienAgregado = baseSelectors.selectBloqueRecienAgregado;

// Acciones como selectores
export const selectSetBloques = baseSelectors.selectSetBloques;
export const selectActualizarBloqueLocal = baseSelectors.selectActualizarBloqueLocal;
export const selectSeleccionarBloque = baseSelectors.selectSeleccionarBloque;
export const selectDeseleccionarBloque = baseSelectors.selectDeseleccionarBloque;
export const selectEliminarBloqueLocal = baseSelectors.selectEliminarBloqueLocal;
export const selectDuplicarBloqueLocal = baseSelectors.selectDuplicarBloqueLocal;
export const selectToggleVisibilidad = baseSelectors.selectToggleVisibilidad;
export const selectInsertarBloqueEnPosicion = baseSelectors.selectInsertarBloqueEnPosicion;
export const selectReordenarBloquesLocal = baseSelectors.selectReordenarBloquesLocal;

// ========== HOOKS CONVENIENTES ==========

/**
 * Hook para obtener bloque por ID
 * @param {string} id - ID del bloque
 * @returns {Object|undefined} Bloque o undefined
 */
export const useBloqueById = (id) =>
  useInvitacionEditorStore((state) =>
    state.bloques.find((b) => b.id === id)
  );

/**
 * Hook para verificar si un bloque está seleccionado
 * @param {string} id - ID del bloque
 * @returns {boolean} true si está seleccionado
 */
export const useIsBloqueSeleccionado = (id) =>
  useInvitacionEditorStore((state) => state.bloqueSeleccionado === id);

/**
 * Hook para obtener todas las acciones de bloques
 * @returns {Object} Acciones del store
 */
export const useInvitacionEditorActions = () =>
  useInvitacionEditorStore((state) => ({
    setBloques: state.setBloques,
    actualizarBloqueLocal: state.actualizarBloqueLocal,
    actualizarEstilosLocal: state.actualizarEstilosLocal,
    reordenarBloquesLocal: state.reordenarBloquesLocal,
    agregarBloqueLocal: state.agregarBloqueLocal,
    eliminarBloqueLocal: state.eliminarBloqueLocal,
    duplicarBloqueLocal: state.duplicarBloqueLocal,
    toggleVisibilidadBloque: state.toggleVisibilidadBloque,
    insertarBloqueEnPosicion: state.insertarBloqueEnPosicion,
    seleccionarBloque: state.seleccionarBloque,
    deseleccionarBloque: state.deseleccionarBloque,
    setModoEdicion: state.setModoEdicion,
    setBreakpoint: state.setBreakpoint,
    setZoom: state.setZoom,
    activarEdicionInline: state.activarEdicionInline,
    desactivarEdicionInline: state.desactivarEdicionInline,
    setGuardando: state.setGuardando,
    setGuardado: state.setGuardado,
    setErrorGuardado: state.setErrorGuardado,
    actualizarVersionBloque: state.actualizarVersionBloque,
    setConflictoVersion: state.setConflictoVersion,
    clearConflictoVersion: state.clearConflictoVersion,
    reset: state.reset,
    limpiarBloques: state.limpiarBloques,
  }));

// ========== TEMPORAL STORE (UNDO/REDO) ==========

/**
 * Hook para acceder al historial temporal
 */
export const useInvitacionTemporalStore = () =>
  useInvitacionEditorStore.temporal?.getState();

/**
 * Hook para ejecutar undo
 */
export const useInvitacionUndo = () => {
  const temporal = useInvitacionEditorStore.temporal;
  return () => {
    if (!temporal) return;
    const { undo, pastStates } = temporal.getState();
    if (pastStates?.length > 0) {
      undo();
    }
  };
};

/**
 * Hook para ejecutar redo
 */
export const useInvitacionRedo = () => {
  const temporal = useInvitacionEditorStore.temporal;
  return () => {
    if (!temporal) return;
    const { redo, futureStates } = temporal.getState();
    if (futureStates?.length > 0) {
      redo();
    }
  };
};

/**
 * Hook para obtener si puede hacer undo/redo
 */
export const useInvitacionCanUndoRedo = () => {
  const temporal = useInvitacionEditorStore.temporal;
  if (!temporal) {
    return { canUndo: false, canRedo: false };
  }
  const { pastStates, futureStates } = temporal.getState();
  return {
    canUndo: (pastStates?.length || 0) > 0,
    canRedo: (futureStates?.length || 0) > 0,
  };
};

export default useInvitacionEditorStore;
