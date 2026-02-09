/**
 * ====================================================================
 * BORRADOR EDITOR CONTEXT
 * ====================================================================
 * Tercer variant del EditorContext provider (junto con InvitacionEditorProvider
 * y PlantillaEditorContext). Provee la misma shape de contexto pero con datos
 * locales (localStorage) en vez de API.
 *
 * - Origen: localStorage (useBorradorStorage)
 * - Autosave: localStorage (no API)
 * - Modo libre: NO soportado en MVP
 * - Publicar/Guardar: triggerean gate modal (login requerido)
 *
 * @since 2026-02-08
 */

import { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';

import useAuthStore, { selectIsAuthenticated } from '@/features/auth/store/authStore';
import { useInvitacionEditorStore } from '@/store';
import {
  EditorContext,
  useEditorLayoutContext,
  useEditorBlockHandlers,
  useAutosave,
  hashBloques,
} from '@/components/editor-framework';
import { crearBloqueNuevo, BLOQUES_INVITACION } from '@/pages/eventos-digitales/editor/config';
import { useInvitacionTema } from '@/pages/eventos-digitales/editor/hooks/useInvitacionTema';
import { useBorradorStorage } from '../hooks/useBorradorStorage';

// Store noop para modo libre (no soportado en borrador)
// Los containers llaman getFreePositionStore() y usan el resultado como hook Zustand
const noop = () => {};
const useNoopFreePositionStore = create(() => ({
  secciones: [],
  seccionSeleccionada: null,
  elementoSeleccionado: null,
  elementoEditando: null,
  estadoGuardado: 'saved',
  cargarDatos: noop,
  setGuardando: noop,
  setGuardado: noop,
  setErrorGuardado: noop,
  agregarElemento: noop,
  seleccionarSeccion: noop,
  seleccionarElemento: noop,
  deseleccionarElemento: noop,
}));

// ========== PROVIDER ==========

export function BorradorEditorProvider({ children }) {
  const navigate = useNavigate();
  const storage = useBorradorStorage();

  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  // ========== STATE ==========

  const [modoPreview, setModoPreview] = useState(false);
  const [modoEditor, setModoEditor] = useState('canvas');
  const [borrador, setBorrador] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gateModalAbierto, setGateModalAbierto] = useState(false);
  const borradorRef = useRef(null);
  const autoOpenedRef = useRef(false);

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
  const limpiarBloques = useInvitacionEditorStore((state) => state.limpiarBloques);
  const breakpoint = useInvitacionEditorStore((state) => state.breakpoint);
  const setBreakpoint = useInvitacionEditorStore((state) => state.setBreakpoint);
  const zoom = useInvitacionEditorStore((state) => state.zoom);
  const setZoom = useInvitacionEditorStore((state) => state.setZoom);

  // Store actions for useEditorBlockHandlers
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

  // ========== CARGAR BORRADOR ==========

  useEffect(() => {
    const data = storage.cargar();
    if (!data) {
      navigate('/invitaciones/crear', { replace: true });
      return;
    }
    setBorrador(data);
    borradorRef.current = data;
    setBloques(data.bloques || [], 'borrador');
    setIsLoading(false);
  }, []); // Solo al montar

  // Auto-abrir modal de conversión si el usuario está autenticado y tiene borrador
  useEffect(() => {
    if (isAuthenticated && borrador && !autoOpenedRef.current && !isLoading) {
      autoOpenedRef.current = true;
      setGateModalAbierto(true);
    }
  }, [isAuthenticated, borrador, isLoading]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      limpiarBloques();
    };
  }, [limpiarBloques]);

  // ========== AUTOSAVE A LOCALSTORAGE ==========

  const handleLocalSave = useCallback(async (bloquesAGuardar) => {
    const current = borradorRef.current;
    if (!current) return;
    const updated = { ...current, bloques: bloquesAGuardar };
    storage.guardar(updated);
    borradorRef.current = updated;
    setBorrador(updated);
  }, [storage]);

  const { guardarAhora } = useAutosave({
    onSave: handleLocalSave,
    enabled: !!borrador,
    debounceMs: 1500,
    items: bloques,
    hasChanges: estadoGuardado === 'unsaved',
    computeHash: hashBloques,
    onSaving: () => setGuardando(),
    onSaved: () => setGuardado(),
    onError: () => setGuardado(), // localStorage no falla realmente
  });

  // ========== GATE MODAL ==========

  const abrirGateModal = useCallback(() => {
    setGateModalAbierto(true);
  }, []);

  const cerrarGateModal = useCallback(() => {
    setGateModalAbierto(false);
  }, []);

  // ========== HANDLERS (stub/gate) ==========

  const handlePublicar = useCallback(() => {
    abrirGateModal();
  }, [abrirGateModal]);

  const handleActualizarConfiguracion = useCallback((config) => {
    const current = borradorRef.current;
    if (!current) return;
    const updated = {
      ...current,
      configuracion: { ...(current.configuracion || {}), ...config },
    };
    storage.guardar(updated);
    borradorRef.current = updated;
    setBorrador(updated);
  }, [storage]);

  const handleActualizarPlantilla = useCallback((plantilla) => {
    const current = borradorRef.current;
    if (!current) return;
    const updated = { ...current, tema: { ...(current.tema || {}), ...plantilla } };
    storage.guardar(updated);
    borradorRef.current = updated;
    setBorrador(updated);
  }, [storage]);

  const handleVolver = useCallback(() => {
    navigate('/invitaciones');
  }, [navigate]);

  // ========== TEMA ==========

  const tema = useInvitacionTema(borrador?.tema);

  // ========== EVENTO DUMMY ==========

  const evento = useMemo(() => {
    if (!borrador) return null;
    return {
      id: 'borrador',
      nombre: 'Mi invitaci\u00f3n',
      tipo: borrador.tipoEvento,
      estado: 'borrador',
      plantilla: borrador.tema || {},
      configuracion: borrador.configuracion || {},
    };
  }, [borrador]);

  // ========== CONTEXT VALUE ==========

  const value = useMemo(
    () => ({
      // Datos
      evento,
      eventoId: 'borrador',
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      tema,

      // Estado
      isLoading,
      error: null,
      estadoGuardado,
      estaGuardando: estadoGuardado === 'saving',
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

      // Modo libre (stubs — no soportado en borrador)
      getFreePositionStore: () => useNoopFreePositionStore,
      cambiarAModoLibre: noop,
      salirDeModoLibre: noop,

      // Handlers de bloques
      handleAgregarBloque,
      handleActualizarBloque,
      handleEliminarBloque,
      handleDuplicarBloque,
      handleToggleVisibilidad,
      handleReordenarBloques,
      handleDropFromPalette,
      handleDndReorder,

      // Seleccion
      seleccionarBloque,
      deseleccionarBloque,

      // Guardado
      guardarAhora,
      guardarSeccionesAhora: guardarAhora,

      // Publicacion (gate)
      handlePublicar,

      // Plantilla/Tema
      handleActualizarPlantilla,
      estaActualizandoPlantilla: false,

      // Configuracion
      handleActualizarConfiguracion,
      estaActualizandoConfiguracion: false,

      // Navegacion
      handleVolver,

      // Borrador-specific
      isBorrador: true,
      gateModalAbierto,
      abrirGateModal,
      cerrarGateModal,
    }),
    [
      evento,
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      tema,
      isLoading,
      estadoGuardado,
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
      handleActualizarConfiguracion,
      handleVolver,
      gateModalAbierto,
      abrirGateModal,
      cerrarGateModal,
    ]
  );

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

// ========== HOOK ==========

export function useBorradorEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useBorradorEditor debe usarse dentro de BorradorEditorProvider');
  }
  return context;
}
