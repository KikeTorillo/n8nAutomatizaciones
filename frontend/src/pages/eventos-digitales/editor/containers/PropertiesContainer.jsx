/**
 * ====================================================================
 * PROPERTIES CONTAINER - INVITACIONES
 * ====================================================================
 * Panel de propiedades para editar el bloque seleccionado.
 * Responsive: solo visible en desktop, en móvil/tablet se usa drawer.
 *
 * @version 1.2.0 - Tema centralizado desde context
 * @since 2026-02-03
 * @updated 2026-02-04
 */

import { memo, useMemo } from 'react';
import { X } from 'lucide-react';
import { PropertiesPanel, useEditorLayoutContext } from '@/components/editor-framework';
import { BLOCK_CONFIGS, BLOCK_NAMES } from '../config';
import { EDITORES_BLOQUE } from '../components/blocks';
import { useInvitacionEditor } from '../context';

/**
 * PropertiesContainer - Panel de propiedades (solo desktop)
 */
function PropertiesContainer() {
  const {
    evento,
    bloqueSeleccionadoCompleto,
    modoPreview,
    tema,
    handleActualizarBloque,
  } = useInvitacionEditor();

  const {
    mostrarPropiedades,
    setMostrarPropiedades,
    propertiesAsDrawer,
  } = useEditorLayoutContext();

  // Datos adicionales para editores específicos
  const editorProps = useMemo(
    () => ({
      tema,
      ubicaciones: evento?.ubicaciones || [],
      galeria: evento?.galeria || [],
      mesaRegalos: evento?.mesa_regalos || null,
    }),
    [tema, evento]
  );

  // Obtener editor específico si existe
  const EditorComponent = bloqueSeleccionadoCompleto
    ? EDITORES_BLOQUE[bloqueSeleccionadoCompleto.tipo]
    : null;

  // Handler para cambios (guardado automático)
  const handleChange = (cambios) => {
    if (bloqueSeleccionadoCompleto) {
      handleActualizarBloque(bloqueSeleccionadoCompleto.id, cambios);
    }
  };

  // Ocultar si:
  // - Modo preview
  // - Panel cerrado
  // - No hay bloque seleccionado
  // - En móvil/tablet (se usa drawer en su lugar)
  if (modoPreview || !mostrarPropiedades || !bloqueSeleccionadoCompleto || propertiesAsDrawer) {
    return null;
  }

  return (
    <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {BLOCK_NAMES[bloqueSeleccionadoCompleto.tipo] || 'Propiedades'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Edita las propiedades del bloque
          </p>
        </div>
        <button
          onClick={() => setMostrarPropiedades(false)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {EditorComponent ? (
          <EditorComponent
            contenido={{
              ...bloqueSeleccionadoCompleto.contenido,
              _bloqueId: bloqueSeleccionadoCompleto.id,
            }}
            estilos={bloqueSeleccionadoCompleto.estilos || {}}
            onChange={handleChange}
            {...editorProps}
          />
        ) : (
          <PropertiesPanel
            bloque={bloqueSeleccionadoCompleto}
            onSave={handleChange}
            blockConfigs={BLOCK_CONFIGS}
          />
        )}
      </div>
    </aside>
  );
}

export default memo(PropertiesContainer);
