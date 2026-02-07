/**
 * ====================================================================
 * CREATE FREE POSITION STORE
 * ====================================================================
 * Factory function para crear stores con soporte para secciones
 * y elementos con posición libre.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { create } from 'zustand';
import { temporal } from 'zundo';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { createSectionActions } from './sectionActions';
import { createElementActions } from './elementActions';
import { deepEqual } from '../hooks/compareUtils';

/**
 * Crea un store con soporte para secciones y elementos de posición libre
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.name - Nombre único del store (para persist)
 * @param {boolean} options.persist - Si debe persistir en localStorage (default: true)
 * @param {Object} options.initialState - Estado inicial adicional
 * @param {Function} options.extraActions - Acciones adicionales (set, get) => ({})
 * @returns {Object} Store de Zustand
 */
export function createFreePositionStore(options = {}) {
  const {
    name = 'free-position-store',
    persist: shouldPersist = true,
    initialState = {},
    extraActions = () => ({}),
  } = options;

  // ========== INITIAL STATE ==========
  const baseInitialState = {
    // Secciones con elementos
    secciones: [],

    // ID del recurso padre (página, evento, etc.)
    recursoId: null,

    // Selección actual
    seccionSeleccionada: null,
    elementoSeleccionado: null,
    elementoEditando: null,

    // Vista
    breakpoint: 'desktop', // 'desktop' | 'tablet' | 'mobile'
    zoom: 100,
    modoPreview: false,

    // Estado de guardado
    estadoGuardado: 'saved', // 'saved' | 'saving' | 'unsaved' | 'error'
    ultimoGuardado: null,

    // Historial
    puedeUndo: false,
    puedeRedo: false,

    // Estado adicional
    ...initialState,
  };

  // ========== STORE ACTIONS ==========
  const storeActions = (set, get) => ({
    ...baseInitialState,

    // Acciones de secciones
    ...createSectionActions(set, get),

    // Acciones de elementos
    ...createElementActions(set, get),

    // ========== UI ACTIONS ==========

    setBreakpoint: (breakpoint) =>
      set({ breakpoint }),

    setZoom: (zoom) =>
      set({ zoom: Math.max(50, Math.min(200, zoom)) }),

    setModoPreview: (modoPreview) =>
      set({ modoPreview }),

    toggleModoPreview: () =>
      set((state) => ({ modoPreview: !state.modoPreview })),

    // ========== DATA ACTIONS ==========

    /**
     * Carga datos desde el servidor
     */
    cargarDatos: (datos, recursoId) =>
      set({
        secciones: datos.secciones || [],
        recursoId,
        estadoGuardado: 'saved',
        seccionSeleccionada: null,
        elementoSeleccionado: null,
        elementoEditando: null,
      }),

    /**
     * Prepara datos para guardar
     */
    obtenerDatosParaGuardar: () => {
      const state = get();
      return {
        secciones: state.secciones,
      };
    },

    // ========== GUARDADO ACTIONS ==========

    setGuardando: () =>
      set({ estadoGuardado: 'saving' }),

    setGuardado: () =>
      set({
        estadoGuardado: 'saved',
        ultimoGuardado: new Date(),
      }),

    setErrorGuardado: () =>
      set({ estadoGuardado: 'error' }),

    marcarCambios: () =>
      set({ estadoGuardado: 'unsaved' }),

    // ========== HISTORIAL ==========

    updateHistorialState: (puedeUndo, puedeRedo) =>
      set({ puedeUndo, puedeRedo }),

    // ========== RESET ==========

    reset: () =>
      set(baseInitialState),

    limpiar: () =>
      set({
        secciones: [],
        seccionSeleccionada: null,
        elementoSeleccionado: null,
        elementoEditando: null,
        estadoGuardado: 'saved',
      }),

    // Acciones adicionales
    ...extraActions(set, get),
  });

  // ========== CREAR STORE ==========
  if (shouldPersist) {
    return create(
      subscribeWithSelector(
        persist(
          temporal(storeActions, {
            limit: 50,
            equality: (pastState, currentState) =>
              deepEqual(pastState.secciones, currentState.secciones),
          }),
          {
            name: name,
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
              breakpoint: state.breakpoint,
              zoom: state.zoom,
            }),
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
          deepEqual(pastState.secciones, currentState.secciones),
      })
    )
  );
}

// ========== SELECTORES GENÉRICOS ==========

/**
 * Crea selectores para un store de posición libre
 * @param {Object} store - Store de Zustand
 * @returns {Object} Selectores
 */
export function createFreePositionSelectors(store) {
  return {
    // Secciones
    selectSecciones: (state) => state.secciones,
    selectSeccionSeleccionada: (state) =>
      state.secciones.find((s) => s.id === state.seccionSeleccionada),
    selectSeccionSeleccionadaId: (state) => state.seccionSeleccionada,

    // Elementos
    selectElementoSeleccionado: (state) => {
      if (!state.elementoSeleccionado) return null;
      for (const s of state.secciones) {
        const e = s.elementos.find((el) => el.id === state.elementoSeleccionado);
        if (e) return e;
      }
      return null;
    },
    selectElementoSeleccionadoId: (state) => state.elementoSeleccionado,
    selectElementoEditando: (state) => state.elementoEditando,

    // Elementos de la sección seleccionada
    selectElementosSeccionActual: (state) => {
      const seccion = state.secciones.find((s) => s.id === state.seccionSeleccionada);
      return seccion?.elementos || [];
    },

    // UI
    selectBreakpoint: (state) => state.breakpoint,
    selectZoom: (state) => state.zoom,
    selectModoPreview: (state) => state.modoPreview,

    // Guardado
    selectEstadoGuardado: (state) => state.estadoGuardado,
    selectUltimoGuardado: (state) => state.ultimoGuardado,
    selectTieneCambios: (state) => state.estadoGuardado === 'unsaved',

    // Historial
    selectPuedeUndo: (state) => state.puedeUndo,
    selectPuedeRedo: (state) => state.puedeRedo,
  };
}

export default createFreePositionStore;
