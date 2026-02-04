/**
 * ====================================================================
 * INVITACION EDITOR PAGE
 * ====================================================================
 * Página principal del editor visual de invitaciones digitales.
 *
 * @version 1.1.0 - Agregado layout responsive
 * @since 2026-02-03
 */

import { memo } from 'react';
import { Loader2, AlertCircle, ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

// Context
import { InvitacionEditorProvider, useInvitacionEditor } from './context';

// Containers
import {
  EditorHeader,
  SidebarContainer,
  CanvasContainer,
  PropertiesContainer,
  DrawersContainer,
} from './containers';

// Framework compartido
import {
  DndEditorProvider,
  EditorLayoutProvider,
  EditorFAB,
} from '@/components/editor-framework';

// Config
import { BLOCK_ICONS, BLOCK_NAMES, BLOCK_DESCRIPTIONS } from './config';

// ========== FAB CONFIG ==========

const FAB_OPTIONS = [
  {
    id: 'bloques',
    label: 'Bloques',
    icon: Plus,
    color: 'bg-primary-500',
  },
];

// ========== MAIN COMPONENT ==========

/**
 * InvitacionEditorPage - Componente principal del editor
 */
function InvitacionEditorPage() {
  return (
    <EditorLayoutProvider panels={['bloques', 'propiedades']}>
      <InvitacionEditorProvider>
        <InvitacionEditorContent />
      </InvitacionEditorProvider>
    </EditorLayoutProvider>
  );
}

/**
 * InvitacionEditorContent - Contenido interno que usa el context
 */
function InvitacionEditorContent() {
  const {
    evento,
    isLoading,
    error,
    handleDropFromPalette,
    handleDndReorder,
  } = useInvitacionEditor();

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

  // ========== RENDER: ERROR ==========
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar el editor
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || 'No se pudo cargar la información del evento.'}
          </p>
          <Link
            to="/eventos-digitales"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a eventos
          </Link>
        </div>
      </div>
    );
  }

  // ========== RENDER: EVENTO NO ENCONTRADO ==========
  if (!evento) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Evento no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            El evento que intentas editar no existe o no tienes acceso.
          </p>
          <Link
            to="/eventos-digitales"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a eventos
          </Link>
        </div>
      </div>
    );
  }

  // Tema para DndEditorProvider
  const tema = {
    color_primario: evento?.plantilla?.color_primario || '#753572',
  };

  // ========== RENDER: EDITOR PRINCIPAL ==========
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <EditorHeader />

      {/* Cuerpo del editor */}
      <DndEditorProvider
        onDropFromPalette={handleDropFromPalette}
        onReorder={handleDndReorder}
        tema={tema}
        blockIcons={BLOCK_ICONS}
        blockNames={BLOCK_NAMES}
        blockDescriptions={BLOCK_DESCRIPTIONS}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar con paleta de bloques */}
          <SidebarContainer />

          {/* Canvas central */}
          <CanvasContainer />

          {/* Panel de propiedades (desktop) */}
          <PropertiesContainer />
        </div>

        {/* Drawers (móvil/tablet) - dentro de DndProvider para drag */}
        <DrawersContainer />
      </DndEditorProvider>

      {/* FAB (móvil) */}
      <EditorFAB options={FAB_OPTIONS} />
    </div>
  );
}

export default memo(InvitacionEditorPage);
