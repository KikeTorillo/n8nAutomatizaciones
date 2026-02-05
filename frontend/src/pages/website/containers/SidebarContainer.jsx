/**
 * ====================================================================
 * SIDEBAR CONTAINER
 * ====================================================================
 * Container para el panel lateral izquierdo del editor.
 * Incluye la barra de navegación y el panel secundario.
 *
 * @version 1.2.0 - Migrado a ThemeEditorPanel + TemplateGalleryPanel
 * @since 2026-02-03
 */

import { memo, useMemo, useCallback } from 'react';
import { Plus, FileText, Palette, Sparkles } from 'lucide-react';
import { BlockPalette, ThemeEditorPanel, TemplateGalleryPanel } from '@/components/editor-framework';
import { useEditor } from '../context';
import PageManager from '../components/PageManager';
import {
  CATEGORIAS_WEBSITE,
  normalizarBloques,
} from '../config/blockConfig';
import { TEMAS_PREDEFINIDOS, COLOR_FIELDS, FONT_FIELDS } from '../config/themeConfig';

/**
 * SidebarContainer - Panel lateral izquierdo
 */
function SidebarContainer() {
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

    // Templates
    mostrarTemplates,
    setMostrarTemplates,

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

  // Extraer colores actuales del config
  const currentColors = useMemo(() => ({
    primario: config?.tema?.colores?.primario || '#4F46E5',
    secundario: config?.tema?.colores?.secundario || '#6366F1',
    fondo: config?.tema?.colores?.fondo || '#FFFFFF',
    texto: config?.tema?.colores?.texto || '#1F2937',
  }), [config]);

  const currentFonts = useMemo(() => ({
    fuente_titulos: config?.tema?.fuente_titulos || 'inter',
    fuente_cuerpo: config?.tema?.fuente_cuerpo || 'inter',
  }), [config]);

  // Handler de guardado de tema
  const handleSaveTema = useCallback(async ({ colores, fuentes }) => {
    await actualizarConfig.mutateAsync({
      id: config.id,
      data: {
        version: config.version,
        color_primario: colores.primario,
        color_secundario: colores.secundario,
        color_fondo: colores.fondo,
        color_texto: colores.texto,
        fuente_titulos: fuentes?.fuente_titulos,
        fuente_cuerpo: fuentes?.fuente_cuerpo,
      },
    });
  }, [actualizarConfig, config]);

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
          onClick={() => openPanel(PANEL_TYPES.TEMPLATES)}
          className={`p-2 md:p-3 rounded-lg transition-colors ${
            panelActivo === PANEL_TYPES.TEMPLATES && showSecondaryPanel
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
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
            <ThemeEditorPanel
              colorFields={COLOR_FIELDS}
              currentColors={currentColors}
              fontFields={FONT_FIELDS}
              currentFonts={currentFonts}
              presetThemes={TEMAS_PREDEFINIDOS}
              onSave={handleSaveTema}
              title="Tema"
              subtitle="Personaliza colores y tipografía"
            />
          )}
          {panelActivo === PANEL_TYPES.TEMPLATES && (
            <TemplateGalleryPanel
              templates={[]}
              isLoading={false}
              categories={[]}
              onApply={() => {}}
              onViewFullGallery={() => setMostrarTemplates(true)}
              title="Templates"
              emptyMessage="Usa la galería completa para explorar templates"
            />
          )}
        </aside>
      )}
    </>
  );
}

export default memo(SidebarContainer);
