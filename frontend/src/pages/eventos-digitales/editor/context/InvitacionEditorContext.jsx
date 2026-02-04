/**
 * ====================================================================
 * INVITACION EDITOR CONTEXT
 * ====================================================================
 * Contexto principal para el editor de invitaciones digitales.
 * Maneja estado, bloques, autosave y acciones del editor.
 *
 * @version 1.1.0 - Integrado con EditorLayoutContext para responsive
 * @since 2026-02-03
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useInvitacionEditorStore } from '@/store';
import { eventosDigitalesApi } from '@/services/api/modules';
import { useEditorLayoutContext } from '@/components/editor-framework';
import { getBlockDefaults } from '../config';

// ========== CONTEXT ==========

const InvitacionEditorContext = createContext(null);

// ========== PROVIDER ==========

/**
 * InvitacionEditorProvider - Proveedor del contexto del editor
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export function InvitacionEditorProvider({ children }) {
  const { id: eventoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ========== STATE ==========

  const [mostrarPropiedades, setMostrarPropiedades] = useState(true);
  const [modoPreview, setModoPreview] = useState(false);
  const [modoEditor, setModoEditor] = useState('canvas'); // 'canvas' | 'blocks'

  // Obtener funciones del layout context (para abrir drawer en móvil)
  const layoutContext = useEditorLayoutContext();

  // Función helper para abrir propiedades (usa layout context para móvil)
  const abrirPropiedades = useCallback(() => {
    if (layoutContext.propertiesAsDrawer) {
      // En móvil/tablet, abrir drawer
      layoutContext.abrirPropiedades();
    } else {
      // En desktop, mostrar panel
      setMostrarPropiedades(true);
    }
  }, [layoutContext]);

  // ========== STORE ==========

  const bloques = useInvitacionEditorStore((state) => state.bloques);
  const bloqueSeleccionado = useInvitacionEditorStore((state) => state.bloqueSeleccionado);
  const estadoGuardado = useInvitacionEditorStore((state) => state.estadoGuardado);
  const setBloques = useInvitacionEditorStore((state) => state.setBloques);
  const actualizarBloqueLocal = useInvitacionEditorStore((state) => state.actualizarBloqueLocal);
  const reordenarBloquesLocal = useInvitacionEditorStore((state) => state.reordenarBloquesLocal);
  const agregarBloqueLocal = useInvitacionEditorStore((state) => state.agregarBloqueLocal);
  const eliminarBloqueLocal = useInvitacionEditorStore((state) => state.eliminarBloqueLocal);
  const duplicarBloqueLocal = useInvitacionEditorStore((state) => state.duplicarBloqueLocal);
  const toggleVisibilidadBloque = useInvitacionEditorStore((state) => state.toggleVisibilidadBloque);
  const insertarBloqueEnPosicion = useInvitacionEditorStore((state) => state.insertarBloqueEnPosicion);
  const seleccionarBloque = useInvitacionEditorStore((state) => state.seleccionarBloque);
  const deseleccionarBloque = useInvitacionEditorStore((state) => state.deseleccionarBloque);
  const setGuardando = useInvitacionEditorStore((state) => state.setGuardando);
  const setGuardado = useInvitacionEditorStore((state) => state.setGuardado);
  const setErrorGuardado = useInvitacionEditorStore((state) => state.setErrorGuardado);
  const limpiarBloques = useInvitacionEditorStore((state) => state.limpiarBloques);

  // ========== QUERIES ==========

  // Obtener evento
  const {
    data: evento,
    isLoading: eventoLoading,
    error: eventoError,
  } = useQuery({
    queryKey: ['evento', eventoId],
    queryFn: () => eventosDigitalesApi.getById(eventoId),
    select: (response) => response.data.data,
    enabled: !!eventoId,
  });

  // Obtener bloques de invitación
  const {
    data: bloquesData,
    isLoading: bloquesLoading,
    error: bloquesError,
  } = useQuery({
    queryKey: ['evento', eventoId, 'bloques'],
    queryFn: () => eventosDigitalesApi.getBloques(eventoId),
    select: (response) => response.data.data,
    enabled: !!eventoId,
  });

  // Cargar bloques en store cuando lleguen
  useEffect(() => {
    if (bloquesData?.bloques) {
      setBloques(bloquesData.bloques, eventoId);
    }
  }, [bloquesData, eventoId, setBloques]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      limpiarBloques();
    };
  }, [limpiarBloques]);

  // ========== MUTATIONS ==========

  // Guardar bloques
  const guardarBloquesMutation = useMutation({
    mutationFn: (bloquesAGuardar) =>
      eventosDigitalesApi.saveBloques(eventoId, bloquesAGuardar),
    onMutate: () => {
      setGuardando();
    },
    onSuccess: () => {
      setGuardado();
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId, 'bloques'] });
    },
    onError: (error) => {
      setErrorGuardado();
      toast.error('Error al guardar los cambios');
      console.error('[InvitacionEditor] Error guardando:', error);
    },
  });

  // Publicar/Despublicar evento
  const publicarMutation = useMutation({
    mutationFn: () => eventosDigitalesApi.publicarEvento(eventoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId] });
      toast.success(evento?.publicado ? 'Invitación despublicada' : 'Invitación publicada');
    },
    onError: (error) => {
      toast.error('Error al cambiar estado de publicación');
      console.error('[InvitacionEditor] Error publicando:', error);
    },
  });

  // ========== AUTOSAVE ==========

  const autosaveTimeoutRef = useRef(null);

  // Efecto para autosave cuando cambian los bloques
  useEffect(() => {
    if (estadoGuardado !== 'unsaved') return;

    // Limpiar timeout anterior
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Nuevo timeout para guardar
    autosaveTimeoutRef.current = setTimeout(() => {
      guardarBloquesMutation.mutate(bloques);
    }, 2000); // 2 segundos de debounce

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [bloques, estadoGuardado]);

  // ========== HANDLERS ==========

  /**
   * Guardar ahora (manual)
   */
  const guardarAhora = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    guardarBloquesMutation.mutate(bloques);
  }, [bloques, guardarBloquesMutation]);

  /**
   * Agregar nuevo bloque
   */
  const handleAgregarBloque = useCallback(
    (tipo) => {
      const nuevoBloque = {
        id: crypto.randomUUID(),
        tipo,
        orden: bloques.length,
        visible: true,
        contenido: getBlockDefaults(tipo),
        estilos: {},
        version: 1,
      };

      agregarBloqueLocal(nuevoBloque);
    },
    [bloques.length, agregarBloqueLocal]
  );

  /**
   * Actualizar bloque
   */
  const handleActualizarBloque = useCallback(
    (id, cambios) => {
      actualizarBloqueLocal(id, cambios);
    },
    [actualizarBloqueLocal]
  );

  /**
   * Eliminar bloque
   */
  const handleEliminarBloque = useCallback(
    (id) => {
      eliminarBloqueLocal(id);
    },
    [eliminarBloqueLocal]
  );

  /**
   * Duplicar bloque
   */
  const handleDuplicarBloque = useCallback(
    (id) => {
      const nuevoId = crypto.randomUUID();
      duplicarBloqueLocal(id, nuevoId);
    },
    [duplicarBloqueLocal]
  );

  /**
   * Toggle visibilidad
   */
  const handleToggleVisibilidad = useCallback(
    (id) => {
      toggleVisibilidadBloque(id);
    },
    [toggleVisibilidadBloque]
  );

  /**
   * Reordenar bloques (desde drag-drop)
   */
  const handleReordenarBloques = useCallback(
    (nuevoOrden) => {
      reordenarBloquesLocal(nuevoOrden);
    },
    [reordenarBloquesLocal]
  );

  /**
   * Drop desde paleta (recibe objeto de DndEditorProvider)
   */
  const handleDropFromPalette = useCallback(
    ({ tipo, targetId, position }) => {
      // Calcular índice basado en targetId y position
      let indice = bloques.length; // Por defecto al final

      if (targetId) {
        const targetIndex = bloques.findIndex((b) => b.id === targetId);
        if (targetIndex !== -1) {
          indice = position === 'before' ? targetIndex : targetIndex + 1;
        }
      }

      const nuevoBloque = {
        id: crypto.randomUUID(),
        tipo,
        orden: indice,
        visible: true,
        contenido: getBlockDefaults(tipo),
        estilos: {},
        version: 1,
      };

      insertarBloqueEnPosicion(nuevoBloque, indice);
    },
    [bloques, insertarBloqueEnPosicion]
  );

  /**
   * DnD reorder (recibe objeto de DndEditorProvider)
   */
  const handleDndReorder = useCallback(
    ({ activeId, overId }) => {
      const oldIndex = bloques.findIndex((b) => b.id === activeId);
      const newIndex = bloques.findIndex((b) => b.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = [...bloques];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      const nuevoOrden = newOrder.map((b) => b.id);
      reordenarBloquesLocal(nuevoOrden);
    },
    [bloques, reordenarBloquesLocal]
  );

  /**
   * Volver a lista de eventos
   */
  const handleVolver = useCallback(() => {
    navigate('/eventos-digitales');
  }, [navigate]);

  /**
   * Publicar/Despublicar invitación
   */
  const handlePublicar = useCallback(() => {
    publicarMutation.mutate();
  }, [publicarMutation]);

  // ========== BLOQUE SELECCIONADO COMPLETO ==========

  const bloqueSeleccionadoCompleto = useMemo(
    () => bloques.find((b) => b.id === bloqueSeleccionado),
    [bloques, bloqueSeleccionado]
  );

  // ========== COMPUTED ==========

  const isLoading = eventoLoading || bloquesLoading;
  const error = eventoError || bloquesError;
  const estaGuardando = estadoGuardado === 'saving';
  const estaPublicando = publicarMutation.isPending;
  const estaPublicado = evento?.publicado || false;

  // ========== CONTEXT VALUE ==========

  const value = useMemo(
    () => ({
      // Datos
      evento,
      eventoId,
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,

      // Estado
      isLoading,
      error,
      estadoGuardado,
      estaGuardando,
      estaPublicando,
      estaPublicado,
      modoPreview,
      modoEditor,
      mostrarPropiedades,

      // Setters
      setModoPreview,
      setModoEditor,
      setMostrarPropiedades,
      abrirPropiedades,

      // Handlers de bloques
      handleAgregarBloque,
      handleActualizarBloque,
      handleEliminarBloque,
      handleDuplicarBloque,
      handleToggleVisibilidad,
      handleReordenarBloques,
      handleDropFromPalette,
      handleDndReorder,

      // Selección
      seleccionarBloque,
      deseleccionarBloque,

      // Guardado
      guardarAhora,

      // Publicación
      handlePublicar,

      // Navegación
      handleVolver,
    }),
    [
      evento,
      eventoId,
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      isLoading,
      error,
      estadoGuardado,
      estaGuardando,
      estaPublicando,
      estaPublicado,
      modoPreview,
      modoEditor,
      mostrarPropiedades,
      abrirPropiedades,
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
      guardarAhora,
      handlePublicar,
      handleVolver,
    ]
  );

  return (
    <InvitacionEditorContext.Provider value={value}>
      {children}
    </InvitacionEditorContext.Provider>
  );
}

// ========== HOOK ==========

/**
 * Hook para acceder al contexto del editor de invitaciones
 *
 * @returns {Object} Contexto del editor
 * @throws {Error} Si se usa fuera de InvitacionEditorProvider
 */
export function useInvitacionEditor() {
  const context = useContext(InvitacionEditorContext);
  if (!context) {
    throw new Error('useInvitacionEditor debe usarse dentro de InvitacionEditorProvider');
  }
  return context;
}

export default InvitacionEditorContext;
