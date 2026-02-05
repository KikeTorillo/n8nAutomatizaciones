/**
 * ====================================================================
 * EDITOR TOOLBAR - Framework Component
 * ====================================================================
 * Barra de herramientas reutilizable para editores de bloques.
 * Contiene controles de edición: undo/redo, modos, breakpoints, zoom, etc.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import {
  Undo2,
  Redo2,
  Layout,
  List,
  Move,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BreakpointSelector from './BreakpointSelector';

// ========== CONSTANTS ==========

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

// ========== SAVE STATUS COMPONENT ==========

/**
 * SaveStatus - Indicador de estado de guardado
 */
const SaveStatus = memo(function SaveStatus({ status }) {
  const configs = {
    idle: null,
    saving: {
      icon: Loader2,
      text: 'Guardando...',
      color: 'text-gray-500 dark:text-gray-400',
      spin: true,
    },
    saved: {
      icon: Check,
      text: 'Guardado',
      color: 'text-green-600 dark:text-green-400',
    },
    unsaved: {
      text: 'Sin guardar',
      color: 'text-amber-600 dark:text-amber-400',
      dot: true,
    },
    error: {
      icon: X,
      text: 'Error',
      color: 'text-red-600 dark:text-red-400',
    },
  };

  const config = configs[status];
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <span className={cn('flex items-center gap-1.5 text-xs', config.color)}>
      {config.spin && <Loader2 className="w-3 h-3 animate-spin" />}
      {config.dot && <span className="w-1.5 h-1.5 bg-current rounded-full" />}
      {IconComponent && !config.spin && <IconComponent className="w-3 h-3" />}
      <span className="hidden sm:inline">{config.text}</span>
    </span>
  );
});

// ========== DIVIDER COMPONENT ==========

const Divider = memo(function Divider() {
  return <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />;
});

// ========== UNDO/REDO BUTTONS ==========

const UndoRedoButtons = memo(function UndoRedoButtons({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Deshacer (Ctrl+Z)"
        className={cn(
          'p-2 rounded-lg transition-colors',
          canUndo
            ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        )}
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Rehacer (Ctrl+Shift+Z)"
        className={cn(
          'p-2 rounded-lg transition-colors',
          canRedo
            ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        )}
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
});

// ========== EDITOR MODE TOGGLE ==========

const EditorModeToggle = memo(function EditorModeToggle({
  editorMode,
  onEditorModeChange,
  showFreeMode = false,
  isFreeModeOnly = false,
  onFreeModeExit,
}) {
  // Handler para cambiar a canvas/blocks cuando estamos en modo libre guardado
  const handleModeChange = (targetMode) => {
    if (isFreeModeOnly && targetMode !== 'free') {
      // Pedir confirmación antes de salir del modo libre
      onFreeModeExit?.(targetMode);
    } else {
      onEditorModeChange(targetMode);
    }
  };

  return (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        type="button"
        onClick={() => handleModeChange('canvas')}
        className={cn(
          'flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-sm transition-colors',
          editorMode === 'canvas'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400'
        )}
        title={isFreeModeOnly ? 'Cambiar a vista visual (se perderá el posicionamiento libre)' : 'Vista visual de bloques'}
      >
        <Layout className="w-4 h-4" />
        <span className="hidden lg:inline">Visual</span>
      </button>
      <button
        type="button"
        onClick={() => handleModeChange('blocks')}
        className={cn(
          'flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-sm transition-colors',
          editorMode === 'blocks'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400'
        )}
        title={isFreeModeOnly ? 'Cambiar a lista de bloques (se perderá el posicionamiento libre)' : 'Lista de bloques'}
      >
        <List className="w-4 h-4" />
        <span className="hidden lg:inline">Bloques</span>
      </button>
      {showFreeMode && (
        <button
          type="button"
          onClick={() => handleModeChange('free')}
          className={cn(
            'flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-sm transition-colors',
            editorMode === 'free'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          )}
          title="Posición libre (estilo Wix)"
        >
          <Move className="w-4 h-4" />
          <span className="hidden lg:inline">Libre</span>
        </button>
      )}
    </div>
  );
});

// ========== ZOOM CONTROLS ==========

const ZoomControls = memo(function ZoomControls({ zoom, onZoomChange }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onZoomChange(Math.max(50, zoom - 25))}
        disabled={zoom <= 50}
        className={cn(
          'hidden sm:block p-2 rounded-lg transition-colors',
          zoom > 50
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        )}
        title="Alejar"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <select
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="px-1 sm:px-2 py-1 text-xs sm:text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {ZOOM_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}%
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onZoomChange(Math.min(200, zoom + 25))}
        disabled={zoom >= 200}
        className={cn(
          'hidden sm:block p-2 rounded-lg transition-colors',
          zoom < 200
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        )}
        title="Acercar"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  );
});

// ========== PREVIEW TOGGLE ==========

const PreviewToggle = memo(function PreviewToggle({
  previewMode,
  onPreviewModeChange,
}) {
  return (
    <button
      type="button"
      onClick={() => onPreviewModeChange(!previewMode)}
      className={cn(
        'flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm transition-colors',
        previewMode
          ? 'bg-primary-600 text-white'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
    >
      {previewMode ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
      <span className="hidden md:inline">
        {previewMode ? 'Editar' : 'Preview'}
      </span>
    </button>
  );
});

// ========== MAIN COMPONENT ==========

/**
 * EditorToolbar - Barra de herramientas reutilizable para editores
 *
 * @param {Object} props
 * @param {Function} props.onUndo - Callback para deshacer
 * @param {Function} props.onRedo - Callback para rehacer
 * @param {boolean} props.canUndo - Si puede deshacer
 * @param {boolean} props.canRedo - Si puede rehacer
 * @param {'canvas'|'blocks'} props.editorMode - Modo de editor actual
 * @param {Function} props.onEditorModeChange - Callback para cambiar modo
 * @param {boolean} props.showEditorModeToggle - Mostrar toggle de modo
 * @param {'desktop'|'tablet'|'mobile'} props.breakpoint - Breakpoint actual
 * @param {Function} props.onBreakpointChange - Callback para cambiar breakpoint
 * @param {boolean} props.showBreakpoints - Mostrar selector de breakpoints
 * @param {number} props.zoom - Nivel de zoom (50-200)
 * @param {Function} props.onZoomChange - Callback para cambiar zoom
 * @param {boolean} props.showZoom - Mostrar controles de zoom
 * @param {'idle'|'saving'|'saved'|'unsaved'|'error'} props.saveStatus - Estado de guardado
 * @param {boolean} props.previewMode - Modo preview activo
 * @param {Function} props.onPreviewModeChange - Callback para toggle preview
 * @param {boolean} props.showPreviewToggle - Mostrar toggle de preview
 * @param {boolean} props.isMobile - Si estamos en vista móvil
 * @param {string} props.className - Clases adicionales
 */
function EditorToolbar({
  // Undo/Redo
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,

  // Modos de editor
  editorMode = 'canvas',
  onEditorModeChange,
  showEditorModeToggle = true,
  showFreeMode = false,
  isFreeModeOnly = false,
  onFreeModeExit,

  // Breakpoints
  breakpoint = 'desktop',
  onBreakpointChange,
  showBreakpoints = true,

  // Zoom
  zoom = 100,
  onZoomChange,
  showZoom = true,

  // Estado de guardado
  saveStatus = 'idle',

  // Preview mode
  previewMode = false,
  onPreviewModeChange,
  showPreviewToggle = false,

  // Custom class
  className,
}) {
  const hasUndoRedo = onUndo || onRedo;
  const hasEditorMode = showEditorModeToggle && onEditorModeChange;
  const hasBreakpoints = showBreakpoints && onBreakpointChange;
  const hasZoom = showZoom && onZoomChange;
  const hasPreview = showPreviewToggle && onPreviewModeChange;

  return (
    <div
      className={cn(
        'h-10 sm:h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        'flex items-center justify-between px-2 sm:px-4 flex-shrink-0',
        className
      )}
    >
      {/* === IZQUIERDA: Undo/Redo + Estado === */}
      <div className="flex items-center gap-1 sm:gap-2">
        {hasUndoRedo && (
          <UndoRedoButtons
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        )}

        {hasUndoRedo && <Divider />}

        <SaveStatus status={saveStatus} />
      </div>

      {/* === CENTRO: Modo Editor + Breakpoints === */}
      <div className="flex items-center gap-2">
        {hasEditorMode && (
          <EditorModeToggle
            editorMode={editorMode}
            onEditorModeChange={onEditorModeChange}
            showFreeMode={showFreeMode}
            isFreeModeOnly={isFreeModeOnly}
            onFreeModeExit={onFreeModeExit}
          />
        )}

        {hasEditorMode && hasBreakpoints && <Divider />}

        {hasBreakpoints && (
          <BreakpointSelector
            value={breakpoint}
            onChange={onBreakpointChange}
          />
        )}
      </div>

      {/* === DERECHA: Preview + Zoom === */}
      <div className="flex items-center gap-1 sm:gap-2">
        {hasPreview && (
          <PreviewToggle
            previewMode={previewMode}
            onPreviewModeChange={onPreviewModeChange}
          />
        )}

        {hasPreview && hasZoom && <Divider />}

        {hasZoom && <ZoomControls zoom={zoom} onZoomChange={onZoomChange} />}
      </div>
    </div>
  );
}

export default memo(EditorToolbar);
