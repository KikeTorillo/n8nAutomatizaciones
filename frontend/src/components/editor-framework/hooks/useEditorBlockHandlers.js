/**
 * ====================================================================
 * USE EDITOR BLOCK HANDLERS
 * ====================================================================
 * Hook compartido que encapsula los handlers comunes de bloques,
 * DnD y bloque seleccionado. Usado por InvitacionEditorProvider
 * y PlantillaEditorProvider para eliminar duplicación.
 *
 * @since 2026-02-06
 */

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useDndHandlers } from './useDndHandlers';

/**
 * @param {Object} config
 * @param {Object} config.store - Zustand store con acciones de bloques
 * @param {Array} config.bloquesConfig - Configuración de bloques disponibles (BLOQUES_INVITACION, etc.)
 * @param {Function} config.crearBloque - Función para crear un bloque nuevo (crearBloqueNuevo)
 * @returns {Object} Handlers de bloques, DnD y selección
 */
export function useEditorBlockHandlers({ store, bloquesConfig, crearBloque }) {
  const bloques = store.bloques;
  const bloqueSeleccionado = store.bloqueSeleccionado;

  // ========== HANDLERS ==========

  const handleAgregarBloque = useCallback(
    (tipo) => {
      const configBloque = bloquesConfig.find(b => b.tipo === tipo);
      if (configBloque?.unico && bloques.some(b => b.tipo === tipo)) {
        toast.warning(`Solo puedes tener un bloque de ${configBloque.label}`);
        return;
      }

      const nuevoBloque = crearBloque(tipo, bloques.length);

      if (tipo === 'apertura') {
        store.insertarBloqueEnPosicion(nuevoBloque, 0);
      } else {
        store.agregarBloqueLocal(nuevoBloque);
      }
    },
    [bloques, bloquesConfig, crearBloque, store]
  );

  const handleActualizarBloque = useCallback(
    (id, cambios) => {
      store.actualizarBloqueLocal(id, cambios);
    },
    [store]
  );

  const handleEliminarBloque = useCallback(
    (id) => {
      store.eliminarBloqueLocal(id);
    },
    [store]
  );

  const handleDuplicarBloque = useCallback(
    (id) => {
      const nuevoId = crypto.randomUUID();
      store.duplicarBloqueLocal(id, nuevoId);
    },
    [store]
  );

  const handleToggleVisibilidad = useCallback(
    (id) => {
      store.toggleVisibilidadBloque(id);
    },
    [store]
  );

  const handleReordenarBloques = useCallback(
    (nuevoOrden) => {
      store.reordenarBloquesLocal(nuevoOrden);
    },
    [store]
  );

  // ========== DND ==========

  const { handleDropFromPalette, handleDndReorder } = useDndHandlers({
    bloques,
    onInsertBlock: store.insertarBloqueEnPosicion,
    onReorderBlocks: store.reordenarBloquesLocal,
    createBlock: crearBloque,
  });

  // ========== BLOQUE SELECCIONADO COMPLETO ==========

  const bloqueSeleccionadoCompleto = useMemo(
    () => bloques.find((b) => b.id === bloqueSeleccionado),
    [bloques, bloqueSeleccionado]
  );

  return {
    handleAgregarBloque,
    handleActualizarBloque,
    handleEliminarBloque,
    handleDuplicarBloque,
    handleToggleVisibilidad,
    handleReordenarBloques,
    handleDropFromPalette,
    handleDndReorder,
    bloqueSeleccionadoCompleto,
  };
}
