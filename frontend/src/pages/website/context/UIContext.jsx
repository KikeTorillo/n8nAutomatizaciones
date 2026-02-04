/**
 * ====================================================================
 * UI CONTEXT
 * ====================================================================
 *
 * Contexto para el estado de UI del editor.
 * Extraído de EditorContext para reducir re-renders.
 *
 * Responsabilidades:
 * - modoEditor, setModoEditor
 * - tourReady
 * - slashMenu state y handlers
 * - estaGuardando, guardarAhora (autosave)
 * - keyboard shortcuts
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  useWebsiteEditorStore,
  selectSetBreakpoint,
  selectSetZoom,
  selectBreakpoint,
} from '@/store';
import { useAutosave, useEditorShortcuts } from '../hooks';

// ========== CONTEXT ==========

const UIContext = createContext(null);

// ========== PROVIDER ==========

/**
 * UIProvider - Proveedor del contexto de UI
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 * @param {Object} props.blocksContext - Contexto de bloques
 * @param {Object} props.siteContext - Contexto del sitio
 * @param {Object} props.layoutContext - Contexto de layout
 */
export function UIProvider({ children, blocksContext, siteContext, layoutContext }) {
  // ========== ESTADO LOCAL ==========
  const [modoEditor, setModoEditor] = useState('canvas'); // 'canvas' | 'bloques'
  const [modoPreview, setModoPreview] = useState(false); // Preview mode
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    query: '',
  });
  const [tourReady, setTourReady] = useState(false);

  // ========== STORE STATE ==========
  const breakpoint = useWebsiteEditorStore(selectBreakpoint);
  const setBreakpoint = useWebsiteEditorStore(selectSetBreakpoint);
  const setZoom = useWebsiteEditorStore(selectSetZoom);

  // ========== EXTRAER DATOS DE CONTEXTOS ==========
  const { tieneSitio, paginaActiva } = siteContext;
  const { isMobile } = layoutContext;
  const {
    bloques,
    bloquesLoading,
    handleAgregarBloque,
    actualizarVersionBloque,
  } = blocksContext;

  // Obtener actualizarBloque de siteContext.editorMutations
  const { actualizarBloque } = siteContext.editorMutations;

  // ========== EFFECTS ==========

  // NOTA: El panel de propiedades ahora se abre desde handleBloqueClick en CanvasContainer
  // Esto evita el bug donde el panel no se abría al re-clickear el mismo bloque

  // Auto-ajustar breakpoint y zoom en móvil
  useEffect(() => {
    if (isMobile && tieneSitio) {
      if (breakpoint !== 'mobile') {
        setBreakpoint('mobile');
      }
      setZoom(100);
    }
  }, [isMobile, tieneSitio, breakpoint, setBreakpoint, setZoom]);

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
  });

  // ========== KEYBOARD SHORTCUTS ==========
  useEditorShortcuts({
    onSave: guardarAhora,
    onDuplicate: (id) => {
      if (id) {
        blocksContext.handleDuplicarBloque(id);
      }
    },
    onDelete: (id) => {
      if (id && paginaActiva) {
        blocksContext.handleEliminarBloque(id);
      }
    },
    enabled: true,
  });

  // ========== SLASH MENU HANDLERS ==========

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

  // ========== CONTEXT VALUE ==========

  const value = useMemo(
    () => ({
      // Modo editor
      modoEditor,
      setModoEditor,

      // Preview mode
      modoPreview,
      setModoPreview,

      // Tour
      tourReady,

      // Slash menu
      slashMenu,
      setSlashMenu,
      handleSlashSelect,
      handleSlashClose,

      // Autosave
      estaGuardando,
      guardarAhora,
    }),
    [
      modoEditor,
      modoPreview,
      tourReady,
      slashMenu,
      handleSlashSelect,
      handleSlashClose,
      estaGuardando,
      guardarAhora,
    ]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

// ========== HOOK ==========

/**
 * Hook para acceder al contexto de UI
 * @returns {Object} Contexto de UI
 * @throws {Error} Si se usa fuera de UIProvider
 */
export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI debe usarse dentro de un UIProvider');
  }
  return context;
}

export default UIContext;
