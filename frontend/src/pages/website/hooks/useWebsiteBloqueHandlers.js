/**
 * ====================================================================
 * USE WEBSITE BLOQUE HANDLERS
 * ====================================================================
 * Handlers de bloques extraídos de WebsiteEditorContext.
 */

import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook con handlers de bloques para el Website editor
 *
 * @param {Object} params
 * @param {Array} params.bloques - Bloques actuales
 * @param {Object} params.paginaActiva - Página activa
 * @param {Object} params.mutations - { crearBloque, eliminarBloque, duplicarBloque, actualizarBloque, reordenarBloques }
 * @param {Object} params.storeActions - { seleccionarBloque, deseleccionarBloque, actualizarBloqueLocal, toggleVisibilidadBloque, reordenarBloquesLocal, setBloqueRecienAgregado }
 */
export function useWebsiteBloqueHandlers({
  bloques,
  paginaActiva,
  mutations,
  storeActions,
}) {
  const {
    crearBloque,
    eliminarBloque,
    duplicarBloque,
    actualizarBloque,
    reordenarBloques,
  } = mutations;

  const {
    seleccionarBloque,
    deseleccionarBloque,
    actualizarBloqueLocal,
    toggleVisibilidadBloque,
    reordenarBloquesLocal,
    setBloqueRecienAgregado,
  } = storeActions;

  const handleAgregarBloque = useCallback(
    async (tipo) => {
      if (!paginaActiva) {
        toast.error('Selecciona una página primero');
        return;
      }

      try {
        const nuevoBloque = await crearBloque.mutateAsync({
          pagina_id: paginaActiva.id,
          tipo: tipo,
          orden: bloques.length,
        });
        seleccionarBloque(nuevoBloque.id);
        setBloqueRecienAgregado(nuevoBloque.id);
        toast.success('Bloque agregado');
        return nuevoBloque;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al agregar bloque');
      }
    },
    [paginaActiva, bloques.length, crearBloque, seleccionarBloque, setBloqueRecienAgregado]
  );

  const handleActualizarBloque = useCallback(
    (bloqueId, contenido) => {
      actualizarBloqueLocal(bloqueId, contenido);
    },
    [actualizarBloqueLocal]
  );

  const handleEliminarBloque = useCallback(
    async (bloqueId) => {
      const bloque = bloques.find((b) => b.id === bloqueId);
      if (!bloque) {
        toast.error('Bloque no encontrado');
        return;
      }
      try {
        await eliminarBloque.mutateAsync({
          id: bloqueId,
          paginaId: bloque.pagina_id,
        });
        deseleccionarBloque();
        toast.success('Bloque eliminado');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar');
      }
    },
    [bloques, eliminarBloque, deseleccionarBloque]
  );

  const handleDuplicarBloque = useCallback(
    async (bloqueId) => {
      try {
        const duplicado = await duplicarBloque.mutateAsync(bloqueId);
        seleccionarBloque(duplicado.id);
        toast.success('Bloque duplicado');
        return duplicado;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al duplicar');
      }
    },
    [duplicarBloque, seleccionarBloque]
  );

  const handleToggleVisibilidad = useCallback(
    async (bloqueId) => {
      const bloque = bloques.find((b) => b.id === bloqueId);
      if (!bloque) return;

      const nuevoVisible = !bloque.visible;
      toggleVisibilidadBloque(bloqueId);

      try {
        await actualizarBloque.mutateAsync({
          id: bloqueId,
          data: {
            visible: nuevoVisible,
            version: bloque.version,
          },
          paginaId: bloque.pagina_id,
        });
      } catch (error) {
        toggleVisibilidadBloque(bloqueId);
        toast.error(error.response?.data?.message || 'Error al cambiar visibilidad');
      }
    },
    [bloques, toggleVisibilidadBloque, actualizarBloque]
  );

  const handleReordenarBloques = useCallback(
    async (nuevoOrden) => {
      const idsOrdenados = nuevoOrden.map((item) =>
        typeof item === 'string' ? item : item.id
      );

      reordenarBloquesLocal(idsOrdenados);

      try {
        await reordenarBloques.mutateAsync({
          paginaId: paginaActiva.id,
          ordenamiento: idsOrdenados.map((id, index) => ({ id, orden: index })),
        });
      } catch (error) {
        toast.error('Error al reordenar');
      }
    },
    [reordenarBloques, reordenarBloquesLocal, paginaActiva?.id]
  );

  return {
    handleAgregarBloque,
    handleActualizarBloque,
    handleEliminarBloque,
    handleDuplicarBloque,
    handleToggleVisibilidad,
    handleReordenarBloques,
  };
}
