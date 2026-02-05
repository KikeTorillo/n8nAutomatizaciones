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
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  useEditorLayoutContext,
  BlockPalette,
  ElementsPalette,
  ThemeEditorPanel,
  TemplateGalleryPanel,
  INVITACION_ALLOWED_TYPES,
} from '@/components/editor-framework';
import { BLOQUES_INVITACION, CATEGORIAS_BLOQUES, TEMAS_POR_TIPO, COLOR_FIELDS } from '../config';
import { useInvitacionEditor } from '../context';
import { usePlantillas } from '@/hooks/otros/eventos-digitales';
import InvitacionTemplateGallery from '../components/InvitacionTemplateGallery';

const TIPOS_EVENTO_CATEGORIES = [
  { key: 'boda', label: 'Boda' },
  { key: 'xv_anos', label: 'XV Años' },
  { key: 'bautizo', label: 'Bautizo' },
  { key: 'cumpleanos', label: 'Cumpleaños' },
  { key: 'corporativo', label: 'Corporativo' },
  { key: 'otro', label: 'Otro' },
];

const PANEL_TYPES = {
  BLOQUES: 'bloques',
  TEMA: 'tema',
  PLANTILLAS: 'plantillas',
};

/**
 * SidebarContainer - Sidebar con navegación y panel de contenido
 */
function SidebarContainer() {
  const navigate = useNavigate();
  const {
    modoPreview,
    modoEditor,
    handleAgregarBloque,
    evento,
    handleActualizarPlantilla,
    estaActualizandoPlantilla,
    getFreePositionStore,
  } = useInvitacionEditor();
  const { showSidebar, showSecondaryPanel } = useEditorLayoutContext();

  // Panel activo local
  const [panelActivo, setPanelActivo] = useState(PANEL_TYPES.BLOQUES);
  const [mostrarGaleria, setMostrarGaleria] = useState(false);

  // Plantillas
  const { data: plantillas = [], isLoading: plantillasLoading } = usePlantillas();

  // Temas según tipo de evento
  const tipoEvento = evento?.tipo || 'otro';
  const temasDisponibles = TEMAS_POR_TIPO[tipoEvento] || TEMAS_POR_TIPO.otro;

  // Colores actuales
  const currentColors = useMemo(() => ({
    primario: evento?.plantilla?.color_primario || '#753572',
    secundario: evento?.plantilla?.color_secundario || '#F59E0B',
  }), [evento?.plantilla?.color_primario, evento?.plantilla?.color_secundario]);

  // Handler de guardado de tema
  const handleSaveTema = useCallback(async ({ colores }) => {
    await handleActualizarPlantilla({
      ...evento?.plantilla,
      color_primario: colores.primario,
      color_secundario: colores.secundario,
    });
  }, [handleActualizarPlantilla, evento?.plantilla]);

  // Handler para aplicar plantilla
  const handleApplyPlantilla = useCallback((plantilla) => {
    navigate('/eventos-digitales/nuevo', {
      state: {
        plantilla_id: plantilla.id,
        plantillaNombre: plantilla.nombre,
        tema: plantilla.tema,
      },
    });
  }, [navigate]);

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
              presetThemes={temasDisponibles}
              onSave={handleSaveTema}
              isLoading={estaActualizandoPlantilla}
              title="Colores"
              subtitle="Personaliza los colores de tu invitación"
            />
          )}
          {panelActivo === PANEL_TYPES.PLANTILLAS && (
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
