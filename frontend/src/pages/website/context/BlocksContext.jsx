/**
 * ====================================================================
 * BLOCKS CONTEXT
 * ====================================================================
 *
 * Contexto para el estado y operaciones de bloques.
 * Extraído de EditorContext para reducir re-renders.
 *
 * Responsabilidades:
 * - bloques, bloqueSeleccionado, bloqueSeleccionadoCompleto
 * - bloquesLoading
 * - handleAgregarBloque, handleActualizarBloque, handleEliminarBloque
 * - handleDuplicarBloque, handleToggleVisibilidad
 * - handleReordenarBloques, handleDropFromPalette, handleDndReorder
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { toast } from 'sonner';
import {
  useWebsiteEditorStore,
  selectBloques,
  selectBloqueSeleccionado,
  selectSetBloques,
  selectSeleccionarBloque,
  selectDeseleccionarBloque,
  selectActualizarBloqueLocal,
  selectReordenarBloquesLocal,
  selectSetBloqueRecienAgregado,
  selectActualizarVersionBloque,
  selectToggleVisibilidadBloque,
} from '@/store';
import { useWebsiteBloques } from '@/hooks/otros';

// ========== CONTEXT ==========

const BlocksContext = createContext(null);

// ========== PROVIDER ==========

/**
 * BlocksProvider - Proveedor del contexto de bloques
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 * @param {Object} props.paginaActiva - Página activa actual
 * @param {Object} props.editorMutations - Mutations del editor
 */
export function BlocksProvider({ children, paginaActiva, editorMutations }) {
  // ========== STORE STATE ==========
  const bloques = useWebsiteEditorStore(selectBloques);
  const bloqueSeleccionado = useWebsiteEditorStore(selectBloqueSeleccionado);
  const setBloques = useWebsiteEditorStore(selectSetBloques);
  const seleccionarBloque = useWebsiteEditorStore(selectSeleccionarBloque);
  const deseleccionarBloque = useWebsiteEditorStore(selectDeseleccionarBloque);
  const actualizarBloqueLocal = useWebsiteEditorStore(selectActualizarBloqueLocal);
  const actualizarVersionBloque = useWebsiteEditorStore(selectActualizarVersionBloque);
  const reordenarBloquesLocal = useWebsiteEditorStore(selectReordenarBloquesLocal);
  const toggleVisibilidadBloque = useWebsiteEditorStore(selectToggleVisibilidadBloque);
  const setBloqueRecienAgregado = useWebsiteEditorStore(selectSetBloqueRecienAgregado);

  // ========== MUTATIONS ==========
  const {
    crearBloque,
    actualizarBloque,
    reordenarBloques,
    duplicarBloque,
    eliminarBloque,
  } = editorMutations;

  // Bloques de la página activa (desde servidor)
  const { data: bloquesData, isLoading: bloquesLoading } = useWebsiteBloques(
    paginaActiva?.id
  );

  // ========== SINCRONIZAR BLOQUES CON STORE ==========
  useEffect(() => {
    if (bloquesData && paginaActiva?.id) {
      setBloques(bloquesData, paginaActiva.id);
    }
  }, [bloquesData, paginaActiva?.id, setBloques]);

  // ========== HANDLERS ==========

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

  // ========== DND HANDLERS ==========

  const handleDropFromPalette = useCallback(
    async ({ tipo, targetId, position }) => {
      if (!paginaActiva) {
        toast.error('Selecciona una página primero');
        return;
      }

      let ordenInsercion;

      if (targetId) {
        const targetBloque = bloques.find((b) => b.id === targetId);

        if (targetBloque) {
          const targetOrden = targetBloque.orden ?? bloques.indexOf(targetBloque);

          if (position === 'before') {
            ordenInsercion = targetOrden;
          } else {
            ordenInsercion = targetOrden + 1;
          }
        }
      }

      if (ordenInsercion === undefined) {
        const maxOrden = bloques.reduce((max, b) => Math.max(max, b.orden ?? 0), -1);
        ordenInsercion = maxOrden + 1;
      }

      try {
        const nuevoBloque = await crearBloque.mutateAsync({
          pagina_id: paginaActiva.id,
          tipo: tipo,
          orden: ordenInsercion,
        });
        seleccionarBloque(nuevoBloque.id);
        setBloqueRecienAgregado(nuevoBloque.id);
        toast.success('Bloque agregado');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al agregar bloque');
      }
    },
    [paginaActiva, bloques, crearBloque, seleccionarBloque, setBloqueRecienAgregado]
  );

  const handleDndReorder = useCallback(
    ({ activeId, overId }) => {
      const oldIndex = bloques.findIndex((b) => b.id === activeId);
      const newIndex = bloques.findIndex((b) => b.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const nuevoOrden = [...bloques];
        const [removed] = nuevoOrden.splice(oldIndex, 1);
        nuevoOrden.splice(newIndex, 0, removed);
        handleReordenarBloques(nuevoOrden.map((b) => b.id));
      }
    },
    [bloques, handleReordenarBloques]
  );

  // ========== COMPUTED ==========

  const bloqueSeleccionadoCompleto = useMemo(
    () => bloques.find((b) => b.id === bloqueSeleccionado),
    [bloques, bloqueSeleccionado]
  );

  // ========== CONTEXT VALUE ==========

  const value = useMemo(
    () => ({
      // Bloques
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      bloquesLoading,

      // Handlers de bloques
      handleAgregarBloque,
      handleActualizarBloque,
      handleEliminarBloque,
      handleDuplicarBloque,
      handleToggleVisibilidad,
      handleReordenarBloques,
      handleDropFromPalette,
      handleDndReorder,

      // Store actions (para casos específicos)
      seleccionarBloque,
      deseleccionarBloque,
      actualizarVersionBloque,
    }),
    [
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      bloquesLoading,
      handleAgregarBloque,
      handleActualizarBloque,
      handleEliminarBloque,
      handleDuplicarBloque,
      handleToggleVisibilidad,
      handleReordenarBloques,
      handleDropFromPalette,
      handleDndReorder,
      seleccionarBloque,
      deseleccionarBloque,
      actualizarVersionBloque,
    ]
  );

  return (
    <BlocksContext.Provider value={value}>
      {children}
    </BlocksContext.Provider>
  );
}

// ========== HOOK ==========

/**
 * Hook para acceder al contexto de bloques
 * @returns {Object} Contexto de bloques
 * @throws {Error} Si se usa fuera de BlocksProvider
 */
export function useBlocks() {
  const context = useContext(BlocksContext);
  if (!context) {
    throw new Error('useBlocks debe usarse dentro de un BlocksProvider');
  }
  return context;
}

export default BlocksContext;
