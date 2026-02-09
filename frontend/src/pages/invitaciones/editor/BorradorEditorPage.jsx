/**
 * ====================================================================
 * BORRADOR EDITOR PAGE
 * ====================================================================
 * Página del editor de borradores B2C. Estructura idéntica a
 * InvitacionEditorPage pero con BorradorEditorProvider (localStorage).
 *
 * @since 2026-02-08
 */

import { memo } from 'react';
import { Loader2, Plus, Palette, Sparkles } from 'lucide-react';

// Context
import { BorradorEditorProvider, useBorradorEditor } from './context/BorradorEditorContext';

// Containers del editor de invitaciones (reutilizados)
import {
  EditorHeader,
  SidebarContainer,
  CanvasContainer,
  PropertiesContainer,
  DrawersContainer,
} from '@/pages/eventos-digitales/editor/containers';

// Framework compartido
import {
  DndEditorProvider,
  EditorLayoutProvider,
  EditorFAB,
} from '@/components/editor-framework';

// Config (reutilizada)
import { BLOCK_ICONS, BLOCK_NAMES, BLOCK_DESCRIPTIONS } from '@/pages/eventos-digitales/editor/config';

// Componentes propios
import BorradorBanner from './components/BorradorBanner';
import ConvertirBorradorModal from './components/ConvertirBorradorModal';

// ========== FAB CONFIG ==========

const FAB_OPTIONS = [
  { id: 'bloques', label: 'Bloques', icon: Plus, color: 'bg-primary-500' },
  { id: 'tema', label: 'Colores', icon: Palette, color: 'bg-amber-500' },
  { id: 'plantillas', label: 'Plantillas', icon: Sparkles, color: 'bg-pink-500' },
];

// ========== MAIN COMPONENT ==========

function BorradorEditorPage() {
  return (
    <EditorLayoutProvider panels={['bloques', 'tema', 'propiedades', 'plantillas']} customPanelTypes={{ TEMA: 'tema' }}>
      <BorradorEditorProvider>
        <BorradorEditorContent />
      </BorradorEditorProvider>
    </EditorLayoutProvider>
  );
}

function BorradorEditorContent() {
  const {
    isLoading,
    handleDropFromPalette,
    handleDndReorder,
    evento,
    gateModalAbierto,
    cerrarGateModal,
  } = useBorradorEditor();

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

  const tema = {
    color_primario: evento?.plantilla?.color_primario || '#ec4899',
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Banner borrador */}
      <BorradorBanner />

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
          <SidebarContainer />
          <CanvasContainer />
          <PropertiesContainer />
        </div>
        <DrawersContainer />
      </DndEditorProvider>

      {/* FAB (movil) */}
      <EditorFAB options={FAB_OPTIONS} />

      {/* Modal de conversion */}
      <ConvertirBorradorModal
        isOpen={gateModalAbierto}
        onClose={cerrarGateModal}
      />
    </div>
  );
}

export default memo(BorradorEditorPage);
