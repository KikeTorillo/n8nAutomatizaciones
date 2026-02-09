/**
 * ====================================================================
 * CREATE EDITOR STORE - FACTORY FUNCTION
 * ====================================================================
 * Factory function para crear stores de editor de bloques.
 * Usado por Website Builder y Editor de Invitaciones.
 *
 * @version 1.1.0
 * @since 2026-02-03
 */

import { create } from 'zustand';
import { temporal } from 'zundo';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { deepEqual } from '@/components/editor-framework/hooks/compareUtils';

// ========== TYPES ==========

export interface EditorBloque {
  id: number | string;
  contenido: Record<string, unknown>;
  estilos?: Record<string, unknown>;
  orden: number;
  visible: boolean;
  version?: number;
  [key: string]: unknown;
}

interface ConflictoVersion {
  bloqueId: number | string;
  versionLocal: number;
  versionServidor: number;
}

type ModoEdicion = 'canvas' | 'properties' | 'preview';
type Breakpoint = 'desktop' | 'tablet' | 'mobile';
type EstadoGuardado = 'saved' | 'saving' | 'unsaved' | 'error';

type BloqueId = number | string;

export interface EditorState {
  // State
  bloques: EditorBloque[];
  recursoId: BloqueId | null;
  bloqueSeleccionado: BloqueId | null;
  modoEdicion: ModoEdicion;
  breakpoint: Breakpoint;
  zoom: number;
  estadoGuardado: EstadoGuardado;
  ultimoGuardado: Date | null;
  bloqueEditandoInline: BloqueId | null;
  puedeUndo: boolean;
  puedeRedo: boolean;
  tieneCambiosLocales: boolean;
  bloqueRecienAgregado: BloqueId | null;
  conflictoVersion: ConflictoVersion | null;

  // Bloques actions
  setBloques: (bloques: EditorBloque[], recursoId: BloqueId) => void;
  actualizarBloqueLocal: (id: BloqueId, contenido: Record<string, unknown>) => void;
  actualizarEstilosLocal: (id: BloqueId, estilos: Record<string, unknown>) => void;
  reordenarBloquesLocal: (nuevoOrden: BloqueId[]) => void;
  agregarBloqueLocal: (bloque: EditorBloque) => void;
  eliminarBloqueLocal: (id: BloqueId) => void;
  duplicarBloqueLocal: (id: BloqueId, nuevoId: BloqueId) => void;
  toggleVisibilidadBloque: (id: BloqueId) => void;
  insertarBloqueEnPosicion: (bloque: EditorBloque, indice?: number | null) => void;

  // Selection actions
  seleccionarBloque: (id: BloqueId | null) => void;
  deseleccionarBloque: () => void;

  // UI actions
  setModoEdicion: (modo: ModoEdicion) => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setZoom: (zoom: number) => void;
  activarEdicionInline: (id: BloqueId) => void;
  desactivarEdicionInline: () => void;
  activarInlineEditing: (id: BloqueId) => void;
  desactivarInlineEditing: () => void;

  // Save actions
  setGuardando: () => void;
  setGuardado: () => void;
  setErrorGuardado: () => void;
  actualizarVersionBloque: (id: BloqueId, version: number) => void;
  setConflictoVersion: (conflicto: ConflictoVersion) => void;
  clearConflictoVersion: () => void;

  // Animation
  setBloqueRecienAgregado: (id: BloqueId | null) => void;
  clearBloqueRecienAgregado: () => void;

  // History
  updateHistorialState: (puedeUndo: boolean, puedeRedo: boolean) => void;

  // Reset
  reset: () => void;
  limpiarBloques: () => void;
}

interface CreateEditorStoreOptions {
  name?: string;
  persist?: boolean;
  storage?: 'localStorage' | 'sessionStorage';
  persistFields?: ((state: EditorState) => Partial<EditorState>) | null;
  persistVersion?: number;
  persistMigrate?: (persistedState: unknown, version: number) => unknown;
  deselectOnPreview?: boolean;
}

// ========== FACTORY ==========

export function createEditorStore(options: CreateEditorStoreOptions = {}) {
  const {
    name = 'editor-store',
    persist: shouldPersist = true,
    storage = 'sessionStorage',
    persistFields = null,
    persistVersion = undefined,
    persistMigrate = undefined,
    deselectOnPreview = false,
  } = options;

  // Variable para cleanup del setTimeout de bloqueRecienAgregado
  let bloqueRecienAgregadoTimeout: ReturnType<typeof setTimeout> | null = null;

  // ========== INITIAL STATE ==========
  const initialState = {
    bloques: [] as EditorBloque[],
    recursoId: null as BloqueId | null,
    bloqueSeleccionado: null as BloqueId | null,
    modoEdicion: 'canvas' as ModoEdicion,
    breakpoint: 'desktop' as Breakpoint,
    zoom: 100,
    estadoGuardado: 'saved' as EstadoGuardado,
    ultimoGuardado: null as Date | null,
    bloqueEditandoInline: null as BloqueId | null,
    puedeUndo: false,
    puedeRedo: false,
    tieneCambiosLocales: false,
    bloqueRecienAgregado: null as BloqueId | null,
    conflictoVersion: null as ConflictoVersion | null,
  };

  // ========== STORE ACTIONS ==========
  type SetFn = (partial: Partial<EditorState> | ((state: EditorState) => Partial<EditorState> | EditorState)) => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storeActions = (_set: any, get: () => EditorState): EditorState => {
  const set = _set as SetFn;
  return {
    ...initialState,

    // ========== BLOQUES ACTIONS ==========

    setBloques: (bloques, recursoId) =>
      set({
        bloques: bloques || [],
        recursoId,
        tieneCambiosLocales: false,
        estadoGuardado: 'saved',
      }),

    actualizarBloqueLocal: (id, contenido) =>
      set((state) => ({
        bloques: state.bloques.map((b) =>
          b.id === id
            ? { ...b, contenido: { ...b.contenido, ...contenido } }
            : b
        ),
        tieneCambiosLocales: true,
        estadoGuardado: 'unsaved',
      })),

    actualizarEstilosLocal: (id, estilos) =>
      set((state) => ({
        bloques: state.bloques.map((b) =>
          b.id === id
            ? { ...b, estilos: { ...b.estilos, ...estilos } }
            : b
        ),
        tieneCambiosLocales: true,
        estadoGuardado: 'unsaved',
      })),

    reordenarBloquesLocal: (nuevoOrden) =>
      set((state) => {
        const bloquesMap = new Map(state.bloques.map((b) => [b.id, b]));
        const bloquesReordenados = nuevoOrden
          .map((id, index) => {
            const bloque = bloquesMap.get(id);
            return bloque ? { ...bloque, orden: index } : null;
          })
          .filter(Boolean) as EditorBloque[];

        return {
          bloques: bloquesReordenados,
          tieneCambiosLocales: true,
          estadoGuardado: 'unsaved' as const,
        };
      }),

    agregarBloqueLocal: (bloque) =>
      set((state) => ({
        bloques: [...state.bloques, bloque],
        bloqueSeleccionado: bloque.id,
        tieneCambiosLocales: true,
        estadoGuardado: 'unsaved',
      })),

    eliminarBloqueLocal: (id) =>
      set((state) => ({
        bloques: state.bloques.filter((b) => b.id !== id),
        bloqueSeleccionado:
          state.bloqueSeleccionado === id ? null : state.bloqueSeleccionado,
        bloqueEditandoInline:
          state.bloqueEditandoInline === id ? null : state.bloqueEditandoInline,
        tieneCambiosLocales: true,
        estadoGuardado: 'unsaved',
      })),

    duplicarBloqueLocal: (id, nuevoId) =>
      set((state) => {
        const bloqueOriginal = state.bloques.find((b) => b.id === id);
        if (!bloqueOriginal) return state;

        const indiceDespues = bloqueOriginal.orden + 1;
        const bloqueDuplicado = {
          ...bloqueOriginal,
          id: nuevoId,
          orden: indiceDespues,
          version: 1,
        };

        const bloquesActualizados = state.bloques.map((b) =>
          b.orden >= indiceDespues ? { ...b, orden: b.orden + 1 } : b
        );

        return {
          bloques: [...bloquesActualizados, bloqueDuplicado].sort(
            (a, b) => a.orden - b.orden
          ),
          bloqueSeleccionado: nuevoId,
          tieneCambiosLocales: true,
          estadoGuardado: 'unsaved' as const,
        };
      }),

    toggleVisibilidadBloque: (id) =>
      set((state) => ({
        bloques: state.bloques.map((b) =>
          b.id === id ? { ...b, visible: !b.visible } : b
        ),
        tieneCambiosLocales: true,
        estadoGuardado: 'unsaved',
      })),

    insertarBloqueEnPosicion: (bloque, indice = null) =>
      set((state) => {
        const posicion = indice !== null ? indice : state.bloques.length;

        const bloquesActualizados = state.bloques.map((b) =>
          b.orden >= posicion ? { ...b, orden: b.orden + 1 } : b
        );

        const nuevoBloque = {
          ...bloque,
          orden: posicion,
        };

        // Limpiar timeout anterior si existe
        if (bloqueRecienAgregadoTimeout) {
          clearTimeout(bloqueRecienAgregadoTimeout);
        }

        // Marcar bloque como recién agregado (para animación)
        bloqueRecienAgregadoTimeout = setTimeout(() => {
          set({ bloqueRecienAgregado: null });
        }, 1500);

        return {
          bloques: [...bloquesActualizados, nuevoBloque].sort(
            (a, b) => a.orden - b.orden
          ),
          bloqueSeleccionado: bloque.id,
          bloqueRecienAgregado: bloque.id,
          tieneCambiosLocales: true,
          estadoGuardado: 'unsaved' as const,
        };
      }),

    // ========== SELECCIÓN ACTIONS ==========

    seleccionarBloque: (id) =>
      set((state) => ({
        bloqueSeleccionado: id,
        bloqueEditandoInline:
          state.bloqueEditandoInline !== id ? null : state.bloqueEditandoInline,
      })),

    deseleccionarBloque: () =>
      set({
        bloqueSeleccionado: null,
        bloqueEditandoInline: null,
      }),

    // ========== UI ACTIONS ==========

    setModoEdicion: (modo) =>
      set({
        modoEdicion: modo,
        ...(deselectOnPreview && modo === 'preview' && {
          bloqueSeleccionado: null,
          bloqueEditandoInline: null,
        }),
      }),

    setBreakpoint: (breakpoint) =>
      set({ breakpoint }),

    setZoom: (zoom) =>
      set({ zoom: Math.max(50, Math.min(200, zoom)) }),

    activarEdicionInline: (id) =>
      set({
        bloqueEditandoInline: id,
        bloqueSeleccionado: id,
        modoEdicion: 'canvas',
      }),

    desactivarEdicionInline: () =>
      set({ bloqueEditandoInline: null }),

    // Aliases para compatibilidad con website editor
    activarInlineEditing: (id) =>
      set({
        bloqueEditandoInline: id,
        bloqueSeleccionado: id,
        modoEdicion: 'canvas',
      }),
    desactivarInlineEditing: () =>
      set({ bloqueEditandoInline: null }),

    // ========== GUARDADO ACTIONS ==========

    setGuardando: () =>
      set({ estadoGuardado: 'saving' }),

    setGuardado: () =>
      set({
        estadoGuardado: 'saved',
        ultimoGuardado: new Date(),
        tieneCambiosLocales: false,
      }),

    setErrorGuardado: () =>
      set({ estadoGuardado: 'error' }),

    actualizarVersionBloque: (id, version) =>
      set((state) => ({
        bloques: state.bloques.map((b) =>
          b.id === id ? { ...b, version } : b
        ),
      })),

    setConflictoVersion: (conflicto) =>
      set({ conflictoVersion: conflicto, estadoGuardado: 'error' }),

    clearConflictoVersion: () =>
      set({ conflictoVersion: null }),

    // ========== ANIMACIÓN ==========

    setBloqueRecienAgregado: (id) => {
      if (bloqueRecienAgregadoTimeout) {
        clearTimeout(bloqueRecienAgregadoTimeout);
      }
      set({ bloqueRecienAgregado: id });
      bloqueRecienAgregadoTimeout = setTimeout(() => {
        set((state) =>
          state.bloqueRecienAgregado === id
            ? { bloqueRecienAgregado: null }
            : state
        );
        bloqueRecienAgregadoTimeout = null;
      }, 1500);
    },

    clearBloqueRecienAgregado: () =>
      set({ bloqueRecienAgregado: null }),

    // ========== HISTORIAL ==========

    updateHistorialState: (puedeUndo, puedeRedo) =>
      set({ puedeUndo, puedeRedo }),

    // ========== RESET ==========

    reset: () => {
      if (bloqueRecienAgregadoTimeout) {
        clearTimeout(bloqueRecienAgregadoTimeout);
        bloqueRecienAgregadoTimeout = null;
      }
      set(initialState);
    },

    limpiarBloques: () =>
      set({
        bloques: [],
        bloqueSeleccionado: null,
        bloqueEditandoInline: null,
        tieneCambiosLocales: false,
        estadoGuardado: 'saved',
        conflictoVersion: null,
      }),
  };
  };

  // ========== CREAR STORE ==========
  const storageProvider = storage === 'localStorage' ? localStorage : sessionStorage;
  const defaultPartialize = (state: EditorState) => ({
    breakpoint: state.breakpoint,
    zoom: state.zoom,
    modoEdicion: state.modoEdicion,
  });

  if (shouldPersist) {
    return create(
      subscribeWithSelector(
        persist(
          temporal(storeActions, {
            limit: 50,
            equality: (pastState: EditorState, currentState: EditorState) =>
              deepEqual(pastState.bloques, currentState.bloques),
          }),
          {
            name: name,
            storage: createJSONStorage(() => storageProvider),
            partialize: persistFields || defaultPartialize,
            ...(persistVersion !== undefined && { version: persistVersion }),
            ...(persistMigrate && { migrate: persistMigrate }),
          }
        )
      )
    );
  }

  // Sin persistencia
  return create(
    subscribeWithSelector(
      temporal(storeActions, {
        limit: 50,
        equality: (pastState: EditorState, currentState: EditorState) =>
          deepEqual(pastState.bloques, currentState.bloques),
      })
    )
  );
}

// ========== SELECTORES GENÉRICOS ==========

export interface EditorSelectors {
  // Bloques
  selectBloques: (state: EditorState) => EditorBloque[];
  selectBloqueSeleccionado: (state: EditorState) => EditorBloque | undefined;
  selectBloqueSeleccionadoId: (state: EditorState) => BloqueId | null;
  selectBloquesVisibles: (state: EditorState) => EditorBloque[];

  // UI
  selectModoEdicion: (state: EditorState) => ModoEdicion;
  selectBreakpoint: (state: EditorState) => Breakpoint;
  selectZoom: (state: EditorState) => number;
  selectBloqueEditandoInline: (state: EditorState) => BloqueId | null;

  // Guardado
  selectEstadoGuardado: (state: EditorState) => EstadoGuardado;
  selectTieneCambios: (state: EditorState) => boolean;
  selectUltimoGuardado: (state: EditorState) => Date | null;

  // Historial
  selectPuedeUndo: (state: EditorState) => boolean;
  selectPuedeRedo: (state: EditorState) => boolean;

  // Conflictos
  selectConflictoVersion: (state: EditorState) => ConflictoVersion | null;

  // Animaciones
  selectBloqueRecienAgregado: (state: EditorState) => BloqueId | null;

  // Recurso
  selectRecursoId: (state: EditorState) => BloqueId | null;

  // Acciones de bloques
  selectSetBloques: (state: EditorState) => EditorState['setBloques'];
  selectActualizarBloqueLocal: (state: EditorState) => EditorState['actualizarBloqueLocal'];
  selectActualizarEstilosLocal: (state: EditorState) => EditorState['actualizarEstilosLocal'];
  selectAgregarBloqueLocal: (state: EditorState) => EditorState['agregarBloqueLocal'];
  selectSeleccionarBloque: (state: EditorState) => EditorState['seleccionarBloque'];
  selectDeseleccionarBloque: (state: EditorState) => EditorState['deseleccionarBloque'];
  selectEliminarBloqueLocal: (state: EditorState) => EditorState['eliminarBloqueLocal'];
  selectDuplicarBloqueLocal: (state: EditorState) => EditorState['duplicarBloqueLocal'];
  selectToggleVisibilidad: (state: EditorState) => EditorState['toggleVisibilidadBloque'];
  selectInsertarBloqueEnPosicion: (state: EditorState) => EditorState['insertarBloqueEnPosicion'];
  selectReordenarBloquesLocal: (state: EditorState) => EditorState['reordenarBloquesLocal'];

  // Acciones de UI
  selectSetModoEdicion: (state: EditorState) => EditorState['setModoEdicion'];
  selectSetBreakpoint: (state: EditorState) => EditorState['setBreakpoint'];
  selectSetZoom: (state: EditorState) => EditorState['setZoom'];
  selectActivarEdicionInline: (state: EditorState) => EditorState['activarEdicionInline'];
  selectDesactivarEdicionInline: (state: EditorState) => EditorState['desactivarEdicionInline'];

  // Acciones de guardado
  selectSetGuardando: (state: EditorState) => EditorState['setGuardando'];
  selectSetGuardado: (state: EditorState) => EditorState['setGuardado'];
  selectSetErrorGuardado: (state: EditorState) => EditorState['setErrorGuardado'];
  selectActualizarVersionBloque: (state: EditorState) => EditorState['actualizarVersionBloque'];

  // Acciones de conflicto
  selectSetConflictoVersion: (state: EditorState) => EditorState['setConflictoVersion'];
  selectClearConflictoVersion: (state: EditorState) => EditorState['clearConflictoVersion'];

  // Acciones de animación
  selectSetBloqueRecienAgregado: (state: EditorState) => EditorState['setBloqueRecienAgregado'];
  selectClearBloqueRecienAgregado: (state: EditorState) => EditorState['clearBloqueRecienAgregado'];

  // Reset
  selectReset: (state: EditorState) => EditorState['reset'];
  selectLimpiarBloques: (state: EditorState) => EditorState['limpiarBloques'];
}

/**
 * Crea selectores para un store de editor
 */
export function createEditorSelectors(_store: unknown): EditorSelectors {
  return {
    // Bloques
    selectBloques: (state) => state.bloques,
    selectBloqueSeleccionado: (state) =>
      state.bloques.find((b) => b.id === state.bloqueSeleccionado),
    selectBloqueSeleccionadoId: (state) => state.bloqueSeleccionado,
    selectBloquesVisibles: (state) =>
      state.bloques.filter((b) => b.visible).sort((a, b) => a.orden - b.orden),

    // UI
    selectModoEdicion: (state) => state.modoEdicion,
    selectBreakpoint: (state) => state.breakpoint,
    selectZoom: (state) => state.zoom,
    selectBloqueEditandoInline: (state) => state.bloqueEditandoInline,

    // Guardado
    selectEstadoGuardado: (state) => state.estadoGuardado,
    selectTieneCambios: (state) => state.tieneCambiosLocales,
    selectUltimoGuardado: (state) => state.ultimoGuardado,

    // Historial
    selectPuedeUndo: (state) => state.puedeUndo,
    selectPuedeRedo: (state) => state.puedeRedo,

    // Conflictos
    selectConflictoVersion: (state) => state.conflictoVersion,

    // Animaciones
    selectBloqueRecienAgregado: (state) => state.bloqueRecienAgregado,

    // Recurso (página/evento)
    selectRecursoId: (state) => state.recursoId,

    // Acciones de bloques
    selectSetBloques: (state) => state.setBloques,
    selectActualizarBloqueLocal: (state) => state.actualizarBloqueLocal,
    selectActualizarEstilosLocal: (state) => state.actualizarEstilosLocal,
    selectAgregarBloqueLocal: (state) => state.agregarBloqueLocal,
    selectSeleccionarBloque: (state) => state.seleccionarBloque,
    selectDeseleccionarBloque: (state) => state.deseleccionarBloque,
    selectEliminarBloqueLocal: (state) => state.eliminarBloqueLocal,
    selectDuplicarBloqueLocal: (state) => state.duplicarBloqueLocal,
    selectToggleVisibilidad: (state) => state.toggleVisibilidadBloque,
    selectInsertarBloqueEnPosicion: (state) => state.insertarBloqueEnPosicion,
    selectReordenarBloquesLocal: (state) => state.reordenarBloquesLocal,

    // Acciones de UI
    selectSetModoEdicion: (state) => state.setModoEdicion,
    selectSetBreakpoint: (state) => state.setBreakpoint,
    selectSetZoom: (state) => state.setZoom,
    selectActivarEdicionInline: (state) => state.activarEdicionInline,
    selectDesactivarEdicionInline: (state) => state.desactivarEdicionInline,

    // Acciones de guardado
    selectSetGuardando: (state) => state.setGuardando,
    selectSetGuardado: (state) => state.setGuardado,
    selectSetErrorGuardado: (state) => state.setErrorGuardado,
    selectActualizarVersionBloque: (state) => state.actualizarVersionBloque,

    // Acciones de conflicto
    selectSetConflictoVersion: (state) => state.setConflictoVersion,
    selectClearConflictoVersion: (state) => state.clearConflictoVersion,

    // Acciones de animación
    selectSetBloqueRecienAgregado: (state) => state.setBloqueRecienAgregado,
    selectClearBloqueRecienAgregado: (state) => state.clearBloqueRecienAgregado,

    // Reset
    selectReset: (state) => state.reset,
    selectLimpiarBloques: (state) => state.limpiarBloques,
  };
}

export default createEditorStore;
