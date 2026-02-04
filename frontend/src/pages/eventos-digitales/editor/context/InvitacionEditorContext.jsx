/**
 * ====================================================================
 * INVITACION EDITOR CONTEXT
 * ====================================================================
 * Contexto principal para el editor de invitaciones digitales.
 * Maneja estado, bloques, autosave y acciones del editor.
 *
 * @version 1.4.0 - Centralizado tema, zoom expuesto, hook useDndHandlers
 * @since 2026-02-03
 * @updated 2026-02-04
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useInvitacionEditorStore } from '@/store';
import { eventosDigitalesApi } from '@/services/api/modules';
import { useEditorLayoutContext, useAutosave, hashBloques, useDndHandlers } from '@/components/editor-framework';
import { crearBloqueNuevo } from '../utils';

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

  const [modoPreview, setModoPreview] = useState(false);
  const [modoEditor, setModoEditor] = useState('canvas'); // 'canvas' | 'bloques'

  // Obtener estado de propiedades del layout context (única fuente de verdad)
  const {
    mostrarPropiedades,
    setMostrarPropiedades,
    abrirPropiedades,
  } = useEditorLayoutContext();

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
  const breakpoint = useInvitacionEditorStore((state) => state.breakpoint);
  const setBreakpoint = useInvitacionEditorStore((state) => state.setBreakpoint);
  const zoom = useInvitacionEditorStore((state) => state.zoom);
  const setZoom = useInvitacionEditorStore((state) => state.setZoom);

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

  // Guardar bloques (sin callbacks - manejados por useAutosave)
  const guardarBloquesMutation = useMutation({
    mutationFn: (bloquesAGuardar) =>
      eventosDigitalesApi.saveBloques(eventoId, bloquesAGuardar),
  });

  // Publicar/Despublicar evento
  const publicarMutation = useMutation({
    mutationFn: () => eventosDigitalesApi.publicarEvento(eventoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId] });
      toast.success(evento?.estado === 'publicado' ? 'Invitación despublicada' : 'Invitación publicada');
    },
    onError: (error) => {
      toast.error('Error al cambiar estado de publicación');
      console.error('[InvitacionEditor] Error publicando:', error);
    },
  });

  // Actualizar plantilla del evento (colores del tema)
  const actualizarPlantillaMutation = useMutation({
    mutationFn: (plantilla) =>
      eventosDigitalesApi.actualizarEvento(eventoId, { plantilla }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId] });
      toast.success('Colores actualizados');
    },
    onError: (error) => {
      toast.error('Error al actualizar los colores');
      console.error('[InvitacionEditor] Error actualizando plantilla:', error);
    },
  });

  // ========== AUTOSAVE (usando hook del framework) ==========

  const { guardarAhora } = useAutosave({
    onSave: async (bloquesAGuardar) => {
      await guardarBloquesMutation.mutateAsync(bloquesAGuardar);
    },
    enabled: true,
    debounceMs: 2000,
    items: bloques,
    hasChanges: estadoGuardado === 'unsaved',
    computeHash: hashBloques,
    onSaving: () => setGuardando(),
    onSaved: () => {
      setGuardado();
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId, 'bloques'] });
    },
    onError: (error) => {
      setErrorGuardado();
      toast.error('Error al guardar los cambios');
      console.error('[InvitacionEditor] Error guardando:', error);
    },
    onConflict: ({ mensaje }) => {
      toast.error(mensaje || 'Conflicto de versión detectado', { duration: 6000 });
    },
  });

  // ========== HANDLERS ==========

  /**
   * Agregar nuevo bloque
   */
  const handleAgregarBloque = useCallback(
    (tipo) => {
      const nuevoBloque = crearBloqueNuevo(tipo, bloques.length);
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
   * DnD handlers (usando hook reutilizable del framework)
   */
  const { handleDropFromPalette, handleDndReorder } = useDndHandlers({
    bloques,
    onInsertBlock: insertarBloqueEnPosicion,
    onReorderBlocks: reordenarBloquesLocal,
    createBlock: crearBloqueNuevo,
  });

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

  /**
   * Actualizar plantilla (colores del tema)
   */
  const handleActualizarPlantilla = useCallback(
    (plantilla) => {
      actualizarPlantillaMutation.mutate(plantilla);
    },
    [actualizarPlantillaMutation]
  );

  // ========== BLOQUE SELECCIONADO COMPLETO ==========

  const bloqueSeleccionadoCompleto = useMemo(
    () => bloques.find((b) => b.id === bloqueSeleccionado),
    [bloques, bloqueSeleccionado]
  );

  // ========== TEMA MEMOIZADO (centralizado) ==========

  const tema = useMemo(
    () => ({
      color_primario: evento?.plantilla?.color_primario || '#753572',
      color_secundario: evento?.plantilla?.color_secundario || '#F59E0B',
      fuente_titulos: evento?.plantilla?.fuente_titulos || 'Playfair Display',
      fuente_cuerpo: evento?.plantilla?.fuente_cuerpo || 'Inter',
    }),
    [evento?.plantilla]
  );

  // ========== COMPUTED ==========

  const isLoading = eventoLoading || bloquesLoading;
  const error = eventoError || bloquesError;
  const estaGuardando = estadoGuardado === 'saving';
  const estaPublicando = publicarMutation.isPending;
  const estaPublicado = evento?.estado === 'publicado';

  // ========== CONTEXT VALUE ==========

  const value = useMemo(
    () => ({
      // Datos
      evento,
      eventoId,
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      tema,

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
      breakpoint,
      zoom,

      // Setters
      setModoPreview,
      setModoEditor,
      setMostrarPropiedades,
      abrirPropiedades,
      setBreakpoint,
      setZoom,

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

      // Plantilla/Tema
      handleActualizarPlantilla,
      estaActualizandoPlantilla: actualizarPlantillaMutation.isPending,

      // Navegación
      handleVolver,
    }),
    [
      evento,
      eventoId,
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      tema,
      isLoading,
      error,
      estadoGuardado,
      estaGuardando,
      estaPublicando,
      estaPublicado,
      modoPreview,
      modoEditor,
      mostrarPropiedades,
      breakpoint,
      zoom,
      abrirPropiedades,
      setBreakpoint,
      setZoom,
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
      handleActualizarPlantilla,
      actualizarPlantillaMutation.isPending,
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
