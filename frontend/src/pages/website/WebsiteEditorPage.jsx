/**
 * ====================================================================
 * WEBSITE EDITOR PAGE - v3.1 Refactored
 * ====================================================================
 * Editor visual WYSIWYG del sitio web.
 *
 * Arquitectura refactorizada:
 * - WebsiteEditorProvider: Centraliza estado y lógica
 * - Containers: Divididos por responsabilidad
 * - Hooks: Lógica extraída a hooks reutilizables
 * - Components: EmptyState y CrearSitioModal extraídos
 *
 * @version 3.1.0
 * @since 2026-02-03
 */

import { Loader2 } from 'lucide-react';

// Context
import { WebsiteEditorProvider, useWebsiteEditorContext } from './context';

// Containers
import {
  SidebarContainer,
  CanvasContainer,
  PropertiesContainer,
  DrawersContainer,
  EditorModals,
  EditorHeader,
} from './containers';

// Components
import { DndEditorProvider } from '@/components/editor-framework';
import { ICONOS_BLOQUES, NOMBRES_BLOQUES, DESCRIPCIONES_BLOQUES } from './config/blockConfig';
import ConflictAlert from './components/ConflictAlert';
import EmptyState from './components/EmptyState';
import CrearSitioModal from './components/CrearSitioModal';

// UI
import { ModuleGuard } from '@/components/ui';

// ========== MAIN COMPONENT ==========

/**
 * WebsiteEditorPage - Componente principal del editor
 *
 * Envuelve todo con WebsiteEditorProvider para centralizar el estado.
 */
function WebsiteEditorPage() {
  return (
    <WebsiteEditorProvider>
      <WebsiteEditorContent />
    </WebsiteEditorProvider>
  );
}

/**
 * WebsiteEditorContent - Contenido interno que usa el context
 */
function WebsiteEditorContent() {
  const {
    isLoading,
    tieneSitio,
    mostrarCrearSitio,
    setMostrarCrearSitio,
    mostrarTemplates,
    setMostrarTemplates,
    mostrarAIWizard,
    setMostrarAIWizard,
    config,
    handleCrearSitio,
    handleDropFromPalette,
    handleDndReorder,
    crearConfig,
  } = useWebsiteEditorContext();

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
      <EmptyState
        onShowAIWizard={() => setMostrarAIWizard(true)}
        onShowTemplates={() => setMostrarTemplates(true)}
        onShowCreateSite={() => setMostrarCrearSitio(true)}
        mostrarTemplates={mostrarTemplates}
        setMostrarTemplates={setMostrarTemplates}
        mostrarAIWizard={mostrarAIWizard}
        setMostrarAIWizard={setMostrarAIWizard}
      />
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
      {/* Header */}
      <EditorHeader />

      {/* Alerta de conflicto de versión */}
      <ConflictAlert />

      {/* Cuerpo del editor */}
      <DndEditorProvider
        onDropFromPalette={handleDropFromPalette}
        onReorder={handleDndReorder}
        tema={config}
        blockIcons={ICONOS_BLOQUES}
        blockNames={NOMBRES_BLOQUES}
        blockDescriptions={DESCRIPCIONES_BLOQUES}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <SidebarContainer />

          {/* Canvas */}
          <CanvasContainer />

          {/* Properties Panel (desktop) */}
          <PropertiesContainer />
        </div>
      </DndEditorProvider>

      {/* Drawers (móvil) */}
      <DrawersContainer />

      {/* Modales y overlays */}
      <EditorModals />
    </div>
  );
}

// ========== EXPORT WITH GUARD ==========

/**
 * WebsiteEditorPageWithGuard - Wrapper con verificación de módulo
 */
function WebsiteEditorPageWithGuard() {
  return (
    <ModuleGuard requiere="website">
      <WebsiteEditorPage />
    </ModuleGuard>
  );
}

export default WebsiteEditorPageWithGuard;
