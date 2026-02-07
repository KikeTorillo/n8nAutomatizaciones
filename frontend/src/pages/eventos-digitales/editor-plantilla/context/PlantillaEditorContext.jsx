/**
 * ====================================================================
 * PLANTILLA EDITOR CONTEXT
 * ====================================================================
 * Contexto para el editor visual de plantillas de eventos digitales.
 * Provee al EditorContext compartido con datos de plantilla.
 *
 * @since 2026-02-06
 * @updated 2026-02-06 - Refactored: useEditorBlockHandlers
 */

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useInvitacionEditorStore } from '@/store';
import { eventosDigitalesApi } from '@/services/api/modules';
import {
  EditorContext,
  useEditorLayoutContext,
  useAutosave,
  hashBloques,
  useEditorBlockHandlers,
  createFreePositionStore,
} from '@/components/editor-framework';
import {
  usePlantilla,
  usePlantillaBloques,
  useActualizarPlantilla,
  EVENTO_QUERY_KEYS,
} from '@/hooks/otros/eventos-digitales';
import { registerInvitacionElementTypes } from '../../editor/elements';
import { registerInvitacionMigrators } from '../../editor/elements';
import { crearBloqueNuevo, BLOQUES_INVITACION } from '../../editor/config';
import { generarPreviewData } from '@/utils/plantillaDummyData';
import { INVITACION_TEMA_DEFAULT } from '../../constants';

// ========== PROVIDER ==========

export function PlantillaEditorProvider({ children }) {
  const { id: plantillaId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ========== STATE ==========

  const [modoPreview, setModoPreview] = useState(false);
  const [modoEditor, setModoEditor] = useState('canvas'); // 'canvas' | 'bloques'

  // Registrar tipos de elementos y migradores al montar
  useEffect(() => {
    registerInvitacionElementTypes();
    registerInvitacionMigrators();
  }, []);

  // Layout context
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

  // Store actions object for useEditorBlockHandlers
  const storeActions = useMemo(() => ({
    bloques,
    bloqueSeleccionado,
    agregarBloqueLocal: useInvitacionEditorStore.getState().agregarBloqueLocal,
    eliminarBloqueLocal: useInvitacionEditorStore.getState().eliminarBloqueLocal,
    duplicarBloqueLocal: useInvitacionEditorStore.getState().duplicarBloqueLocal,
    actualizarBloqueLocal: useInvitacionEditorStore.getState().actualizarBloqueLocal,
    reordenarBloquesLocal: useInvitacionEditorStore.getState().reordenarBloquesLocal,
    toggleVisibilidadBloque: useInvitacionEditorStore.getState().toggleVisibilidadBloque,
    insertarBloqueEnPosicion: useInvitacionEditorStore.getState().insertarBloqueEnPosicion,
  }), [bloques, bloqueSeleccionado]);

  // ========== BLOCK HANDLERS (shared) ==========

  const {
    handleAgregarBloque,
    handleActualizarBloque,
    handleEliminarBloque,
    handleDuplicarBloque,
    handleToggleVisibilidad,
    handleReordenarBloques,
    handleDropFromPalette,
    handleDndReorder,
    bloqueSeleccionadoCompleto,
  } = useEditorBlockHandlers({
    store: storeActions,
    bloquesConfig: BLOQUES_INVITACION,
    crearBloque: crearBloqueNuevo,
  });

  // ========== QUERIES ==========

  const {
    data: plantilla,
    isLoading: plantillaLoading,
    error: plantillaError,
  } = usePlantilla(plantillaId);

  const {
    data: bloquesData,
    isLoading: bloquesLoading,
    error: bloquesError,
  } = usePlantillaBloques(plantillaId);

  // Cargar bloques en store
  useLayoutEffect(() => {
    if (bloquesData) {
      setBloques(bloquesData, `plantilla-${plantillaId}`);
    }
  }, [bloquesData, plantillaId, setBloques]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      limpiarBloques();
    };
  }, [limpiarBloques]);

  // ========== MUTATIONS ==========

  // Guardar bloques de plantilla
  const guardarBloquesMutation = useMutation({
    mutationFn: (bloquesAGuardar) =>
      eventosDigitalesApi.guardarBloquesPlantilla(plantillaId, bloquesAGuardar),
  });

  // Actualizar plantilla (tema)
  const actualizarPlantillaMutation = useActualizarPlantilla();

  // ========== AUTOSAVE BLOQUES ==========

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
      queryClient.invalidateQueries({ queryKey: EVENTO_QUERY_KEYS.plantillaBloques(plantillaId) });
    },
    onError: (error) => {
      setErrorGuardado();
      toast.error('Error al guardar los cambios');
      console.error('[PlantillaEditor] Error guardando:', error);
    },
  });

  // ========== HANDLERS ==========

  const handleVolver = useCallback(() => {
    navigate('/eventos-digitales/plantillas');
  }, [navigate]);

  /**
   * Actualizar plantilla (tema/colores)
   */
  const handleActualizarPlantilla = useCallback(
    (tema) => {
      actualizarPlantillaMutation.mutate(
        { id: plantillaId, data: { tema } },
        {
          onSuccess: () => {
            toast.success('Colores actualizados');
          },
          onError: () => {
            toast.error('Error al actualizar los colores');
          },
        }
      );
    },
    [plantillaId, actualizarPlantillaMutation]
  );

  // ========== EVENTO DUMMY (para preview) ==========

  const tipoEvento = plantilla?.tipo_evento || 'cumpleanos';

  const tema = useMemo(
    () => ({
      ...INVITACION_TEMA_DEFAULT,
      ...(plantilla?.tema || {}),
    }),
    [plantilla?.tema]
  );

  // Generar evento dummy para preview de bloques
  const eventoDummy = useMemo(() => {
    const { evento: previewEvento } = generarPreviewData(tipoEvento, tema);
    return {
      ...previewEvento,
      id: plantillaId,
      plantilla: tema,
      tipo: tipoEvento,
      configuracion: {},
    };
  }, [tipoEvento, tema, plantillaId]);

  // ========== COMPUTED ==========

  const isLoading = plantillaLoading || bloquesLoading;
  const error = plantillaError || bloquesError;
  const estaGuardando = estadoGuardado === 'saving';

  // ========== FREE POSITION STORE (stub - no usado en plantillas pero requerido por containers) ==========

  const freePositionStoreRef = useRef(null);
  const getFreePositionStore = useCallback(() => {
    if (!freePositionStoreRef.current) {
      freePositionStoreRef.current = createFreePositionStore({
        name: `plantilla-${plantillaId}`,
        persist: false,
      });
    }
    return freePositionStoreRef.current;
  }, [plantillaId]);

  // ========== CONTEXT VALUE ==========

  const value = useMemo(
    () => ({
      // Datos
      evento: eventoDummy,
      eventoId: plantillaId,
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      tema,

      // Flag de plantilla
      esPlantilla: true,
      plantillaId,
      plantilla,

      // Estado
      isLoading,
      error,
      estadoGuardado,
      estaGuardando,
      estaPublicando: false,
      estaPublicado: false,
      esModoLibreGuardado: false,
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

      // Modo libre (stubs - no usado en plantillas)
      getFreePositionStore,
      cambiarAModoLibre: () => {},
      salirDeModoLibre: () => {},

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
      guardarSeccionesAhora: guardarAhora,

      // Publicación (no aplica)
      handlePublicar: () => {},

      // Plantilla/Tema
      handleActualizarPlantilla,
      estaActualizandoPlantilla: actualizarPlantillaMutation.isPending,

      // Configuración (no aplica en plantillas)
      handleActualizarConfiguracion: () => {},
      estaActualizandoConfiguracion: false,

      // Navegación
      handleVolver,
    }),
    [
      eventoDummy,
      plantillaId,
      plantilla,
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      tema,
      isLoading,
      error,
      estadoGuardado,
      estaGuardando,
      modoPreview,
      modoEditor,
      mostrarPropiedades,
      breakpoint,
      zoom,
      abrirPropiedades,
      setBreakpoint,
      setZoom,
      getFreePositionStore,
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
      handleActualizarPlantilla,
      actualizarPlantillaMutation.isPending,
      handleVolver,
    ]
  );

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}
