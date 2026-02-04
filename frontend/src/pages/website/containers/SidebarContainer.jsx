/**
 * ====================================================================
 * SIDEBAR CONTAINER
 * ====================================================================
 * Container para el panel lateral izquierdo del editor.
 * Incluye la barra de navegación y el panel secundario.
 *
 * @version 1.1.0 - Migrado a BlockPalette centralizado
 * @since 2026-02-03
 */

import { memo, useMemo } from 'react';
import { Plus, FileText, Palette, Sparkles } from 'lucide-react';
import { BlockPalette } from '@/components/editor-framework';
import { useEditor } from '../context';
import PageManager from '../components/PageManager';
import ThemeEditor from '../components/ThemeEditor';
import {
  CATEGORIAS_WEBSITE,
  normalizarBloques,
} from '../config/blockConfig';

/**
 * SidebarContainer - Panel lateral izquierdo
 *
 * Renderiza:
 * - Barra de navegación vertical con iconos
 * - Panel secundario con contenido según panelActivo
 */
function SidebarContainer({ onOpenTemplates }) {
  const {
    // Layout
    showSidebar,
    showSecondaryPanel,
    panelActivo,
    openPanel,
    PANEL_TYPES,

    // Datos
    paginas,
    paginaActiva,
    setPaginaActiva,
    tiposBloques,
    config,

    // Handlers
    handleAgregarBloque,

    // Mutations
    crearPagina,
    actualizarPagina,
    eliminarPagina,
    actualizarConfig,
  } = useEditor();

  // Normalizar bloques para BlockPalette
  const bloquesNormalizados = useMemo(
    () => normalizarBloques(tiposBloques),
    [tiposBloques]
  );

  if (!showSidebar) {
    return null;
  }

  return (
    <>
      {/* Barra de navegación vertical */}
      <aside
        className="w-12 md:w-14 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-2 md:py-4 gap-1 md:gap-2 flex-shrink-0"
        data-tour="block-palette"
      >
        <button
          onClick={() => openPanel(PANEL_TYPES.BLOQUES)}
          className={`p-2 md:p-3 rounded-lg transition-colors ${
            panelActivo === PANEL_TYPES.BLOQUES && showSecondaryPanel
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Bloques"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => openPanel(PANEL_TYPES.PAGINAS)}
          className={`p-2 md:p-3 rounded-lg transition-colors ${
            panelActivo === PANEL_TYPES.PAGINAS && showSecondaryPanel
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Páginas"
        >
          <FileText className="w-5 h-5" />
        </button>
        <button
          onClick={() => openPanel(PANEL_TYPES.TEMA)}
          className={`p-2 md:p-3 rounded-lg transition-colors ${
            panelActivo === PANEL_TYPES.TEMA && showSecondaryPanel
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Tema"
        >
          <Palette className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenTemplates}
          className="p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
          title="Templates"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </aside>

      {/* Panel secundario - Contenido según panelActivo */}
      {showSecondaryPanel && (
        <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
          {panelActivo === PANEL_TYPES.BLOQUES && (
            <BlockPalette
              bloques={bloquesNormalizados}
              categorias={CATEGORIAS_WEBSITE}
              onAgregarBloque={handleAgregarBloque}
              disabled={!paginaActiva}
              variant="grid"
              colorConfig={{ mode: 'uniform' }}
            />
          )}
          {panelActivo === PANEL_TYPES.PAGINAS && (
            <PageManager
              paginas={paginas}
              paginaActiva={paginaActiva}
              onSeleccionar={setPaginaActiva}
              onCrear={crearPagina.mutateAsync}
              onActualizar={actualizarPagina.mutateAsync}
              onEliminar={eliminarPagina.mutateAsync}
            />
          )}
          {panelActivo === PANEL_TYPES.TEMA && (
            <ThemeEditor
              config={config}
              onActualizar={(tema) =>
                actualizarConfig.mutateAsync({
                  id: config.id,
                  data: {
                    version: config.version,
                    color_primario: tema.colores.primario,
                    color_secundario: tema.colores.secundario,
                    color_fondo: tema.colores.fondo,
                    color_texto: tema.colores.texto,
                    fuente_titulos: tema.fuente_titulos,
                    fuente_cuerpo: tema.fuente_cuerpo,
                  },
                })
              }
            />
          )}
        </aside>
      )}
    </>
  );
}

export default memo(SidebarContainer);
