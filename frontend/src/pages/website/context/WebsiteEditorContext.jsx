/**
 * ====================================================================
 * WEBSITE EDITOR CONTEXT (CENTRALIZADO)
 * ====================================================================
 * Contexto principal para el editor del Website Builder.
 * Consolida los 4 contextos anteriores (Site, Layout, Blocks, UI) en uno solo.
 *
 * Sigue el patrón de InvitacionEditorContext para consistencia entre editores.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { toast } from 'sonner';

import {
  useWebsiteEditorStore,
  useTemporalStore,
} from '@/store';
import { useWebsiteEditor } from '@/hooks/otros';
import { useWebsiteBloques } from '@/hooks/otros/website';
import {
  useAutosave,
  hashBloques,
  useEditorShortcuts,
  useEditorLayout,
  useDndHandlers,
} from '@/components/editor-framework';

// ========== CONTEXT ==========

const WebsiteEditorContext = createContext(null);

// ========== PANEL TYPES ==========

const WEBSITE_PANEL_TYPES = {
  BLOQUES: 'bloques',
  PAGINAS: 'paginas',
  TEMA: 'tema',
  TEMPLATES: 'templates',
  PROPIEDADES: 'propiedades',
};

// ========== PROVIDER ==========

/**
 * WebsiteEditorProvider - Proveedor del contexto del editor
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export function WebsiteEditorProvider({ children }) {
  // ========== STATE ==========

  const [paginaActiva, setPaginaActiva] = useState(null);
  const [modoEditor, setModoEditor] = useState('canvas'); // 'canvas' | 'bloques'
  const [modoPreview, setModoPreview] = useState(false);
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    query: '',
  });
  const [tourReady, setTourReady] = useState(false);

  // Modales
  const [mostrarCrearSitio, setMostrarCrearSitio] = useState(false);
  const [mostrarTemplates, setMostrarTemplates] = useState(false);
  const [mostrarAIWizard, setMostrarAIWizard] = useState(false);

  // ========== STORE ==========

  const bloques = useWebsiteEditorStore((s) => s.bloques);
  const bloqueSeleccionado = useWebsiteEditorStore((s) => s.bloqueSeleccionado);
  const bloqueEditandoInline = useWebsiteEditorStore((s) => s.bloqueEditandoInline);
  const estadoGuardado = useWebsiteEditorStore((s) => s.estadoGuardado);
  const breakpoint = useWebsiteEditorStore((s) => s.breakpoint);
  const zoom = useWebsiteEditorStore((s) => s.zoom);
  const tieneClambiosLocales = useWebsiteEditorStore((s) => s.tieneClambiosLocales);

  // Store actions
  const setBloques = useWebsiteEditorStore((s) => s.setBloques);
  const seleccionarBloque = useWebsiteEditorStore((s) => s.seleccionarBloque);
  const deseleccionarBloque = useWebsiteEditorStore((s) => s.deseleccionarBloque);
  const actualizarBloqueLocal = useWebsiteEditorStore((s) => s.actualizarBloqueLocal);
  const actualizarVersionBloque = useWebsiteEditorStore((s) => s.actualizarVersionBloque);
  const reordenarBloquesLocal = useWebsiteEditorStore((s) => s.reordenarBloquesLocal);
  const toggleVisibilidadBloque = useWebsiteEditorStore((s) => s.toggleVisibilidadBloque);
  const insertarBloqueEnPosicion = useWebsiteEditorStore((s) => s.insertarBloqueEnPosicion);
  const setBloqueRecienAgregado = useWebsiteEditorStore((s) => s.setBloqueRecienAgregado);
  const desactivarInlineEditing = useWebsiteEditorStore((s) => s.desactivarInlineEditing);
  const setBreakpoint = useWebsiteEditorStore((s) => s.setBreakpoint);
  const setZoom = useWebsiteEditorStore((s) => s.setZoom);
  const setGuardando = useWebsiteEditorStore((s) => s.setGuardando);
  const setGuardado = useWebsiteEditorStore((s) => s.setGuardado);
  const setErrorGuardado = useWebsiteEditorStore((s) => s.setErrorGuardado);
  const setConflictoVersion = useWebsiteEditorStore((s) => s.setConflictoVersion);

  // ========== LAYOUT HOOK ==========

  const layout = useEditorLayout({
    panels: ['bloques', 'paginas', 'tema', 'templates', 'propiedades'],
    defaultPanel: 'bloques',
    customPanelTypes: {
      PAGINAS: 'paginas',
      TEMA: 'tema',
      TEMPLATES: 'templates',
    },
  });

  // ========== DATA HOOK ==========

  const editorData = useWebsiteEditor();
  const {
    config,
    paginas,
    tiposBloques,
    isLoading: configLoading,
    tieneSitio,
    estaPublicado,
    crearConfig,
    actualizarConfig,
    publicarSitio,
    crearPagina,
    actualizarPagina,
    eliminarPagina,
    crearBloque,
    actualizarBloque,
    reordenarBloques,
    duplicarBloque,
    eliminarBloque,
  } = editorData;

  // Bloques de la página activa (desde servidor)
  const { data: bloquesData, isLoading: bloquesLoading } = useWebsiteBloques(
    paginaActiva?.id
  );

  // ========== EFFECTS ==========

  // Seleccionar primera página al cargar
  useEffect(() => {
    if (paginas.length > 0 && !paginaActiva) {
      const paginaInicio = paginas.find((p) => p.es_inicio) || paginas[0];
      setPaginaActiva(paginaInicio);
    }
  }, [paginas, paginaActiva]);

  // Sincronizar bloques del servidor con el store
  useEffect(() => {
    if (bloquesData && paginaActiva?.id) {
      setBloques(bloquesData, paginaActiva.id);
    }
  }, [bloquesData, paginaActiva?.id, setBloques]);

  // Auto-ajustar breakpoint y zoom en móvil
  useEffect(() => {
    if (layout.isMobile && tieneSitio) {
      if (breakpoint !== 'mobile') {
        setBreakpoint('mobile');
      }
      setZoom(100);
    }
  }, [layout.isMobile, tieneSitio, breakpoint, setBreakpoint, setZoom]);

  // Marcar el tour como listo cuando el editor está cargado
  useEffect(() => {
    if (tieneSitio && !bloquesLoading && paginaActiva) {
      const timeoutId = setTimeout(() => {
        setTourReady(true);
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [tieneSitio, bloquesLoading, paginaActiva]);

  // ========== AUTOSAVE ==========

  const handleSaveAll = useCallback(
    async (bloquesToSave) => {
      for (const bloque of bloquesToSave) {
        const resultado = await actualizarBloque.mutateAsync({
          id: bloque.id,
          data: {
            contenido: bloque.contenido,
            version: bloque.version,
          },
          paginaId: bloque.pagina_id,
        });
        if (resultado?.version) {
          actualizarVersionBloque(bloque.id, resultado.version);
        }
      }
    },
    [actualizarBloque, actualizarVersionBloque]
  );

  const { guardarAhora, estaGuardando } = useAutosave({
    onSave: handleSaveAll,
    enabled: true,
    debounceMs: 3000,
    items: bloques,
    hasChanges: tieneClambiosLocales,
    computeHash: hashBloques,
    onSaving: () => setGuardando(),
    onSaved: () => setGuardado(),
    onError: () => setErrorGuardado(),
    onConflict: ({ mensaje }) =>
      setConflictoVersion({ mensaje, timestamp: new Date().toISOString() }),
  });

  // ========== KEYBOARD SHORTCUTS ==========

  useEditorShortcuts({
    enabled: tieneSitio,
    onSave: guardarAhora,
    onDuplicate: (id) => {
      if (id) handleDuplicarBloque(id);
    },
    onDelete: (id) => {
      if (id && paginaActiva) handleEliminarBloque(id);
    },
    onUndo: () => {
      const temporal = useTemporalStore();
      if (temporal.pastStates?.length > 0) {
        temporal.undo();
      }
    },
    onRedo: () => {
      const temporal = useTemporalStore();
      if (temporal.futureStates?.length > 0) {
        temporal.redo();
      }
    },
    selectedBlockId: bloqueSeleccionado,
    inlineEditingBlockId: bloqueEditandoInline,
    deseleccionarBloque,
    desactivarInlineEditing,
  });

  // ========== HANDLERS SITE ==========

  const handleCrearSitio = useCallback(
    async (datosIniciales) => {
      try {
        await crearConfig.mutateAsync(datosIniciales);
        toast.success('Sitio web creado exitosamente');
        setMostrarCrearSitio(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al crear sitio');
      }
    },
    [crearConfig]
  );

  const handlePublicar = useCallback(async () => {
    try {
      await publicarSitio.mutateAsync({
        id: config.id,
        publicar: !estaPublicado,
      });
      toast.success(
        estaPublicado ? 'Sitio despublicado' : 'Sitio publicado exitosamente'
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al publicar');
    }
  }, [publicarSitio, config?.id, estaPublicado]);

  // ========== HANDLERS BLOQUES ==========

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

  // Crear función para crear bloques (usado por useDndHandlers)
  const crearBloqueNuevo = useCallback((tipo, orden) => ({
    id: crypto.randomUUID(),
    tipo,
    orden,
    contenido: {},
    estilos: {},
    visible: true,
    version: 1,
  }), []);

  const { handleDropFromPalette, handleDndReorder } = useDndHandlers({
    bloques,
    onInsertBlock: async (bloque, indice) => {
      if (!paginaActiva) {
        toast.error('Selecciona una página primero');
        return;
      }

      try {
        const nuevoBloque = await crearBloque.mutateAsync({
          pagina_id: paginaActiva.id,
          tipo: bloque.tipo,
          orden: indice,
        });
        seleccionarBloque(nuevoBloque.id);
        setBloqueRecienAgregado(nuevoBloque.id);
        toast.success('Bloque agregado');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al agregar bloque');
      }
    },
    onReorderBlocks: reordenarBloquesLocal,
    createBlock: crearBloqueNuevo,
  });

  // ========== SLASH MENU ==========

  const handleSlashSelect = useCallback(
    (tipoBloque) => {
      setSlashMenu({ isOpen: false, position: { x: 0, y: 0 }, query: '' });
      handleAgregarBloque(tipoBloque);
    },
    [handleAgregarBloque]
  );

  const handleSlashClose = useCallback(() => {
    setSlashMenu({ isOpen: false, position: { x: 0, y: 0 }, query: '' });
  }, []);

  // Slash menu keyboard handler
  useEffect(() => {
    if (!tieneSitio) return;

    const handleSlashKey = (e) => {
      const target = e.target;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      if (e.key === '/' && !slashMenu.isOpen && !isEditable) {
        e.preventDefault();
        setSlashMenu({
          isOpen: true,
          position: {
            x: window.innerWidth / 2 - 150,
            y: window.innerHeight / 3,
          },
          query: '',
        });
      } else if (slashMenu.isOpen) {
        if (e.key === 'Escape') {
          setSlashMenu((prev) => ({ ...prev, isOpen: false, query: '' }));
        } else if (e.key === 'Backspace') {
          if (slashMenu.query === '') {
            setSlashMenu((prev) => ({ ...prev, isOpen: false }));
          } else {
            setSlashMenu((prev) => ({
              ...prev,
              query: prev.query.slice(0, -1),
            }));
          }
        } else if (
          e.key.length === 1 &&
          !e.metaKey &&
          !e.ctrlKey &&
          !['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)
        ) {
          setSlashMenu((prev) => ({
            ...prev,
            query: prev.query + e.key,
          }));
        }
      }
    };

    window.addEventListener('keydown', handleSlashKey);
    return () => window.removeEventListener('keydown', handleSlashKey);
  }, [tieneSitio, slashMenu.isOpen, slashMenu.query]);

  // ========== COMPUTED ==========

  const isLoading = configLoading || bloquesLoading;
  const bloqueSeleccionadoCompleto = useMemo(
    () => bloques.find((b) => b.id === bloqueSeleccionado),
    [bloques, bloqueSeleccionado]
  );

  // ========== CONTEXT VALUE ==========

  const value = useMemo(
    () => ({
      // ===== DATOS SITE =====
      config,
      paginas,
      paginaActiva,
      tiposBloques,
      tieneSitio,
      estaPublicado,
      isLoading,

      // ===== DATOS BLOQUES =====
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      bloquesLoading,

      // ===== UI STATE =====
      modoEditor,
      modoPreview,
      slashMenu,
      tourReady,

      // ===== GUARDADO =====
      estadoGuardado,
      estaGuardando,
      guardarAhora,

      // ===== RESPONSIVE (del store y layout) =====
      breakpoint,
      zoom,
      isMobile: layout.isMobile,
      isTablet: layout.isTablet,
      isDesktop: layout.isDesktop,
      showSidebar: layout.showSidebar,
      showSecondaryPanel: layout.showSecondaryPanel,
      propertiesAsDrawer: layout.propertiesAsDrawer,
      showPropertiesPanel: layout.showPropertiesPanel,
      drawerAbierto: layout.drawerAbierto,
      panelActivo: layout.panelActivo,
      mostrarPropiedades: layout.mostrarPropiedades,

      // ===== SETTERS =====
      setPaginaActiva,
      setModoEditor,
      setModoPreview,
      setSlashMenu,
      setBreakpoint,
      setZoom,

      // ===== LAYOUT ACTIONS =====
      openPanel: layout.openPanel,
      closeDrawer: layout.closeDrawer,
      setPanelActivo: layout.setPanelActivo,
      abrirPropiedades: layout.abrirPropiedades,
      cerrarPropiedades: layout.cerrarPropiedades,
      setMostrarPropiedades: layout.setMostrarPropiedades,
      PANEL_TYPES: WEBSITE_PANEL_TYPES,

      // ===== MODALES =====
      mostrarCrearSitio,
      setMostrarCrearSitio,
      mostrarTemplates,
      setMostrarTemplates,
      mostrarAIWizard,
      setMostrarAIWizard,

      // ===== HANDLERS SITE =====
      handleCrearSitio,
      handlePublicar,

      // ===== HANDLERS BLOQUES =====
      handleAgregarBloque,
      handleActualizarBloque,
      handleEliminarBloque,
      handleDuplicarBloque,
      handleToggleVisibilidad,
      handleReordenarBloques,
      handleDropFromPalette,
      handleDndReorder,

      // ===== SELECCIÓN =====
      seleccionarBloque,
      deseleccionarBloque,

      // ===== SLASH MENU =====
      handleSlashSelect,
      handleSlashClose,

      // ===== MUTATIONS RAW =====
      crearConfig,
      actualizarConfig,
      publicarSitio,
      crearPagina,
      actualizarPagina,
      eliminarPagina,
    }),
    [
      // Site
      config,
      paginas,
      paginaActiva,
      tiposBloques,
      tieneSitio,
      estaPublicado,
      isLoading,
      // Bloques
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      bloquesLoading,
      // UI
      modoEditor,
      modoPreview,
      slashMenu,
      tourReady,
      // Guardado
      estadoGuardado,
      estaGuardando,
      guardarAhora,
      // Responsive
      breakpoint,
      zoom,
      layout,
      // Modales
      mostrarCrearSitio,
      mostrarTemplates,
      mostrarAIWizard,
      // Handlers
      handleCrearSitio,
      handlePublicar,
      handleAgregarBloque,
      handleActualizarBloque,
      handleEliminarBloque,
      handleDuplicarBloque,
      handleToggleVisibilidad,
      handleReordenarBloques,
      handleDropFromPalette,
      handleDndReorder,
      handleSlashSelect,
      handleSlashClose,
      seleccionarBloque,
      deseleccionarBloque,
      // Mutations
      crearConfig,
      actualizarConfig,
      publicarSitio,
      crearPagina,
      actualizarPagina,
      eliminarPagina,
    ]
  );

  return (
    <WebsiteEditorContext.Provider value={value}>
      {children}
    </WebsiteEditorContext.Provider>
  );
}

// ========== HOOK ==========

/**
 * Hook para acceder al contexto del editor de Website
 *
 * @returns {Object} Contexto del editor
 * @throws {Error} Si se usa fuera de WebsiteEditorProvider
 */
export function useWebsiteEditorContext() {
  const context = useContext(WebsiteEditorContext);
  if (!context) {
    throw new Error('useWebsiteEditorContext debe usarse dentro de WebsiteEditorProvider');
  }
  return context;
}

export default WebsiteEditorContext;
