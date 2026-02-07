/**
 * ====================================================================
 * INVITACION EDITOR CONTEXT
 * ====================================================================
 * Contexto principal para el editor de invitaciones digitales.
 * Maneja estado, bloques, autosave y acciones del editor.
 *
 * @version 2.0.0 - Descompuesto: useFreePositionManager, useInvitacionAutosave, useInvitacionTema
 * @since 2026-02-03
 * @updated 2026-02-07
 */

import { useContext, useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/hooks/config';
import { useInvitacionEditorStore } from '@/store';
import { eventosDigitalesApi } from '@/services/api/modules';
import {
  EditorContext,
  useEditorLayoutContext,
  useEditorBlockHandlers,
  bloquesToSecciones,
  detectarModoLibre,
} from '@/components/editor-framework';
import { registerInvitacionElementTypes } from '../elements';
import { registerInvitacionMigrators } from '../elements';
import { crearBloqueNuevo, BLOQUES_INVITACION } from '../config';
import { crearBloqueAperturaLegacy } from '../../constants';
import { useFreePositionManager } from '../hooks/useFreePositionManager';
import { useInvitacionAutosave } from '../hooks/useInvitacionAutosave';
import { useInvitacionTema } from '../hooks/useInvitacionTema';

// ========== CONTEXT (usa el compartido) ==========

const InvitacionEditorContext = EditorContext;

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
  const [modoEditor, setModoEditor] = useState('canvas'); // 'canvas' | 'bloques' | 'libre'

  // Registrar tipos de elementos y migradores de invitaciones al montar
  useEffect(() => {
    registerInvitacionElementTypes();
    registerInvitacionMigrators();
  }, []);

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

  // Obtener evento
  const {
    data: evento,
    isLoading: eventoLoading,
    error: eventoError,
  } = useQuery({
    queryKey: queryKeys.eventosDigitales.eventos.detail(eventoId),
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
    queryKey: queryKeys.eventosDigitales.eventos.bloques(eventoId),
    queryFn: () => eventosDigitalesApi.getBloques(eventoId),
    select: (response) => response.data.data,
    enabled: !!eventoId,
  });

  const bloquesQueryKey = queryKeys.eventosDigitales.eventos.bloques(eventoId);

  // ========== MUTATIONS ==========

  // Guardar bloques (sin callbacks - manejados por useAutosave)
  const guardarBloquesMutation = useMutation({
    mutationFn: (bloquesAGuardar) =>
      eventosDigitalesApi.saveBloques(eventoId, bloquesAGuardar),
  });

  // ========== FREE POSITION MANAGER ==========

  const {
    getFreePositionStore,
    cambiarAModoLibre,
    salirDeModoLibre,
    seccionesSnapshot,
    estadoGuardadoLibreSnapshot,
    subscribirAStoreLibre,
  } = useFreePositionManager({
    eventoId,
    bloques,
    bloquesData,
    setBloques,
    setModoEditor,
    guardarBloquesMutation,
    queryClient,
    bloquesQueryKey,
  });

  // Suscribirse a cambios del store libre cuando estamos en modo libre
  useEffect(() => {
    return subscribirAStoreLibre(modoEditor);
  }, [modoEditor, subscribirAStoreLibre]);

  // Cargar bloques en store cuando lleguen (detecta modo libre automáticamente)
  // Usar useLayoutEffect para que el cambio de modoEditor se aplique ANTES del paint,
  // evitando flash visual donde el toggle muestra estado incorrecto momentáneamente
  useLayoutEffect(() => {
    if (bloquesData?.bloques) {
      let bloques = bloquesData.bloques;

      // Migración lazy: si hay config apertura legacy sin bloque apertura, crearlo
      const tieneBlqueApertura = bloques.some(b => b.tipo === 'apertura');
      if (!tieneBlqueApertura) {
        const bloqueApertura = crearBloqueAperturaLegacy(evento?.configuracion);
        if (bloqueApertura) {
          bloques = [bloqueApertura, ...bloques.map((b, i) => ({ ...b, orden: i + 1 }))];
        }
      }

      // Detectar si hay secciones libres guardadas
      if (detectarModoLibre(bloques)) {
        const secciones = bloquesToSecciones(bloques);
        const store = getFreePositionStore();
        store.getState().cargarDatos({ secciones }, eventoId);
        setModoEditor('libre');
      } else {
        setBloques(bloques, eventoId);
      }
    }
  }, [bloquesData, eventoId, evento?.configuracion, setBloques, getFreePositionStore]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      limpiarBloques();
    };
  }, [limpiarBloques]);

  // ========== AUTOSAVE ==========

  const { guardarAhora, guardarSeccionesAhora } = useInvitacionAutosave({
    modoEditor,
    bloques,
    estadoGuardado,
    seccionesSnapshot,
    estadoGuardadoLibreSnapshot,
    guardarBloquesMutation,
    getFreePositionStore,
    setGuardando,
    setGuardado,
    setErrorGuardado,
    queryClient,
    eventoId,
    bloquesQueryKey,
  });

  // ========== MUTATIONS (UI) ==========

  // Publicar/Despublicar evento
  const publicarMutation = useMutation({
    mutationFn: () => eventosDigitalesApi.publicarEvento(eventoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventosDigitales.eventos.detail(eventoId) });
      toast.success(evento?.estado === 'publicado' ? 'Invitación despublicada' : 'Invitación publicada');
    },
    onError: (error) => {
      toast.error('Error al cambiar estado de publicación');
      console.error('[InvitacionEditor] Error publicando:', error);
    },
  });

  // Actualizar configuración del evento (animación apertura, etc.)
  const actualizarConfiguracionMutation = useMutation({
    mutationFn: (configuracion) =>
      eventosDigitalesApi.actualizarEvento(eventoId, { configuracion }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventosDigitales.eventos.detail(eventoId) });
      toast.success('Configuración actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar la configuración');
      console.error('[InvitacionEditor] Error actualizando configuración:', error);
    },
  });

  // Actualizar plantilla del evento (colores del tema)
  const actualizarPlantillaMutation = useMutation({
    mutationFn: (plantilla) =>
      eventosDigitalesApi.actualizarEvento(eventoId, { plantilla }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventosDigitales.eventos.detail(eventoId) });
      toast.success('Colores actualizados');
    },
    onError: (error) => {
      toast.error('Error al actualizar los colores');
      console.error('[InvitacionEditor] Error actualizando plantilla:', error);
    },
  });

  // ========== HANDLERS ==========

  const handleVolver = useCallback(() => {
    navigate('/eventos-digitales');
  }, [navigate]);

  const handleActualizarConfiguracion = useCallback(
    (config) => {
      actualizarConfiguracionMutation.mutate({
        ...evento?.configuracion,
        ...config,
      });
    },
    [evento?.configuracion, actualizarConfiguracionMutation]
  );

  const handlePublicar = useCallback(() => {
    publicarMutation.mutate();
  }, [publicarMutation]);

  const handleActualizarPlantilla = useCallback(
    (plantilla) => {
      actualizarPlantillaMutation.mutate(plantilla);
    },
    [actualizarPlantillaMutation]
  );

  // ========== TEMA MEMOIZADO ==========

  const tema = useInvitacionTema(evento?.plantilla);

  // ========== COMPUTED ==========

  const isLoading = eventoLoading || bloquesLoading;
  const error = eventoError || bloquesError;
  const estaGuardando = modoEditor === 'libre'
    ? estadoGuardadoLibreSnapshot === 'saving'
    : estadoGuardado === 'saving';
  const estadoGuardadoActual = modoEditor === 'libre'
    ? estadoGuardadoLibreSnapshot
    : estadoGuardado;
  const estaPublicando = publicarMutation.isPending;
  const estaPublicado = evento?.estado === 'publicado';
  const esModoLibreGuardado = useMemo(() => {
    return detectarModoLibre(bloquesData?.bloques || []);
  }, [bloquesData]);

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
      estadoGuardado: estadoGuardadoActual,
      estaGuardando,
      estaPublicando,
      estaPublicado,
      esModoLibreGuardado,
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

      // Modo libre (Free Position Canvas)
      getFreePositionStore,
      cambiarAModoLibre,
      salirDeModoLibre,

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
      guardarAhora: modoEditor === 'libre' ? guardarSeccionesAhora : guardarAhora,
      guardarSeccionesAhora,

      // Publicación
      handlePublicar,

      // Plantilla/Tema
      handleActualizarPlantilla,
      estaActualizandoPlantilla: actualizarPlantillaMutation.isPending,

      // Configuración (animación apertura, etc.)
      handleActualizarConfiguracion,
      estaActualizandoConfiguracion: actualizarConfiguracionMutation.isPending,

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
      estadoGuardadoActual,
      estaGuardando,
      estaPublicando,
      estaPublicado,
      esModoLibreGuardado,
      modoPreview,
      modoEditor,
      mostrarPropiedades,
      breakpoint,
      zoom,
      abrirPropiedades,
      setBreakpoint,
      setZoom,
      getFreePositionStore,
      cambiarAModoLibre,
      salirDeModoLibre,
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
      guardarSeccionesAhora,
      handlePublicar,
      handleActualizarPlantilla,
      actualizarPlantillaMutation.isPending,
      handleActualizarConfiguracion,
      actualizarConfiguracionMutation.isPending,
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
