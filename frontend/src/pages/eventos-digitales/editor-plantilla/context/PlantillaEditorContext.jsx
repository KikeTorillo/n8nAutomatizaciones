/**
 * ====================================================================
 * PLANTILLA EDITOR CONTEXT
 * ====================================================================
 * Contexto para el editor visual de plantillas de eventos digitales.
 * Provee al EditorContext compartido con datos de plantilla.
 *
 * @since 2026-02-06
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
  useDndHandlers,
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
import { crearBloqueNuevo } from '../../editor/utils';
import { BLOQUES_INVITACION } from '../../editor/config';
import { generarPreviewData } from '@/utils/plantillaDummyData';

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

  const handleAgregarBloque = useCallback(
    (tipo) => {
      const configBloque = BLOQUES_INVITACION.find(b => b.tipo === tipo);
      if (configBloque?.unico && bloques.some(b => b.tipo === tipo)) {
        toast.warning(`Solo puedes tener un bloque de ${configBloque.label}`);
        return;
      }

      const nuevoBloque = crearBloqueNuevo(tipo, bloques.length);

      if (tipo === 'apertura') {
        insertarBloqueEnPosicion(nuevoBloque, 0);
      } else {
        agregarBloqueLocal(nuevoBloque);
      }
    },
    [bloques, agregarBloqueLocal, insertarBloqueEnPosicion]
  );

  const handleActualizarBloque = useCallback(
    (id, cambios) => {
      actualizarBloqueLocal(id, cambios);
    },
    [actualizarBloqueLocal]
  );

  const handleEliminarBloque = useCallback(
    (id) => {
      eliminarBloqueLocal(id);
    },
    [eliminarBloqueLocal]
  );

  const handleDuplicarBloque = useCallback(
    (id) => {
      const nuevoId = crypto.randomUUID();
      duplicarBloqueLocal(id, nuevoId);
    },
    [duplicarBloqueLocal]
  );

  const handleToggleVisibilidad = useCallback(
    (id) => {
      toggleVisibilidadBloque(id);
    },
    [toggleVisibilidadBloque]
  );

  const handleReordenarBloques = useCallback(
    (nuevoOrden) => {
      reordenarBloquesLocal(nuevoOrden);
    },
    [reordenarBloquesLocal]
  );

  const { handleDropFromPalette, handleDndReorder } = useDndHandlers({
    bloques,
    onInsertBlock: insertarBloqueEnPosicion,
    onReorderBlocks: reordenarBloquesLocal,
    createBlock: crearBloqueNuevo,
  });

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
      color_primario: '#753572',
      color_secundario: '#F59E0B',
      color_fondo: '#FFFFFF',
      color_texto: '#1f2937',
      color_texto_claro: '#6b7280',
      fuente_titulos: 'Playfair Display',
      fuente_titulo: 'Playfair Display',
      fuente_cuerpo: 'Inter',
      patron_fondo: 'none',
      patron_opacidad: 0.1,
      decoracion_esquinas: 'none',
      icono_principal: 'none',
      efecto_titulo: 'none',
      marco_fotos: 'none',
      stickers: [],
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

  // ========== BLOQUE SELECCIONADO COMPLETO ==========

  const bloqueSeleccionadoCompleto = useMemo(
    () => bloques.find((b) => b.id === bloqueSeleccionado),
    [bloques, bloqueSeleccionado]
  );

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
