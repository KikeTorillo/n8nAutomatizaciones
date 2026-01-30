/**
 * ====================================================================
 * WEBSITE EDITOR STORE
 * ====================================================================
 * Store de Zustand con soporte para Undo/Redo usando zundo.
 * Maneja el estado del editor WYSIWYG del módulo website.
 */

import { create } from 'zustand';
import { temporal } from 'zundo';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';

// ========== STATE INTERFACE ==========
/**
 * @typedef {Object} Bloque
 * @property {string} id - UUID del bloque
 * @property {string} tipo - Tipo de bloque (hero, servicios, etc.)
 * @property {Object} contenido - Contenido JSONB del bloque
 * @property {Object} estilos - Estilos customizados
 * @property {number} orden - Orden en la página
 * @property {boolean} visible - Si está visible
 * @property {number} version - Versión para bloqueo optimista
 */

/**
 * @typedef {'canvas' | 'properties' | 'preview'} ModoEdicion
 */

/**
 * @typedef {'desktop' | 'tablet' | 'mobile'} Breakpoint
 */

// ========== INITIAL STATE ==========
const initialState = {
  // Bloques de la página actual (copia local para edición)
  bloques: [],

  // Bloque actualmente seleccionado
  bloqueSeleccionado: null,

  // Modo de edición actual
  modoEdicion: 'canvas', // 'canvas' | 'properties' | 'preview'

  // Breakpoint activo para responsive editing
  breakpoint: 'desktop', // 'desktop' | 'tablet' | 'mobile'

  // Zoom del canvas (50-200)
  zoom: 100,

  // Estado de guardado
  estadoGuardado: 'saved', // 'saved' | 'saving' | 'unsaved' | 'error'
  ultimoGuardado: null,

  // Bloque en modo inline editing
  bloqueEditandoInline: null,

  // Historial de cambios (para UI de undo/redo)
  puedeUndo: false,
  puedeRedo: false,

  // Página activa ID (para referencia)
  paginaActivaId: null,

  // Flag para detectar cambios no guardados
  tieneClambiosLocales: false,

  // ID del bloque recien agregado (para animacion de insercion)
  bloqueRecienAgregado: null,

  // Conflicto de versión (bloqueo optimista)
  conflictoVersion: null, // { bloqueId, versionLocal, versionServidor }
};

// ========== STORE CREATION ==========
const useWebsiteEditorStore = create(
  subscribeWithSelector(
    persist(
      temporal(
        (set, get) => ({
          ...initialState,

        // ========== BLOQUES ACTIONS ==========

        /**
         * Establece los bloques (desde servidor)
         * Se llama cuando se cargan bloques de la API
         */
        setBloques: (bloques, paginaId) =>
          set({
            bloques: bloques || [],
            paginaActivaId: paginaId,
            tieneClambiosLocales: false,
            estadoGuardado: 'saved',
          }),

        /**
         * Actualiza un bloque localmente (sin guardar en servidor)
         * Usado para inline editing en tiempo real
         */
        actualizarBloqueLocal: (id, contenido) =>
          set((state) => ({
            bloques: state.bloques.map((b) =>
              b.id === id
                ? { ...b, contenido: { ...b.contenido, ...contenido } }
                : b
            ),
            tieneClambiosLocales: true,
            estadoGuardado: 'unsaved',
          })),

        /**
         * Actualiza estilos de un bloque localmente
         */
        actualizarEstilosLocal: (id, estilos) =>
          set((state) => ({
            bloques: state.bloques.map((b) =>
              b.id === id
                ? { ...b, estilos: { ...b.estilos, ...estilos } }
                : b
            ),
            tieneClambiosLocales: true,
            estadoGuardado: 'unsaved',
          })),

        /**
         * Reordena bloques localmente
         */
        reordenarBloquesLocal: (nuevoOrden) =>
          set((state) => {
            const bloquesMap = new Map(state.bloques.map((b) => [b.id, b]));
            const bloquesReordenados = nuevoOrden
              .map((id, index) => {
                const bloque = bloquesMap.get(id);
                return bloque ? { ...bloque, orden: index } : null;
              })
              .filter(Boolean);

            return {
              bloques: bloquesReordenados,
              tieneClambiosLocales: true,
              estadoGuardado: 'unsaved',
            };
          }),

        /**
         * Agrega un bloque nuevo localmente
         */
        agregarBloqueLocal: (bloque) =>
          set((state) => ({
            bloques: [...state.bloques, bloque],
            bloqueSeleccionado: bloque.id,
            tieneClambiosLocales: true,
            estadoGuardado: 'unsaved',
          })),

        /**
         * Elimina un bloque localmente
         */
        eliminarBloqueLocal: (id) =>
          set((state) => ({
            bloques: state.bloques.filter((b) => b.id !== id),
            bloqueSeleccionado:
              state.bloqueSeleccionado === id ? null : state.bloqueSeleccionado,
            bloqueEditandoInline:
              state.bloqueEditandoInline === id ? null : state.bloqueEditandoInline,
            tieneClambiosLocales: true,
            estadoGuardado: 'unsaved',
          })),

        /**
         * Duplica un bloque localmente
         */
        duplicarBloqueLocal: (id, nuevoId) =>
          set((state) => {
            const bloqueOriginal = state.bloques.find((b) => b.id === id);
            if (!bloqueOriginal) return state;

            const indiceDespues = bloqueOriginal.orden + 1;
            const bloqueDuplicado = {
              ...bloqueOriginal,
              id: nuevoId,
              orden: indiceDespues,
            };

            // Reajustar órdenes
            const bloquesActualizados = state.bloques.map((b) =>
              b.orden >= indiceDespues ? { ...b, orden: b.orden + 1 } : b
            );

            return {
              bloques: [...bloquesActualizados, bloqueDuplicado].sort(
                (a, b) => a.orden - b.orden
              ),
              bloqueSeleccionado: nuevoId,
              tieneClambiosLocales: true,
              estadoGuardado: 'unsaved',
            };
          }),

        /**
         * Toggle visibilidad de un bloque
         */
        toggleVisibilidadBloque: (id) =>
          set((state) => ({
            bloques: state.bloques.map((b) =>
              b.id === id ? { ...b, visible: !b.visible } : b
            ),
            tieneClambiosLocales: true,
            estadoGuardado: 'unsaved',
          })),

        /**
         * Inserta un bloque en una posición específica (para drag desde paleta)
         * @param {Object} bloque - Bloque a insertar
         * @param {number} indice - Índice donde insertar (si no se especifica, al final)
         */
        insertarBloqueEnPosicion: (bloque, indice = null) =>
          set((state) => {
            const posicion = indice !== null ? indice : state.bloques.length;

            // Reajustar órdenes de bloques existentes
            const bloquesActualizados = state.bloques.map((b) =>
              b.orden >= posicion ? { ...b, orden: b.orden + 1 } : b
            );

            const nuevoBloque = {
              ...bloque,
              orden: posicion,
            };

            return {
              bloques: [...bloquesActualizados, nuevoBloque].sort(
                (a, b) => a.orden - b.orden
              ),
              bloqueSeleccionado: bloque.id,
              tieneClambiosLocales: true,
              estadoGuardado: 'unsaved',
            };
          }),

        // ========== SELECCIÓN ACTIONS ==========

        /**
         * Selecciona un bloque
         */
        seleccionarBloque: (id) =>
          set((state) => ({
            bloqueSeleccionado: id,
            // Si se deselecciona, salir de inline editing
            bloqueEditandoInline: id ? state.bloqueEditandoInline : null,
          })),

        /**
         * Deselecciona el bloque actual
         */
        deseleccionarBloque: () =>
          set({
            bloqueSeleccionado: null,
            bloqueEditandoInline: null,
          }),

        /**
         * Activa inline editing en un bloque
         */
        activarInlineEditing: (id) =>
          set({
            bloqueSeleccionado: id,
            bloqueEditandoInline: id,
            modoEdicion: 'canvas',
          }),

        /**
         * Desactiva inline editing
         */
        desactivarInlineEditing: () =>
          set((state) => ({
            bloqueEditandoInline: null,
          })),

        // ========== MODO EDICIÓN ACTIONS ==========

        /**
         * Cambia el modo de edición
         */
        setModoEdicion: (modo) =>
          set({
            modoEdicion: modo,
            // Si cambiamos a preview, deseleccionar
            ...(modo === 'preview' && {
              bloqueSeleccionado: null,
              bloqueEditandoInline: null,
            }),
          }),

        // ========== RESPONSIVE ACTIONS ==========

        /**
         * Cambia el breakpoint activo
         */
        setBreakpoint: (breakpoint) =>
          set({ breakpoint }),

        /**
         * Cambia el zoom del canvas
         */
        setZoom: (zoom) =>
          set({ zoom: Math.min(200, Math.max(50, zoom)) }),

        // ========== ESTADO GUARDADO ACTIONS ==========

        /**
         * Marca como guardando
         */
        setGuardando: () =>
          set({ estadoGuardado: 'saving' }),

        /**
         * Marca como guardado exitosamente
         */
        setGuardado: () =>
          set({
            estadoGuardado: 'saved',
            tieneClambiosLocales: false,
            ultimoGuardado: new Date().toISOString(),
          }),

        /**
         * Marca como error al guardar
         */
        setErrorGuardado: () =>
          set({ estadoGuardado: 'error' }),

        /**
         * Registra un conflicto de versión (bloqueo optimista)
         */
        setConflictoVersion: (conflicto) =>
          set({ conflictoVersion: conflicto, estadoGuardado: 'error' }),

        /**
         * Limpia el conflicto de versión
         */
        clearConflictoVersion: () =>
          set({ conflictoVersion: null }),

        /**
         * Actualiza la versión de un bloque después de guardar exitosamente
         */
        actualizarVersionBloque: (id, nuevaVersion) =>
          set((state) => ({
            bloques: state.bloques.map((b) =>
              b.id === id ? { ...b, version: nuevaVersion } : b
            ),
          })),

        // ========== HISTORIAL ACTIONS ==========

        /**
         * Actualiza flags de undo/redo (llamado por el temporal middleware)
         */
        actualizarHistorial: (puedeUndo, puedeRedo) =>
          set({ puedeUndo, puedeRedo }),

        // ========== BLOQUE RECIEN AGREGADO (ANIMACION) ==========

        /**
         * Marca un bloque como recien agregado (para animacion)
         * Se limpia automaticamente despues de un timeout
         */
        setBloqueRecienAgregado: (id) => {
          set({ bloqueRecienAgregado: id });
          // Limpiar automaticamente despues de 1.5s
          setTimeout(() => {
            set((state) =>
              state.bloqueRecienAgregado === id
                ? { bloqueRecienAgregado: null }
                : state
            );
          }, 1500);
        },

        /**
         * Limpia el bloque recien agregado manualmente
         */
        clearBloqueRecienAgregado: () =>
          set({ bloqueRecienAgregado: null }),

        // ========== RESET ==========

        /**
         * Resetea el store a estado inicial
         */
        reset: () => set(initialState),
      }),
      {
        // Configuración de zundo (temporal middleware)
        limit: 50, // Máximo 50 estados en historial
        partialize: (state) => ({
          // Solo trackear cambios en bloques (no UI state)
          bloques: state.bloques,
        }),
        equality: (pastState, currentState) =>
          JSON.stringify(pastState) === JSON.stringify(currentState),
        onSave: (state) => {
          // Callback cuando se guarda un estado en historial
          // Puede usarse para analytics
        },
      }
    ),
    {
      // Configuración de persist middleware (localStorage)
      name: 'website-editor-storage',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir estado relevante para recuperación
      partialize: (state) => ({
        bloques: state.bloques,
        paginaActivaId: state.paginaActivaId,
        zoom: state.zoom,
        breakpoint: state.breakpoint,
      }),
      // Versión del schema para migraciones futuras
      version: 1,
      // Migrar datos de versiones anteriores si es necesario
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migración de v0 a v1
          return { ...persistedState };
        }
        return persistedState;
      },
    }
  )
));

// ========== SELECTORES ==========

// Bloques
export const selectBloques = (state) => state.bloques;
export const selectBloqueSeleccionado = (state) => state.bloqueSeleccionado;
export const selectBloqueEditandoInline = (state) => state.bloqueEditandoInline;

// Selector para obtener el bloque seleccionado completo
export const selectBloqueSeleccionadoCompleto = (state) =>
  state.bloqueSeleccionado
    ? state.bloques.find((b) => b.id === state.bloqueSeleccionado)
    : null;

// Modo y UI
export const selectModoEdicion = (state) => state.modoEdicion;
export const selectBreakpoint = (state) => state.breakpoint;
export const selectZoom = (state) => state.zoom;

// Estado guardado
export const selectEstadoGuardado = (state) => state.estadoGuardado;
export const selectUltimoGuardado = (state) => state.ultimoGuardado;
export const selectTieneCambiosLocales = (state) => state.tieneClambiosLocales;

// Historial (undo/redo)
export const selectPuedeUndo = (state) => state.puedeUndo;
export const selectPuedeRedo = (state) => state.puedeRedo;

// Página activa
export const selectPaginaActivaId = (state) => state.paginaActivaId;

// Bloque recien agregado (para animacion)
export const selectBloqueRecienAgregado = (state) => state.bloqueRecienAgregado;

// Conflicto de versión (bloqueo optimista)
export const selectConflictoVersion = (state) => state.conflictoVersion;

// ========== ACCIONES ==========

export const selectSetBloques = (state) => state.setBloques;
export const selectActualizarBloqueLocal = (state) => state.actualizarBloqueLocal;
export const selectActualizarEstilosLocal = (state) => state.actualizarEstilosLocal;
export const selectReordenarBloquesLocal = (state) => state.reordenarBloquesLocal;
export const selectAgregarBloqueLocal = (state) => state.agregarBloqueLocal;
export const selectEliminarBloqueLocal = (state) => state.eliminarBloqueLocal;
export const selectDuplicarBloqueLocal = (state) => state.duplicarBloqueLocal;
export const selectToggleVisibilidadBloque = (state) => state.toggleVisibilidadBloque;
export const selectInsertarBloqueEnPosicion = (state) => state.insertarBloqueEnPosicion;

export const selectSeleccionarBloque = (state) => state.seleccionarBloque;
export const selectDeseleccionarBloque = (state) => state.deseleccionarBloque;
export const selectActivarInlineEditing = (state) => state.activarInlineEditing;
export const selectDesactivarInlineEditing = (state) => state.desactivarInlineEditing;

export const selectSetModoEdicion = (state) => state.setModoEdicion;
export const selectSetBreakpoint = (state) => state.setBreakpoint;
export const selectSetZoom = (state) => state.setZoom;

export const selectSetGuardando = (state) => state.setGuardando;
export const selectSetGuardado = (state) => state.setGuardado;
export const selectSetErrorGuardado = (state) => state.setErrorGuardado;

export const selectSetBloqueRecienAgregado = (state) => state.setBloqueRecienAgregado;
export const selectClearBloqueRecienAgregado = (state) => state.clearBloqueRecienAgregado;

export const selectSetConflictoVersion = (state) => state.setConflictoVersion;
export const selectClearConflictoVersion = (state) => state.clearConflictoVersion;
export const selectActualizarVersionBloque = (state) => state.actualizarVersionBloque;

export const selectReset = (state) => state.reset;

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
