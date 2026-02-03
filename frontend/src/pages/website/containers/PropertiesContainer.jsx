/**
 * ====================================================================
 * PROPERTIES CONTAINER
 * ====================================================================
 * Container para el panel de propiedades.
 * Renderiza como panel lateral (desktop) o drawer (móvil/tablet).
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { useEditor } from '../context';
import PropertiesPanel from '../components/PropertiesPanel';

/**
 * PropertiesContainer - Panel de propiedades del bloque seleccionado
 *
 * En desktop: Panel lateral derecho
 * En móvil/tablet: Se renderiza como Drawer en DrawersContainer
 */
function PropertiesContainer() {
  const {
    // Estado
    modoEditor,
    bloqueSeleccionado,
    bloqueSeleccionadoCompleto,
    estaGuardando,
    paginaActiva,
    bloques,
    config,

    // Layout
    showPropertiesPanel,

    // Handlers
    handleActualizarBloque,
    handleDuplicarBloque,
    handleEliminarBloque,
    cerrarPropiedades,
  } = useEditor();

  // Solo mostrar en modo canvas con bloque seleccionado en desktop
  if (!showPropertiesPanel || modoEditor !== 'canvas' || !bloqueSeleccionado) {
    return null;
  }

  return (
    <aside className="w-80 flex-shrink-0" data-tour="properties-panel">
      <PropertiesPanel
        bloque={bloqueSeleccionadoCompleto}
        onUpdate={(contenido) =>
          handleActualizarBloque(bloqueSeleccionado, contenido)
        }
        onDuplicate={handleDuplicarBloque}
        onDelete={handleEliminarBloque}
        onClose={cerrarPropiedades}
        isLoading={estaGuardando}
        config={config}
        pagina={paginaActiva}
        bloques={bloques}
      />
    </aside>
  );
}

export default memo(PropertiesContainer);
