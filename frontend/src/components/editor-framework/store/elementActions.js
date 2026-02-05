/**
 * ====================================================================
 * ELEMENT ACTIONS
 * ====================================================================
 * Acciones del store para gestionar elementos en secciones.
 * Estas acciones pueden ser integradas en cualquier store de Zustand.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { createElementFromType } from '../elements/elementTypes';

/**
 * Crea las acciones para gestionar elementos
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {Object} Acciones de elementos
 */
export function createElementActions(set, get) {
  return {
    // ========== ELEMENT CRUD ==========

    /**
     * Agrega un elemento a una sección
     */
    agregarElemento: (elemento, seccionId = null) =>
      set((state) => {
        // Si no se especifica sección, usar la seleccionada o la primera
        const targetSeccionId = seccionId || state.seccionSeleccionada || state.secciones[0]?.id;
        if (!targetSeccionId) return state;

        const nuevoElemento = {
          ...elemento,
          id: elemento.id || crypto.randomUUID(),
          capa: elemento.capa ?? getMaxLayer(state, targetSeccionId) + 1,
        };

        return {
          secciones: state.secciones.map((s) =>
            s.id === targetSeccionId
              ? { ...s, elementos: [...s.elementos, nuevoElemento] }
              : s
          ),
          elementoSeleccionado: nuevoElemento.id,
          seccionSeleccionada: targetSeccionId,
          estadoGuardado: 'unsaved',
        };
      }),

    /**
     * Actualiza un elemento
     */
    actualizarElemento: (elementoId, cambios) =>
      set((state) => ({
        secciones: state.secciones.map((s) => ({
          ...s,
          elementos: s.elementos.map((e) =>
            e.id === elementoId ? { ...e, ...cambios } : e
          ),
        })),
        estadoGuardado: 'unsaved',
      })),

    /**
     * Actualiza el contenido de un elemento
     */
    actualizarContenidoElemento: (elementoId, contenido) =>
      set((state) => ({
        secciones: state.secciones.map((s) => ({
          ...s,
          elementos: s.elementos.map((e) =>
            e.id === elementoId
              ? { ...e, contenido: { ...e.contenido, ...contenido } }
              : e
          ),
        })),
        estadoGuardado: 'unsaved',
      })),

    /**
     * Actualiza los estilos de un elemento
     */
    actualizarEstilosElemento: (elementoId, estilos) =>
      set((state) => ({
        secciones: state.secciones.map((s) => ({
          ...s,
          elementos: s.elementos.map((e) =>
            e.id === elementoId
              ? { ...e, estilos: { ...e.estilos, ...estilos } }
              : e
          ),
        })),
        estadoGuardado: 'unsaved',
      })),

    /**
     * Actualiza la posición de un elemento
     */
    actualizarPosicionElemento: (elementoId, posicion) =>
      set((state) => ({
        secciones: state.secciones.map((s) => ({
          ...s,
          elementos: s.elementos.map((e) =>
            e.id === elementoId
              ? { ...e, posicion: { ...e.posicion, ...posicion } }
              : e
          ),
        })),
        estadoGuardado: 'unsaved',
      })),

    /**
     * Mueve un elemento (actualiza X, Y)
     */
    moverElemento: (elementoId, seccionId, nuevaPosicion) =>
      set((state) => ({
        secciones: state.secciones.map((s) =>
          s.id === seccionId
            ? {
                ...s,
                elementos: s.elementos.map((e) =>
                  e.id === elementoId
                    ? { ...e, posicion: { ...e.posicion, ...nuevaPosicion } }
                    : e
                ),
              }
            : s
        ),
        estadoGuardado: 'unsaved',
      })),

    /**
     * Redimensiona un elemento
     */
    redimensionarElemento: (elementoId, seccionId, nuevoTamano) =>
      set((state) => ({
        secciones: state.secciones.map((s) =>
          s.id === seccionId
            ? {
                ...s,
                elementos: s.elementos.map((e) =>
                  e.id === elementoId
                    ? { ...e, posicion: { ...e.posicion, ...nuevoTamano } }
                    : e
                ),
              }
            : s
        ),
        estadoGuardado: 'unsaved',
      })),

    /**
     * Elimina un elemento
     */
    eliminarElemento: (elementoId) =>
      set((state) => ({
        secciones: state.secciones.map((s) => ({
          ...s,
          elementos: s.elementos.filter((e) => e.id !== elementoId),
        })),
        elementoSeleccionado:
          state.elementoSeleccionado === elementoId
            ? null
            : state.elementoSeleccionado,
        elementoEditando:
          state.elementoEditando === elementoId
            ? null
            : state.elementoEditando,
        estadoGuardado: 'unsaved',
      })),

    /**
     * Duplica un elemento
     */
    duplicarElemento: (elementoId) =>
      set((state) => {
        let elementoOriginal = null;
        let seccionId = null;

        // Encontrar el elemento y su sección
        for (const s of state.secciones) {
          const e = s.elementos.find((el) => el.id === elementoId);
          if (e) {
            elementoOriginal = e;
            seccionId = s.id;
            break;
          }
        }

        if (!elementoOriginal || !seccionId) return state;

        const nuevoElemento = {
          ...elementoOriginal,
          id: crypto.randomUUID(),
          // Desplazar ligeramente la posición
          posicion: {
            ...elementoOriginal.posicion,
            x: (elementoOriginal.posicion?.x || 50) + 2,
            y: (elementoOriginal.posicion?.y || 50) + 2,
          },
          // Nueva capa encima
          capa: getMaxLayer(state, seccionId) + 1,
        };

        return {
          secciones: state.secciones.map((s) =>
            s.id === seccionId
              ? { ...s, elementos: [...s.elementos, nuevoElemento] }
              : s
          ),
          elementoSeleccionado: nuevoElemento.id,
          estadoGuardado: 'unsaved',
        };
      }),

    /**
     * Toggle visibilidad de un elemento
     */
    toggleVisibilidadElemento: (elementoId) =>
      set((state) => ({
        secciones: state.secciones.map((s) => ({
          ...s,
          elementos: s.elementos.map((e) =>
            e.id === elementoId ? { ...e, visible: !(e.visible !== false) } : e
          ),
        })),
        estadoGuardado: 'unsaved',
      })),

    /**
     * Mueve un elemento en capas (z-index)
     */
    moverCapaElemento: (elementoId, direccion) =>
      set((state) => {
        let seccionId = null;
        for (const s of state.secciones) {
          if (s.elementos.some((e) => e.id === elementoId)) {
            seccionId = s.id;
            break;
          }
        }

        if (!seccionId) return state;

        return {
          secciones: state.secciones.map((s) => {
            if (s.id !== seccionId) return s;

            const elemento = s.elementos.find((e) => e.id === elementoId);
            if (!elemento) return s;

            const capaActual = elemento.capa || 1;
            const nuevaCapa = direccion === 'up'
              ? capaActual + 1
              : Math.max(1, capaActual - 1);

            return {
              ...s,
              elementos: s.elementos.map((e) =>
                e.id === elementoId ? { ...e, capa: nuevaCapa } : e
              ),
            };
          }),
          estadoGuardado: 'unsaved',
        };
      }),

    // ========== SELECTION ==========

    /**
     * Selecciona un elemento
     */
    seleccionarElemento: (elementoId, seccionId = null) =>
      set((state) => {
        // Si no se proporciona seccionId, buscarlo
        if (!seccionId) {
          for (const s of state.secciones) {
            if (s.elementos.some((e) => e.id === elementoId)) {
              seccionId = s.id;
              break;
            }
          }
        }

        return {
          elementoSeleccionado: elementoId,
          seccionSeleccionada: seccionId || state.seccionSeleccionada,
          elementoEditando: null,
        };
      }),

    /**
     * Activa modo de edición inline para un elemento
     */
    activarEdicionElemento: (elementoId) =>
      set({
        elementoEditando: elementoId,
        elementoSeleccionado: elementoId,
      }),

    /**
     * Desactiva modo de edición inline
     */
    desactivarEdicionElemento: () =>
      set({
        elementoEditando: null,
      }),

    // ========== RESPONSIVE ==========

    /**
     * Actualiza posición responsive de un elemento
     */
    actualizarPosicionResponsive: (elementoId, breakpoint, posicion) =>
      set((state) => ({
        secciones: state.secciones.map((s) => ({
          ...s,
          elementos: s.elementos.map((e) =>
            e.id === elementoId
              ? {
                  ...e,
                  responsive: {
                    ...e.responsive,
                    [breakpoint]: {
                      ...(e.responsive?.[breakpoint] || {}),
                      ...posicion,
                    },
                  },
                }
              : e
          ),
        })),
        estadoGuardado: 'unsaved',
      })),
  };
}

// ========== HELPERS ==========

/**
 * Obtiene la capa máxima de elementos en una sección
 */
function getMaxLayer(state, seccionId) {
  const seccion = state.secciones.find((s) => s.id === seccionId);
  if (!seccion || seccion.elementos.length === 0) return 0;
  return Math.max(...seccion.elementos.map((e) => e.capa || 1));
}

export default {
  createElementActions,
};
