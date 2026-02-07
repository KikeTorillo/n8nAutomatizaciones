/**
 * ====================================================================
 * EDITOR MODALS
 * ====================================================================
 * Container para todos los modales del editor.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { useWebsiteEditorContext } from '../context';
import WebsiteTemplateGallery from '../components/WebsiteTemplateGallery';
import SlashMenu from '../components/SlashMenu';
import AIWizardModal from '../components/AIWizard/AIWizardModal';
import MobileEditorFAB from '../components/MobileEditorFAB';
import { EditorTour } from '../components/OnboardingTour';

/**
 * EditorModals - Modales y overlays del editor
 */
function EditorModals() {
  const {
    // Estado
    mostrarTemplates,
    setMostrarTemplates,
    mostrarAIWizard,
    setMostrarAIWizard,
    tourReady,
    tieneSitio,
    paginaActiva,

    // Layout
    isMobile,
    openPanel,

    // Slash menu
    slashMenu,
    handleSlashSelect,
    handleSlashClose,
  } = useWebsiteEditorContext();

  return (
    <>
      {/* FAB móvil */}
      {isMobile && (
        <MobileEditorFAB
          onOpenPanel={openPanel}
          onOpenTemplates={() => setMostrarTemplates(true)}
          disabledBloques={!paginaActiva}
          disabledTemplates={!tieneSitio}
        />
      )}

      {/* Template Gallery Modal */}
      <WebsiteTemplateGallery
        isOpen={mostrarTemplates}
        onClose={() => setMostrarTemplates(false)}
        onTemplateApplied={() => {
          setMostrarTemplates(false);
        }}
      />

      {/* AI Wizard Modal (solo para crear sitio inicial) */}
      <AIWizardModal
        isOpen={mostrarAIWizard}
        onClose={() => setMostrarAIWizard(false)}
        onSitioCreado={() => {
          setMostrarAIWizard(false);
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

      {/* Onboarding Tour */}
      <EditorTour
        isReady={tourReady}
        isMobile={isMobile}
        onComplete={() => console.log('[EditorTour] Completado')}
        onSkip={() => console.log('[EditorTour] Saltado')}
      />
    </>
  );
}

export default memo(EditorModals);
