/**
 * ====================================================================
 * DRAWERS CONTAINER - INVITACIONES
 * ====================================================================
 * Container para los drawers móviles del editor de invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
  EditorDrawer,
  PropertiesPanel,
  useEditorLayoutContext,
} from '@/components/editor-framework';
import { useInvitacionEditor } from '../context';
import { BLOQUES_INVITACION, BLOCK_CONFIGS, BLOCK_NAMES } from '../config';
import { EDITORES_BLOQUE } from '../components/blocks';

/**
 * DrawersContainer - Drawers móviles para el editor de invitaciones
 */
function DrawersContainer() {
  const {
    evento,
    bloqueSeleccionadoCompleto,
    handleAgregarBloque,
    handleActualizarBloque,
    deseleccionarBloque,
    modoPreview,
  } = useInvitacionEditor();

  const { closeDrawer } = useEditorLayoutContext();

  // Tema del evento (debe estar antes de cualquier return)
  const tema = useMemo(
    () => ({
      color_primario: evento?.plantilla?.color_primario || '#753572',
      color_secundario: evento?.plantilla?.color_secundario || '#F59E0B',
    }),
    [evento]
  );

  // Props para editores
  const editorProps = useMemo(
    () => ({
      tema,
      ubicaciones: evento?.ubicaciones || [],
      galeria: evento?.galeria || [],
      mesaRegalos: evento?.mesa_regalos || null,
    }),
    [tema, evento]
  );

  // Editor específico
  const EditorComponent = bloqueSeleccionadoCompleto
    ? EDITORES_BLOQUE[bloqueSeleccionadoCompleto.tipo]
    : null;

  // Handler de cambios
  const handleChange = (cambios) => {
    if (bloqueSeleccionadoCompleto) {
      handleActualizarBloque(bloqueSeleccionadoCompleto.id, cambios);
    }
  };

  // Ocultar en modo preview
  if (modoPreview) return null;

  return (
    <>
      {/* Drawer: Bloques */}
      <EditorDrawer
        panelType="bloques"
        title="Agregar bloque"
        subtitle="Toca para agregar al final"
      >
        <div className="space-y-2">
          {BLOQUES_INVITACION.map((bloque) => (
            <DraggableBlockItem
              key={bloque.tipo}
              bloque={bloque}
              onClick={() => {
                handleAgregarBloque(bloque.tipo);
                closeDrawer();
              }}
            />
          ))}
        </div>
      </EditorDrawer>

      {/* Drawer: Propiedades */}
      <EditorDrawer
        panelType="propiedades"
        title={BLOCK_NAMES[bloqueSeleccionadoCompleto?.tipo] || 'Propiedades'}
        subtitle="Edita las propiedades del bloque"
        showCloseButton
        onClose={deseleccionarBloque}
      >
        {bloqueSeleccionadoCompleto && (
          EditorComponent ? (
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
          )
        )}
      </EditorDrawer>
    </>
  );
}

/**
 * DraggableBlockItem - Ítem de bloque draggable para el drawer
 */
const DraggableBlockItem = memo(function DraggableBlockItem({ bloque, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `drawer-palette-${bloque.tipo}`,
    data: {
      type: 'palette-item',
      blockType: bloque.tipo,
    },
  });

  const Icon = bloque.icon;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing',
        'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700',
        'border border-transparent hover:border-primary-200 dark:hover:border-primary-800',
        'transition-all duration-200',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'rgba(117, 53, 114, 0.1)' }}
      >
        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {bloque.label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {bloque.descripcion}
        </p>
      </div>
    </div>
  );
});

export default memo(DrawersContainer);
