/**
 * ====================================================================
 * SIDEBAR CONTAINER - INVITACIONES
 * ====================================================================
 * Sidebar con barra de navegación vertical y panel secundario.
 * Incluye: Bloques/Elementos, Editor de colores, Plantillas.
 *
 * @version 2.3.0 - Migrado a ThemeEditorPanel + TemplateGalleryPanel + TemplateGalleryModal
 * @since 2026-02-03
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { Plus, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useEditorLayoutContext,
  BlockPalette,
  ElementsPalette,
  ThemeEditorPanel,
  TemplateGalleryPanel,
  useThemeSave,
} from '@/components/editor-framework';
import { INVITACION_ALLOWED_TYPES } from '../elements';
import {
  BLOQUES_INVITACION,
  CATEGORIAS_BLOQUES,
  TEMAS_POR_TIPO,
  COLOR_FIELDS,
  FONT_FIELDS,
  extractInvitacionColors,
  extractInvitacionFonts,
  buildInvitacionThemePayload,
} from '../config';
import DecorationEditorSection from '../components/DecorationEditorSection';
import { useEditor as useInvitacionEditor } from '@/components/editor-framework';
import { usePlantillas } from '@/hooks/otros/eventos-digitales';
import InvitacionTemplateGallery from '../components/InvitacionTemplateGallery';
import { TIPOS_EVENTO_CATEGORIES } from '@/pages/eventos-digitales/constants';

const PANEL_TYPES = {
  BLOQUES: 'bloques',
  TEMA: 'tema',
  PLANTILLAS: 'plantillas',
};

/**
 * SidebarContainer - Sidebar con navegación y panel de contenido
 */
function SidebarContainer() {
  const {
    modoPreview,
    modoEditor,
    handleAgregarBloque,
    evento,
    handleActualizarPlantilla,
    getFreePositionStore,
    esPlantilla,
  } = useInvitacionEditor();
  const { showSidebar, showSecondaryPanel } = useEditorLayoutContext();

  // Panel activo local
  const [panelActivo, setPanelActivo] = useState(PANEL_TYPES.BLOQUES);
  const [mostrarGaleria, setMostrarGaleria] = useState(false);

  // Plantillas
  const { data: plantillasData, isLoading: plantillasLoading } = usePlantillas();
  const plantillas = plantillasData?.plantillas || [];

  // Temas según tipo de evento
  const tipoEvento = evento?.tipo || 'otro';
  const temasDisponibles = TEMAS_POR_TIPO[tipoEvento] || TEMAS_POR_TIPO.otro;

  // Colores, fuentes y guardado de tema (centralizado)
  const { currentColors, currentFonts, handleSaveTema } = useThemeSave({
    source: evento?.plantilla,
    extractColors: extractInvitacionColors,
    extractFonts: extractInvitacionFonts,
    buildPayload: buildInvitacionThemePayload(evento?.plantilla),
    saveMutation: handleActualizarPlantilla,
  });

  // Decoraciones globales (solo animación de entrada)
  const currentDecoration = useMemo(() => ({
    animacion_entrada: evento?.plantilla?.animacion_entrada || 'none',
  }), [evento?.plantilla?.animacion_entrada]);

  // Handler de guardado de decoraciones
  const handleSaveDecoracion = useCallback(async (decoracion) => {
    await handleActualizarPlantilla({
      ...evento?.plantilla,
      ...decoracion,
    });
  }, [handleActualizarPlantilla, evento?.plantilla]);

  // Handler para aplicar plantilla al evento actual
  const handleApplyPlantilla = useCallback(async (plantilla) => {
    await handleActualizarPlantilla({
      ...evento?.plantilla,
      ...plantilla.tema,
    });
  }, [handleActualizarPlantilla, evento?.plantilla]);

  // Handler para agregar elemento en modo libre
  const handleAgregarElemento = useCallback((nuevoElemento, seccionId) => {
    const store = getFreePositionStore();
    let state = store.getState();

    let targetSeccionId = seccionId || state.seccionSeleccionada;

    if (!targetSeccionId && state.secciones.length > 0) {
      targetSeccionId = state.secciones[0].id;
    }

    if (!targetSeccionId) {
      state.agregarSeccion({
        tipo: 'seccion',
        preset: 'contenido',
        config: {
          altura: { valor: 100, unidad: 'vh' },
          padding: { top: 60, bottom: 60 },
          fondo: { tipo: 'color', valor: '#1f2937' },
        },
        elementos: [],
      });
      state = store.getState();
      targetSeccionId = state.secciones[0]?.id;
    }

    if (targetSeccionId) {
      state.agregarElemento(nuevoElemento, targetSeccionId);
    }
  }, [getFreePositionStore]);

  // Ocultar en modo preview o en móvil
  if (modoPreview || !showSidebar) return null;

  return (
    <>
      {/* Barra de navegación vertical */}
      <aside
        className="w-12 md:w-14 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-2 md:py-4 gap-1 md:gap-2 flex-shrink-0"
        data-tour="sidebar-nav"
      >
        <button
          onClick={() => setPanelActivo(PANEL_TYPES.BLOQUES)}
          className={cn(
            'p-2 md:p-3 rounded-lg transition-colors',
            panelActivo === PANEL_TYPES.BLOQUES
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          )}
          title="Bloques"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => setPanelActivo(PANEL_TYPES.TEMA)}
          className={cn(
            'p-2 md:p-3 rounded-lg transition-colors',
            panelActivo === PANEL_TYPES.TEMA
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          )}
          title="Colores"
        >
          <Palette className="w-5 h-5" />
        </button>
        {!esPlantilla && (
          <button
            onClick={() => setPanelActivo(PANEL_TYPES.PLANTILLAS)}
            className={cn(
              'p-2 md:p-3 rounded-lg transition-colors',
              panelActivo === PANEL_TYPES.PLANTILLAS
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}
            title="Plantillas"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}
      </aside>

      {/* Panel secundario - Contenido según panelActivo */}
      {showSecondaryPanel && (
        <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col flex-shrink-0">
          {panelActivo === PANEL_TYPES.BLOQUES && (
            modoEditor === 'libre' ? (
              <ElementsPalette
                availableTypes={INVITACION_ALLOWED_TYPES}
                onAddElement={handleAgregarElemento}
                sectionId={getFreePositionStore()?.getState?.()?.seccionSeleccionada}
                title="Elementos"
                showQuickAdd={true}
              />
            ) : (
              <BlockPalette
                bloques={BLOQUES_INVITACION}
                categorias={CATEGORIAS_BLOQUES}
                onAgregarBloque={handleAgregarBloque}
                variant="grid"
                colorConfig={{ mode: 'uniform' }}
                headerTitle="Bloques"
                headerSubtitle="Arrastra o haz clic para agregar"
              />
            )
          )}
          {panelActivo === PANEL_TYPES.TEMA && (
            <ThemeEditorPanel
              colorFields={COLOR_FIELDS}
              currentColors={currentColors}
              fontFields={FONT_FIELDS}
              currentFonts={currentFonts}
              presetThemes={temasDisponibles}
              onSave={handleSaveTema}
              title="Colores y Tipografía"
              subtitle="Personaliza colores, fuentes y decoraciones"
            >
              <DecorationEditorSection
                currentDecoration={currentDecoration}
                onSave={handleSaveDecoracion}
              />
            </ThemeEditorPanel>
          )}
          {panelActivo === PANEL_TYPES.PLANTILLAS && !esPlantilla && (
            <TemplateGalleryPanel
              templates={plantillas}
              isLoading={plantillasLoading}
              categories={TIPOS_EVENTO_CATEGORIES}
              categoryField="tipo_evento"
              onApply={handleApplyPlantilla}
              onViewFullGallery={() => setMostrarGaleria(true)}
              title="Plantillas"
              emptyMessage="No hay plantillas disponibles"
            />
          )}
        </aside>
      )}

      {/* Modal galería completa de plantillas */}
      <InvitacionTemplateGallery
        isOpen={mostrarGaleria}
        onClose={() => setMostrarGaleria(false)}
      />
    </>
  );
}

export default memo(SidebarContainer);
