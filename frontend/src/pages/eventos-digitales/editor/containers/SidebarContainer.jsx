/**
 * ====================================================================
 * SIDEBAR CONTAINER - INVITACIONES
 * ====================================================================
 * Sidebar con barra de navegación vertical y panel secundario.
 * Incluye: Bloques por categorías, Editor de colores, Plantillas (próximamente).
 *
 * @version 2.1.0 - Migrado a BlockPalette centralizado
 * @since 2026-02-03
 */

import { memo, useState, useCallback } from 'react';
import { Plus, Palette, Sparkles, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useEditorLayoutContext,
  BlockPalette,
  ElementsPalette,
  INVITACION_ALLOWED_TYPES,
} from '@/components/editor-framework';
import { BLOQUES_INVITACION, CATEGORIAS_BLOQUES } from '../config';
import { useInvitacionEditor } from '../context';
import InvitacionThemeEditor from '../components/InvitacionThemeEditor';

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
    estaActualizandoPlantilla,
    getFreePositionStore,
  } = useInvitacionEditor();
  const { showSidebar, showSecondaryPanel } = useEditorLayoutContext();

  // Panel activo local (bloques, tema, plantillas)
  const [panelActivo, setPanelActivo] = useState('bloques');

  // Handler para agregar elemento en modo libre
  const handleAgregarElemento = useCallback((nuevoElemento, seccionId) => {
    const store = getFreePositionStore();
    let state = store.getState();

    // Si no hay sección seleccionada, usar la primera o crear una
    let targetSeccionId = seccionId || state.seccionSeleccionada;

    if (!targetSeccionId && state.secciones.length > 0) {
      targetSeccionId = state.secciones[0].id;
    }

    // Si aún no hay sección, crear una vacía primero
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
      // IMPORTANTE: Re-leer el estado después de agregar sección
      state = store.getState();
      targetSeccionId = state.secciones[0]?.id;
    }

    if (targetSeccionId) {
      state.agregarElemento(nuevoElemento, targetSeccionId);
    }
  }, [getFreePositionStore]);

  // Ocultar en modo preview o en móvil
  if (modoPreview || !showSidebar) return null;

  const PANEL_TYPES = {
    BLOQUES: 'bloques',
    TEMA: 'tema',
    PLANTILLAS: 'plantillas',
  };

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
          disabled
          className="p-2 md:p-3 rounded-lg text-gray-300 dark:text-gray-600 cursor-not-allowed"
          title="Plantillas (próximamente)"
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
            <InvitacionThemeEditor
              evento={evento}
              onActualizar={handleActualizarPlantilla}
              isLoading={estaActualizandoPlantilla}
            />
          )}
        </aside>
      )}
    </>
  );
}

export default memo(SidebarContainer);
