/**
 * ====================================================================
 * CREATE EDITOR STORE - FACTORY FUNCTION
 * ====================================================================
 * Factory function para crear stores de editor de bloques.
 * Usado por Website Builder y Editor de Invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { create } from 'zustand';
import { temporal } from 'zundo';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';

/**
 * Crea un store de editor con todas las funcionalidades comunes
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.name - Nombre único del store (para persist)
 * @param {boolean} options.persist - Si debe persistir en localStorage (default: true)
 * @param {'localStorage'|'sessionStorage'} options.storage - Tipo de storage (default: 'sessionStorage')
 * @param {Function} options.persistFields - Función que recibe state y retorna campos a persistir
 * @param {boolean} options.deselectOnPreview - Si deseleccionar bloque al cambiar a preview (default: false)
 * @returns {Object} Store de Zustand
 */
export function createEditorStore(options = {}) {
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
  let bloqueRecienAgregadoTimeout = null;

  // ========== INITIAL STATE ==========
  const initialState = {
    // Bloques de la página/evento actual (copia local para edición)
    bloques: [],

    // ID del recurso padre (página para website, evento para invitaciones)
    recursoId: null,

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

    // Flag para detectar cambios no guardados
    tieneClambiosLocales: false,

    // ID del bloque recien agregado (para animacion de insercion)
    bloqueRecienAgregado: null,

    // Conflicto de versión (bloqueo optimista)
    conflictoVersion: null, // { bloqueId, versionLocal, versionServidor }
  };

  // ========== STORE ACTIONS ==========
  const storeActions = (set, get) => ({
    ...initialState,

    // ========== BLOQUES ACTIONS ==========

    /**
     * Establece los bloques (desde servidor)
     */
    setBloques: (bloques, recursoId) =>
      set({
        bloques: bloques || [],
        recursoId,
        tieneClambiosLocales: false,
        estadoGuardado: 'saved',
      }),

    /**
     * Actualiza un bloque localmente (sin guardar en servidor)
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
          version: 1,
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
        bloqueEditandoInline:
          state.bloqueEditandoInline !== id ? null : state.bloqueEditandoInline,
      })),

    /**
     * Deselecciona bloque actual
     */
    deseleccionarBloque: () =>
      set({
        bloqueSeleccionado: null,
        bloqueEditandoInline: null,
      }),

    // ========== UI ACTIONS ==========

    /**
     * Cambia el modo de edición
     */
    setModoEdicion: (modo) =>
      set({
        modoEdicion: modo,
        ...(deselectOnPreview && modo === 'preview' && {
          bloqueSeleccionado: null,
          bloqueEditandoInline: null,
        }),
      }),

    /**
     * Cambia el breakpoint
     */
    setBreakpoint: (breakpoint) =>
      set({ breakpoint }),

    /**
     * Cambia el zoom
     */
    setZoom: (zoom) =>
      set({ zoom: Math.max(50, Math.min(200, zoom)) }),

    /**
     * Activa modo de edición inline para un bloque
     */
    activarEdicionInline: (id) =>
      set({
        bloqueEditandoInline: id,
        bloqueSeleccionado: id,
        modoEdicion: 'canvas',
      }),

    /**
     * Desactiva modo de edición inline
     */
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

    /**
     * Marca estado como guardando
     */
    setGuardando: () =>
      set({ estadoGuardado: 'saving' }),

    /**
     * Marca estado como guardado
     */
    setGuardado: () =>
      set({
        estadoGuardado: 'saved',
        ultimoGuardado: new Date(),
        tieneClambiosLocales: false,
      }),

    /**
     * Marca error de guardado
     */
    setErrorGuardado: () =>
      set({ estadoGuardado: 'error' }),

    /**
     * Actualiza versión de un bloque (después de guardar en servidor)
     */
    actualizarVersionBloque: (id, version) =>
      set((state) => ({
        bloques: state.bloques.map((b) =>
          b.id === id ? { ...b, version } : b
        ),
      })),

    /**
     * Marca conflicto de versión
     */
    setConflictoVersion: (conflicto) =>
      set({ conflictoVersion: conflicto, estadoGuardado: 'error' }),

    /**
     * Limpia conflicto de versión
     */
    clearConflictoVersion: () =>
      set({ conflictoVersion: null }),

    // ========== ANIMACIÓN ==========

    /**
     * Marca un bloque como recién agregado (para animación)
     */
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

    /**
     * Limpia el bloque recién agregado manualmente
     */
    clearBloqueRecienAgregado: () =>
      set({ bloqueRecienAgregado: null }),

    // ========== HISTORIAL ==========

    /**
     * Actualiza estado de undo/redo
     */
    updateHistorialState: (puedeUndo, puedeRedo) =>
      set({ puedeUndo, puedeRedo }),

    // ========== RESET ==========

    /**
     * Resetea el store a estado inicial
     */
    reset: () => {
      if (bloqueRecienAgregadoTimeout) {
        clearTimeout(bloqueRecienAgregadoTimeout);
        bloqueRecienAgregadoTimeout = null;
      }
      set(initialState);
    },

    /**
     * Limpia solo los bloques (para cambio de página/evento)
     */
    limpiarBloques: () =>
      set({
        bloques: [],
        bloqueSeleccionado: null,
        bloqueEditandoInline: null,
        tieneClambiosLocales: false,
        estadoGuardado: 'saved',
        conflictoVersion: null,
      }),
  });

  // ========== CREAR STORE ==========
  const storageProvider = storage === 'localStorage' ? localStorage : sessionStorage;
  const defaultPartialize = (state) => ({
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
            equality: (pastState, currentState) =>
              JSON.stringify(pastState.bloques) === JSON.stringify(currentState.bloques),
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
        equality: (pastState, currentState) =>
          JSON.stringify(pastState.bloques) === JSON.stringify(currentState.bloques),
      })
    )
  );
}

// ========== SELECTORES GENÉRICOS ==========

/**
 * Crea selectores para un store de editor
 * @param {Object} store - Store de Zustand
 * @returns {Object} Selectores
 */
export function createEditorSelectors(store) {
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
    selectTieneCambios: (state) => state.tieneClambiosLocales,
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
