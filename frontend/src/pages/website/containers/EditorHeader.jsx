/**
 * ====================================================================
 * EDITOR HEADER
 * ====================================================================
 * Header del editor con controles de publicación y modo.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import {
  Globe2,
  Layout,
  FileText,
  ExternalLink,
  Check,
  X,
  Loader2,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useEditor } from '../context';
import { BackButton } from '@/components/ui';
import { useUndo, useRedo, useCanUndoRedo } from '@/store';

/**
 * EditorHeader - Cabecera del editor
 */
function EditorHeader() {
  const {
    // Estado
    config,
    estaPublicado,
    modoEditor,
    setModoEditor,

    // Layout
    isMobile,

    // Handlers
    handlePublicar,

    // Mutations
    publicarSitio,
  } = useEditor();

  // Undo/Redo
  const undo = useUndo();
  const redo = useRedo();
  const { canUndo, canRedo } = useCanUndoRedo();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 h-12 sm:h-14 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* BackButton */}
        <BackButton to="/home" label={isMobile ? '' : 'Volver'} />
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate max-w-[80px] sm:max-w-[150px] md:max-w-none">
            {config?.nombre_sitio || 'Mi Sitio'}
          </span>
        </div>
        {/* Status badge */}
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
        {/* Undo/Redo Buttons */}
        <div className="hidden sm:flex items-center gap-1 mr-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Shift+Z)"
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Mode Toggle */}
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

        {/* Publicar */}
        <button
          onClick={handlePublicar}
          disabled={publicarSitio.isPending}
          data-tour="publish-button"
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
  );
}

export default memo(EditorHeader);
