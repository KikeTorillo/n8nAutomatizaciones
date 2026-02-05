/**
 * ====================================================================
 * SECTION ACTIONS
 * ====================================================================
 * Acciones del store para gestionar secciones en el canvas.
 * Estas acciones pueden ser integradas en cualquier store de Zustand.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

/**
 * Crea las acciones para gestionar secciones
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {Object} Acciones de secciones
 */
export function createSectionActions(set, get) {
  return {
    // ========== SECTION CRUD ==========

    /**
     * Establece las secciones (desde servidor)
     */
    setSecciones: (secciones) =>
      set({
        secciones: secciones || [],
        estadoGuardado: 'saved',
      }),

    /**
     * Agrega una nueva sección
     */
    agregarSeccion: (seccion, indice = null) =>
      set((state) => {
        const posicion = indice !== null ? indice : state.secciones.length;

        // Reajustar órdenes
        const seccionesActualizadas = state.secciones.map((s) =>
          s.orden >= posicion ? { ...s, orden: s.orden + 1 } : s
        );

        const nuevaSeccion = {
          ...seccion,
          id: seccion.id || crypto.randomUUID(),
          orden: posicion,
          elementos: seccion.elementos || [],
        };

        return {
          secciones: [...seccionesActualizadas, nuevaSeccion].sort(
            (a, b) => a.orden - b.orden
          ),
          seccionSeleccionada: nuevaSeccion.id,
          estadoGuardado: 'unsaved',
        };
      }),

    /**
     * Actualiza una sección
     */
    actualizarSeccion: (id, cambios) =>
      set((state) => ({
        secciones: state.secciones.map((s) =>
          s.id === id ? { ...s, ...cambios } : s
        ),
        estadoGuardado: 'unsaved',
      })),

    /**
     * Actualiza la configuración de una sección
     */
    actualizarConfigSeccion: (id, config) =>
      set((state) => ({
        secciones: state.secciones.map((s) =>
          s.id === id
            ? { ...s, config: { ...s.config, ...config } }
            : s
        ),
        estadoGuardado: 'unsaved',
      })),

    /**
     * Elimina una sección
     */
    eliminarSeccion: (id) =>
      set((state) => {
        const nuevasSecciones = state.secciones
          .filter((s) => s.id !== id)
          .map((s, index) => ({ ...s, orden: index }));

        return {
          secciones: nuevasSecciones,
          seccionSeleccionada:
            state.seccionSeleccionada === id ? null : state.seccionSeleccionada,
          elementoSeleccionado:
            state.secciones.find((s) => s.id === id)?.elementos?.some(
              (e) => e.id === state.elementoSeleccionado
            )
              ? null
              : state.elementoSeleccionado,
          estadoGuardado: 'unsaved',
        };
      }),

    /**
     * Duplica una sección
     */
    duplicarSeccion: (id) =>
      set((state) => {
        const seccionOriginal = state.secciones.find((s) => s.id === id);
        if (!seccionOriginal) return state;

        const nuevaSeccion = {
          ...seccionOriginal,
          id: crypto.randomUUID(),
          orden: seccionOriginal.orden + 1,
          elementos: seccionOriginal.elementos.map((e) => ({
            ...e,
            id: crypto.randomUUID(),
          })),
        };

        // Reajustar órdenes
        const seccionesActualizadas = state.secciones.map((s) =>
          s.orden > seccionOriginal.orden ? { ...s, orden: s.orden + 1 } : s
        );

        return {
          secciones: [...seccionesActualizadas, nuevaSeccion].sort(
            (a, b) => a.orden - b.orden
          ),
          seccionSeleccionada: nuevaSeccion.id,
          estadoGuardado: 'unsaved',
        };
      }),

    /**
     * Mueve una sección arriba o abajo
     */
    moverSeccion: (id, direccion) =>
      set((state) => {
        const indiceActual = state.secciones.findIndex((s) => s.id === id);
        if (indiceActual === -1) return state;

        const nuevoIndice = direccion === 'up'
          ? Math.max(0, indiceActual - 1)
          : Math.min(state.secciones.length - 1, indiceActual + 1);

        if (nuevoIndice === indiceActual) return state;

        const nuevasSecciones = [...state.secciones];
        [nuevasSecciones[indiceActual], nuevasSecciones[nuevoIndice]] =
          [nuevasSecciones[nuevoIndice], nuevasSecciones[indiceActual]];

        // Actualizar órdenes
        const seccionesOrdenadas = nuevasSecciones.map((s, index) => ({
          ...s,
          orden: index,
        }));

        return {
          secciones: seccionesOrdenadas,
          estadoGuardado: 'unsaved',
        };
      }),

    /**
     * Reordena secciones (drag & drop)
     */
    reordenarSecciones: (nuevoOrden) =>
      set((state) => {
        const seccionesMap = new Map(state.secciones.map((s) => [s.id, s]));
        const seccionesReordenadas = nuevoOrden
          .map((id, index) => {
            const seccion = seccionesMap.get(id);
            return seccion ? { ...seccion, orden: index } : null;
          })
          .filter(Boolean);

        return {
          secciones: seccionesReordenadas,
          estadoGuardado: 'unsaved',
        };
      }),

    // ========== SELECTION ==========

    /**
     * Selecciona una sección
     */
    seleccionarSeccion: (id) =>
      set({
        seccionSeleccionada: id,
        elementoSeleccionado: null,
        elementoEditando: null,
      }),

    /**
     * Deselecciona todo
     */
    deseleccionarTodo: () =>
      set({
        seccionSeleccionada: null,
        elementoSeleccionado: null,
        elementoEditando: null,
      }),
  };
}

/**
 * Crea una nueva sección con valores por defecto
 * @param {Object} overrides - Valores a sobrescribir
 * @returns {Object} Nueva sección
 */
export function createSection(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    tipo: 'seccion',
    preset: null,
    orden: 0,
    visible: true,
    config: {
      altura: { valor: 100, unidad: 'vh' },
      padding: { top: 40, bottom: 40 },
      fondo: {
        tipo: 'color',
        valor: '#ffffff',
        overlay: null,
      },
      ...overrides.config,
    },
    elementos: [],
    ...overrides,
  };
}

export default {
  createSectionActions,
  createSection,
};
