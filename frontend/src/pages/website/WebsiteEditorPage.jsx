/**
 * ====================================================================
 * WEBSITE EDITOR PAGE - v2.0 WYSIWYG
 * ====================================================================
 * Editor visual WYSIWYG del sitio web con inline editing,
 * undo/redo, autosave y templates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe2,
  Plus,
  Eye,
  Loader2,
  FileText,
  Palette,
  ExternalLink,
  Check,
  X,
  Layout,
  Settings,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

// Store
import {
  useWebsiteEditorStore,
  selectBloques,
  selectBloqueSeleccionado,
  selectSetBloques,
  selectSeleccionarBloque,
  selectDeseleccionarBloque,
  selectActualizarBloqueLocal,
  selectReordenarBloquesLocal,
  selectBreakpoint,
  selectSetBreakpoint,
  selectSetZoom,
} from '@/store';

// Hooks existentes
import { useWebsiteEditor, useWebsiteBloques } from '@/hooks/otros';

// Hooks nuevos del editor
import { useAutosave, useEstadoGuardado, useEditorShortcuts, useEditorLayout } from './hooks';

// Componentes del editor
import PageManager from './components/PageManager';
import BlockPalette from './components/BlockPalette';
import BlockEditor from './components/BlockEditor';
import ThemeEditor from './components/ThemeEditor';
import EditorCanvas from './components/EditorCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import TemplateGallery from './components/TemplateGallery';
import SlashMenu from './components/SlashMenu';
import { DndEditorProvider } from './components/DndEditorProvider';
import AIWizardModal from './components/AIWizard/AIWizardModal';
import MobileEditorFAB from './components/MobileEditorFAB';

// UI
import { BackButton, Drawer } from '@/components/ui';

/**
 * WebsiteEditorPage - Editor visual WYSIWYG del sitio web
 */
function WebsiteEditorPage() {
  const navigate = useNavigate();

  // ========== ESTADO LOCAL ==========
  const [paginaActiva, setPaginaActiva] = useState(null);
  const [mostrarCrearSitio, setMostrarCrearSitio] = useState(false);
  const [mostrarTemplates, setMostrarTemplates] = useState(false);
  const [modoEditor, setModoEditor] = useState('canvas'); // 'canvas' | 'bloques'
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    query: '',
  });
  const [mostrarAIWizard, setMostrarAIWizard] = useState(false);

  // ========== LAYOUT RESPONSIVE ==========
  const {
    isMobile,
    isTablet,
    isDesktop,
    layoutType,
    showSidebar,
    showSecondaryPanel,
    propertiesAsDrawer,
    showPropertiesPanel,
    drawerAbierto,
    panelActivo,
    mostrarPropiedades,
    openPanel,
    closeDrawer,
    setPanelActivo,
    abrirPropiedades,
    cerrarPropiedades,
    setMostrarPropiedades,
    PANEL_TYPES,
  } = useEditorLayout();

  // ========== STORE STATE ==========
  const bloques = useWebsiteEditorStore(selectBloques);
  const bloqueSeleccionado = useWebsiteEditorStore(selectBloqueSeleccionado);
  const setBloques = useWebsiteEditorStore(selectSetBloques);
  const seleccionarBloque = useWebsiteEditorStore(selectSeleccionarBloque);
  const deseleccionarBloque = useWebsiteEditorStore(selectDeseleccionarBloque);
  const actualizarBloqueLocal = useWebsiteEditorStore(selectActualizarBloqueLocal);
  const reordenarBloquesLocal = useWebsiteEditorStore(selectReordenarBloquesLocal);
  const breakpoint = useWebsiteEditorStore(selectBreakpoint);
  const setBreakpoint = useWebsiteEditorStore(selectSetBreakpoint);
  const setZoom = useWebsiteEditorStore(selectSetZoom);

  // ========== HOOK DEL EDITOR ==========
  const {
    config,
    paginas,
    tiposBloques,
    isLoading,
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
  } = useWebsiteEditor();

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

  // Seleccionar primera página al cargar
  useEffect(() => {
    if (paginas.length > 0 && !paginaActiva) {
      const paginaInicio = paginas.find((p) => p.es_inicio) || paginas[0];
      setPaginaActiva(paginaInicio);
    }
  }, [paginas, paginaActiva]);

  // Abrir drawer de propiedades al seleccionar bloque en móvil/tablet
  useEffect(() => {
    if (bloqueSeleccionado && propertiesAsDrawer && modoEditor === 'canvas') {
      abrirPropiedades();
    }
  }, [bloqueSeleccionado, propertiesAsDrawer, modoEditor, abrirPropiedades]);

  // Auto-ajustar breakpoint y zoom en móvil
  useEffect(() => {
    if (isMobile && tieneSitio) {
      // Auto-seleccionar breakpoint Mobile en viewport móvil
      if (breakpoint !== 'mobile') {
        setBreakpoint('mobile');
      }
      // Siempre usar 100% en móvil para mejor visibilidad
      setZoom(100);
    }
  }, [isMobile, tieneSitio, breakpoint, setBreakpoint, setZoom]);

  // ========== AUTOSAVE ==========
  const handleSaveAll = useCallback(
    async (bloquesToSave) => {
      // Guardar cada bloque modificado
      for (const bloque of bloquesToSave) {
        await actualizarBloque.mutateAsync({
          id: bloque.id,
          data: { contenido: bloque.contenido },
        });
      }
    },
    [actualizarBloque]
  );

  const { guardarAhora, estaGuardando } = useAutosave({
    onSave: handleSaveAll,
    enabled: true,
    debounceMs: 3000,
  });

  // ========== KEYBOARD SHORTCUTS ==========
  useEditorShortcuts({
    onSave: guardarAhora,
    onDuplicate: (id) => {
      if (id) {
        duplicarBloque.mutateAsync(id);
      }
    },
    onDelete: (id) => {
      if (id && paginaActiva) {
        eliminarBloque.mutateAsync({ id, paginaId: paginaActiva.id });
      }
    },
    enabled: true,
  });

  // ========== HANDLERS ==========

  const handleCrearSitio = async (datosIniciales) => {
    try {
      await crearConfig.mutateAsync(datosIniciales);
      toast.success('Sitio web creado exitosamente');
      setMostrarCrearSitio(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear sitio');
    }
  };

  const handlePublicar = async () => {
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
  };

  const handleAgregarBloque = async (tipo) => {
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
      toast.success('Bloque agregado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al agregar bloque');
    }
  };

  const handleActualizarBloque = async (bloqueId, contenido) => {
    // Actualizar localmente primero (para UX inmediata)
    actualizarBloqueLocal(bloqueId, contenido);
    // El autosave se encargará de persistir
  };

  const handleEliminarBloque = async (bloqueId) => {
    try {
      await eliminarBloque.mutateAsync({
        id: bloqueId,
        paginaId: paginaActiva.id,
      });
      deseleccionarBloque();
      toast.success('Bloque eliminado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleDuplicarBloque = async (bloqueId) => {
    try {
      const duplicado = await duplicarBloque.mutateAsync(bloqueId);
      seleccionarBloque(duplicado.id);
      toast.success('Bloque duplicado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al duplicar');
    }
  };

  const handleReordenarBloques = async (nuevoOrden) => {
    // Actualizar localmente primero
    reordenarBloquesLocal(nuevoOrden);

    // Persistir en servidor
    try {
      await reordenarBloques.mutateAsync({
        paginaId: paginaActiva.id,
        ordenamiento: nuevoOrden.map((id, index) => ({ id, orden: index })),
      });
    } catch (error) {
      toast.error('Error al reordenar');
    }
  };

  // ========== DND HANDLERS (PALETA -> CANVAS) ==========

  /**
   * Handler para cuando se suelta un bloque desde la paleta al canvas
   */
  const handleDropFromPalette = useCallback(
    async ({ tipo, targetId, position }) => {
      if (!paginaActiva) {
        toast.error('Selecciona una pagina primero');
        return;
      }

      // Calcular el orden real donde insertar (basado en el orden del bloque target, no el índice del array)
      let ordenInsercion;

      if (targetId) {
        const targetBloque = bloques.find((b) => b.id === targetId);

        if (targetBloque) {
          // Usar el orden REAL del bloque target desde la DB
          const targetOrden = targetBloque.orden ?? bloques.indexOf(targetBloque);

          if (position === 'before') {
            ordenInsercion = targetOrden;
          } else {
            ordenInsercion = targetOrden + 1;
          }

          console.log('[DnD Debug]', {
            tipo,
            targetId,
            targetOrden,
            position,
            ordenInsercion,
            totalBloques: bloques.length,
          });
        }
      }

      // Si no hay target o no se encontró, insertar al final
      if (ordenInsercion === undefined) {
        const maxOrden = bloques.reduce((max, b) => Math.max(max, b.orden ?? 0), -1);
        ordenInsercion = maxOrden + 1;
        console.log('[DnD Debug] Sin target, insertando al final:', ordenInsercion);
      }

      try {
        const nuevoBloque = await crearBloque.mutateAsync({
          pagina_id: paginaActiva.id,
          tipo: tipo,
          orden: ordenInsercion,
        });
        seleccionarBloque(nuevoBloque.id);
        toast.success('Bloque agregado');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al agregar bloque');
      }
    },
    [paginaActiva, bloques, crearBloque, seleccionarBloque]
  );

  /**
   * Handler para reordenar bloques dentro del canvas via DnD
   */
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

  // ========== SLASH MENU HANDLERS ==========

  const handleSlashSelect = useCallback(
    (tipoBloque) => {
      setSlashMenu({ isOpen: false, position: { x: 0, y: 0 }, query: '' });
      handleAgregarBloque(tipoBloque);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginaActiva, bloques.length]
  );

  const handleSlashClose = useCallback(() => {
    setSlashMenu({ isOpen: false, position: { x: 0, y: 0 }, query: '' });
  }, []);

  // Slash menu keyboard handler
  useEffect(() => {
    if (!tieneSitio) return;

    const handleSlashKey = (e) => {
      // Ignorar si está en un input/textarea o contentEditable
      const target = e.target;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      if (e.key === '/' && !slashMenu.isOpen && !isEditable) {
        e.preventDefault();
        // Abrir el slash menu en el centro de la pantalla
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

  // Obtener bloque seleccionado completo
  const bloqueSeleccionadoCompleto = useMemo(
    () => bloques.find((b) => b.id === bloqueSeleccionado),
    [bloques, bloqueSeleccionado]
  );

  // ========== RENDER: LOADING ==========
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando editor...</p>
        </div>
      </div>
    );
  }

  // ========== RENDER: NO TIENE SITIO ==========
  if (!tieneSitio && !mostrarCrearSitio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <BackButton to="/home" label="Volver al Inicio" className="mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Mi Sitio Web
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crea tu página web pública
          </p>
        </div>

        {/* Empty state */}
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe2 className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Crea tu sitio web
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Diseña una página web profesional para tu negocio con nuestro
              editor visual. Arrastra y suelta bloques para crear tu sitio en
              minutos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setMostrarAIWizard(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all font-medium shadow-lg shadow-primary-500/25"
              >
                <Sparkles className="w-5 h-5" />
                Crear con IA
              </button>
              <button
                onClick={() => setMostrarTemplates(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Layout className="w-5 h-5" />
                Elegir template
              </button>
              <button
                onClick={() => setMostrarCrearSitio(true)}
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Empezar de cero
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-primary-700 dark:text-primary-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                11 tipos de bloques
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Hero, servicios, equipo, contacto y más
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Palette className="w-6 h-6 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Personalizable
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Colores, fuentes y estilos a tu gusto
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                SEO optimizado
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Meta tags y Open Graph incluidos
              </p>
            </div>
          </div>
        </div>

        {/* Template Gallery Modal */}
        <TemplateGallery
          isOpen={mostrarTemplates}
          onClose={() => setMostrarTemplates(false)}
          onTemplateApplied={() => {
            setMostrarTemplates(false);
          }}
        />

        {/* AI Wizard Modal */}
        <AIWizardModal
          isOpen={mostrarAIWizard}
          onClose={() => setMostrarAIWizard(false)}
          onSitioCreado={() => {
            setMostrarAIWizard(false);
            // El hook useWebsiteEditor hara refetch automaticamente
          }}
        />
      </div>
    );
  }

  // ========== RENDER: MODAL CREAR SITIO ==========
  if (mostrarCrearSitio) {
    return (
      <CrearSitioModal
        onCrear={handleCrearSitio}
        onCancelar={() => setMostrarCrearSitio(false)}
        isLoading={crearConfig.isPending}
      />
    );
  }

  // ========== RENDER: EDITOR PRINCIPAL ==========
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header del editor - Responsive */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 h-12 sm:h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* BackButton - solo icono en móvil */}
          <BackButton to="/home" label={isMobile ? '' : 'Volver'} />
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            {/* Nombre del sitio - truncado en móvil */}
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate max-w-[80px] sm:max-w-[150px] md:max-w-none">
              {config?.nombre_sitio || 'Mi Sitio'}
            </span>
          </div>
          {/* Status badge - compacto en móvil */}
          <span
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
              estaPublicado
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            }`}
          >
            {estaPublicado ? (isMobile ? 'Pub' : 'Publicado') : (isMobile ? 'Borr' : 'Borrador')}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Editor Mode Toggle - oculto en móvil (usa modo canvas por defecto) */}
          <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setModoEditor('canvas')}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-sm transition-colors ${
                modoEditor === 'canvas'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span className="hidden md:inline">Visual</span>
            </button>
            <button
              onClick={() => setModoEditor('bloques')}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-sm transition-colors ${
                modoEditor === 'bloques'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Bloques</span>
            </button>
          </div>

          {/* Ver sitio publicado */}
          {estaPublicado && config?.slug && (
            <a
              href={`/sitio/${config.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden lg:inline">Ver sitio</span>
            </a>
          )}

          {/* Publicar - compacto en móvil */}
          <button
            onClick={handlePublicar}
            disabled={publicarSitio.isPending}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-sm ${
              estaPublicado
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {publicarSitio.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : estaPublicado ? (
              <X className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {estaPublicado ? 'Despublicar' : 'Publicar'}
            </span>
          </button>
        </div>
      </header>

      {/* Cuerpo del editor - Envuelto en DndEditorProvider para drag desde paleta */}
      <DndEditorProvider
        onDropFromPalette={handleDropFromPalette}
        onReorder={handleDndReorder}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Panel izquierdo - Navegacion (oculto en móvil) */}
          {showSidebar && (
            <aside className="w-12 md:w-14 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-2 md:py-4 gap-1 md:gap-2 flex-shrink-0">
              <button
                onClick={() => setPanelActivo(PANEL_TYPES.BLOQUES)}
                className={`p-2 md:p-3 rounded-lg transition-colors ${
                  panelActivo === PANEL_TYPES.BLOQUES
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="Bloques"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPanelActivo(PANEL_TYPES.PAGINAS)}
                className={`p-2 md:p-3 rounded-lg transition-colors ${
                  panelActivo === PANEL_TYPES.PAGINAS
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="Páginas"
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPanelActivo(PANEL_TYPES.TEMA)}
                className={`p-2 md:p-3 rounded-lg transition-colors ${
                  panelActivo === PANEL_TYPES.TEMA
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="Tema"
              >
                <Palette className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMostrarTemplates(true)}
                className="p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
                title="Templates"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <div className="flex-1" />
              <button
                onClick={() => navigate('/configuracion')}
                className="p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
                title="Configuración"
              >
                <Settings className="w-5 h-5" />
              </button>
            </aside>
          )}

          {/* Panel secundario - Contenido según panelActivo (solo desktop) */}
          {showSecondaryPanel && (
            <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
              {panelActivo === PANEL_TYPES.BLOQUES && (
                <BlockPalette
                  tiposBloques={tiposBloques}
                  onAgregarBloque={handleAgregarBloque}
                  disabled={!paginaActiva}
                />
              )}
              {panelActivo === PANEL_TYPES.PAGINAS && (
                <PageManager
                  paginas={paginas}
                  paginaActiva={paginaActiva}
                  onSeleccionar={setPaginaActiva}
                  onCrear={crearPagina.mutateAsync}
                  onActualizar={actualizarPagina.mutateAsync}
                  onEliminar={eliminarPagina.mutateAsync}
                />
              )}
              {panelActivo === PANEL_TYPES.TEMA && (
                <ThemeEditor
                  config={config}
                  onActualizar={(tema) =>
                    actualizarConfig.mutateAsync({
                      id: config.id,
                      data: tema,
                    })
                  }
                />
              )}
            </aside>
          )}

          {/* Area principal */}
          <main className="flex-1 overflow-hidden">
            {modoEditor === 'canvas' ? (
              <EditorCanvas
                bloques={bloques}
                tema={config}
                onReordenar={handleReordenarBloques}
                onActualizarBloque={handleActualizarBloque}
                isLoading={bloquesLoading}
              />
            ) : (
              <div className="h-full overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
                <BlockEditor
                  pagina={paginaActiva}
                  bloques={bloques}
                  bloqueSeleccionado={bloqueSeleccionado}
                  onSeleccionar={seleccionarBloque}
                  onActualizar={handleActualizarBloque}
                  onEliminar={handleEliminarBloque}
                  onDuplicar={handleDuplicarBloque}
                  onReordenar={handleReordenarBloques}
                  isLoading={bloquesLoading}
                  tema={config}
                  industria={config?.industria || 'default'}
                />
              </div>
            )}
          </main>

          {/* Panel derecho - Propiedades (solo desktop, en modo canvas con bloque seleccionado) */}
          {showPropertiesPanel && modoEditor === 'canvas' && bloqueSeleccionado && (
            <aside className="w-80 flex-shrink-0">
              <PropertiesPanel
                bloque={bloqueSeleccionadoCompleto}
                onUpdate={(contenido) =>
                  handleActualizarBloque(bloqueSeleccionado, contenido)
                }
                onDuplicate={handleDuplicarBloque}
                onDelete={handleEliminarBloque}
                onClose={cerrarPropiedades}
                isLoading={estaGuardando}
              />
            </aside>
          )}
        </div>
      </DndEditorProvider>

      {/* ========== MOBILE DRAWERS ========== */}

      {/* Drawer: Bloques (móvil) */}
      <Drawer
        isOpen={drawerAbierto === PANEL_TYPES.BLOQUES}
        onClose={closeDrawer}
        title="Agregar bloque"
        subtitle="Toca para agregar al final de la página"
        size="lg"
      >
        <BlockPalette
          tiposBloques={tiposBloques}
          onAgregarBloque={(tipo) => {
            handleAgregarBloque(tipo);
            closeDrawer();
          }}
          disabled={!paginaActiva}
          isInDrawer
        />
      </Drawer>

      {/* Drawer: Páginas (móvil) */}
      <Drawer
        isOpen={drawerAbierto === PANEL_TYPES.PAGINAS}
        onClose={closeDrawer}
        title="Páginas"
        subtitle="Gestiona las páginas de tu sitio"
        size="lg"
      >
        <PageManager
          paginas={paginas}
          paginaActiva={paginaActiva}
          onSeleccionar={(pagina) => {
            setPaginaActiva(pagina);
            closeDrawer();
          }}
          onCrear={crearPagina.mutateAsync}
          onActualizar={actualizarPagina.mutateAsync}
          onEliminar={eliminarPagina.mutateAsync}
        />
      </Drawer>

      {/* Drawer: Tema (móvil) */}
      <Drawer
        isOpen={drawerAbierto === PANEL_TYPES.TEMA}
        onClose={closeDrawer}
        title="Tema"
        subtitle="Personaliza colores y fuentes"
        size="lg"
      >
        <ThemeEditor
          config={config}
          onActualizar={(tema) =>
            actualizarConfig.mutateAsync({
              id: config.id,
              data: tema,
            })
          }
        />
      </Drawer>

      {/* Drawer: Propiedades (móvil y tablet) */}
      <Drawer
        isOpen={propertiesAsDrawer && drawerAbierto === PANEL_TYPES.PROPIEDADES && bloqueSeleccionado}
        onClose={closeDrawer}
        title={`Propiedades: ${bloqueSeleccionadoCompleto?.tipo || 'Bloque'}`}
        subtitle={estaGuardando ? 'Guardando...' : 'Edita las propiedades del bloque'}
        size="lg"
        showCloseButton
      >
        <PropertiesPanel
          bloque={bloqueSeleccionadoCompleto}
          onUpdate={(contenido) =>
            handleActualizarBloque(bloqueSeleccionado, contenido)
          }
          onDuplicate={(id) => {
            handleDuplicarBloque(id);
            closeDrawer();
          }}
          onDelete={(id) => {
            handleEliminarBloque(id);
            closeDrawer();
          }}
          onClose={closeDrawer}
          isLoading={estaGuardando}
          isInDrawer
        />
      </Drawer>

      {/* FAB móvil para acceder a paneles */}
      {isMobile && (
        <MobileEditorFAB
          onOpenPanel={openPanel}
          onOpenTemplates={() => setMostrarTemplates(true)}
          disabledBloques={!paginaActiva}
          disabledTemplates={!tieneSitio}
        />
      )}

      {/* Template Gallery Modal */}
      <TemplateGallery
        isOpen={mostrarTemplates}
        onClose={() => setMostrarTemplates(false)}
        onTemplateApplied={() => {
          setMostrarTemplates(false);
        }}
      />

      {/* Slash Menu */}
      <SlashMenu
        isOpen={slashMenu.isOpen}
        position={slashMenu.position}
        query={slashMenu.query}
        onSelect={handleSlashSelect}
        onClose={handleSlashClose}
      />
    </div>
  );
}

// ========== MODAL CREAR SITIO ==========

function CrearSitioModal({ onCrear, onCancelar, isLoading }) {
  const [form, setForm] = useState({
    nombre_sitio: '',
    slug: '',
    descripcion: '',
  });
  const [slugManual, setSlugManual] = useState(false);

  // Auto-generar slug desde nombre
  useEffect(() => {
    if (!slugManual && form.nombre_sitio) {
      const slug = form.nombre_sitio
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      setForm((prev) => ({ ...prev, slug }));
    }
  }, [form.nombre_sitio, slugManual]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre_sitio.trim() || !form.slug.trim()) {
      toast.error('Nombre y URL son requeridos');
      return;
    }
    onCrear(form);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Crear tu sitio web
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configura los datos básicos de tu sitio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del sitio *
            </label>
            <input
              type="text"
              value={form.nombre_sitio}
              onChange={(e) =>
                setForm({ ...form, nombre_sitio: e.target.value })
              }
              placeholder="Mi Negocio"
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL del sitio *
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 text-sm">
                nexo.com/sitio/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setForm({
                    ...form,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  });
                }}
                placeholder="mi-negocio"
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Solo letras, números y guiones
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Breve descripción de tu negocio..."
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear sitio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WebsiteEditorPage;
