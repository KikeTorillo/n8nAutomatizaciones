/**
 * ====================================================================
 * DRAWERS CONTAINER
 * ====================================================================
 * Container para todos los drawers móviles del editor.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { useEditor } from '../context';
import { Drawer } from '@/components/ui';
import PageManager from '../components/PageManager';
import BlockPalette from '../components/BlockPalette';
import ThemeEditor from '../components/ThemeEditor';
import PropertiesPanel from '../components/PropertiesPanel';

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
  } = useEditor();

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
          tiposBloques={tiposBloques}
          onAgregarBloque={(tipo) => {
            handleAgregarBloque(tipo);
            closeDrawer();
          }}
          disabled={!paginaActiva}
          isInDrawer
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
        <ThemeEditor
          config={config}
          onActualizar={(tema) =>
            actualizarConfig.mutateAsync({
              id: config.id,
              data: tema,
            })
          }
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
