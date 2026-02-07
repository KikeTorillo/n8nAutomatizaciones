/**
 * ====================================================================
 * DRAWERS CONTAINER
 * ====================================================================
 * Container para todos los drawers móviles del editor.
 *
 * @version 1.1.0 - Migrado a BlockPalette centralizado
 * @since 2026-02-03
 */

import { memo, useMemo } from 'react';
import { useWebsiteEditorContext } from '../context';
import { Drawer } from '@/components/ui';
import { BlockPalette, ThemeEditorPanel, useThemeSave } from '@/components/editor-framework';
import PageManager from '../components/PageManager';
import PropertiesPanel from '../components/PropertiesPanel';
import {
  CATEGORIAS_WEBSITE,
  normalizarBloques,
} from '../config/blockConfig';
import {
  TEMAS_PREDEFINIDOS,
  COLOR_FIELDS,
  FONT_FIELDS,
  extractWebsiteColors,
  extractWebsiteFonts,
  buildWebsiteThemePayload,
} from '../config/themeConfig';

/**
 * DrawersContainer - Drawers móviles para el editor
 */
function DrawersContainer() {
  const {
    // Layout
    drawerAbierto,
    propertiesAsDrawer,
    closeDrawer,
    PANEL_TYPES,

    // Datos
    paginas,
    paginaActiva,
    setPaginaActiva,
    tiposBloques,
    config,
    bloqueSeleccionado,
    bloqueSeleccionadoCompleto,
    bloques,
    estaGuardando,

    // Handlers
    handleAgregarBloque,
    handleActualizarBloque,
    handleDuplicarBloque,
    handleEliminarBloque,

    // Mutations
    crearPagina,
    actualizarPagina,
    eliminarPagina,
    actualizarConfig,

    // Store actions
    deseleccionarBloque,
  } = useWebsiteEditorContext();

  // Normalizar bloques para BlockPalette
  const bloquesNormalizados = useMemo(
    () => normalizarBloques(tiposBloques),
    [tiposBloques]
  );

  // Colores, fuentes y guardado de tema (centralizado)
  const { currentColors, currentFonts, handleSaveTema } = useThemeSave({
    source: config,
    extractColors: extractWebsiteColors,
    extractFonts: extractWebsiteFonts,
    buildPayload: buildWebsiteThemePayload(config),
    saveMutation: (payload) => actualizarConfig.mutateAsync(payload),
  });

  return (
    <>
      {/* Drawer: Bloques */}
      <Drawer
        isOpen={drawerAbierto === PANEL_TYPES.BLOQUES}
        onClose={closeDrawer}
        title="Agregar bloque"
        subtitle="Toca para agregar al final de la página"
        size="lg"
      >
        <BlockPalette
          bloques={bloquesNormalizados}
          categorias={CATEGORIAS_WEBSITE}
          onAgregarBloque={(tipo) => {
            handleAgregarBloque(tipo);
            closeDrawer();
          }}
          disabled={!paginaActiva}
          variant="grid"
          isInDrawer
          colorConfig={{ mode: 'uniform' }}
          showHeader={false}
          draggablePrefix="drawer-palette"
        />
      </Drawer>

      {/* Drawer: Páginas */}
      <Drawer
        isOpen={drawerAbierto === PANEL_TYPES.PAGINAS}
        onClose={closeDrawer}
        title="Páginas"
        subtitle="Gestiona las páginas de tu sitio"
        size="lg"
      >
        <PageManager
          paginas={paginas}
          paginaActiva={paginaActiva}
          onSeleccionar={(pagina) => {
            setPaginaActiva(pagina);
            closeDrawer();
          }}
          onCrear={crearPagina.mutateAsync}
          onActualizar={actualizarPagina.mutateAsync}
          onEliminar={eliminarPagina.mutateAsync}
        />
      </Drawer>

      {/* Drawer: Tema */}
      <Drawer
        isOpen={drawerAbierto === PANEL_TYPES.TEMA}
        onClose={closeDrawer}
        title="Tema"
        subtitle="Personaliza colores y fuentes"
        size="lg"
      >
        <ThemeEditorPanel
          colorFields={COLOR_FIELDS}
          currentColors={currentColors}
          fontFields={FONT_FIELDS}
          currentFonts={currentFonts}
          presetThemes={TEMAS_PREDEFINIDOS}
          onSave={handleSaveTema}
        />
      </Drawer>

      {/* Drawer: Propiedades (móvil y tablet) */}
      <Drawer
        isOpen={!!(propertiesAsDrawer && drawerAbierto === PANEL_TYPES.PROPIEDADES && bloqueSeleccionado)}
        onClose={() => {
          closeDrawer();
          deseleccionarBloque();
        }}
        title={`Propiedades: ${bloqueSeleccionadoCompleto?.tipo || 'Bloque'}`}
        subtitle={estaGuardando ? 'Guardando...' : 'Edita las propiedades del bloque'}
        size="lg"
        showCloseButton
      >
        <PropertiesPanel
          bloque={bloqueSeleccionadoCompleto}
          onUpdate={(contenido) =>
            handleActualizarBloque(bloqueSeleccionado, contenido)
          }
          onDuplicate={(id) => {
            handleDuplicarBloque(id);
            closeDrawer();
          }}
          onDelete={(id) => {
            handleEliminarBloque(id);
            closeDrawer();
          }}
          onClose={() => {
            closeDrawer();
            deseleccionarBloque();
          }}
          isLoading={estaGuardando}
          isInDrawer
          config={config}
          pagina={paginaActiva}
          bloques={bloques}
        />
      </Drawer>
    </>
  );
}

export default memo(DrawersContainer);
