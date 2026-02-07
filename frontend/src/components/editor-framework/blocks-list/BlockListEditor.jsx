/**
 * ====================================================================
 * BLOCK LIST EDITOR
 * ====================================================================
 * Componente genérico para la vista de lista de bloques en modo acordeón.
 * Usado por Website Builder y Editor de Invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import { Layout, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import BlockAccordionItem from './BlockAccordionItem';

/**
 * BlockListEditor - Componente genérico para vista de lista de bloques
 *
 * @param {Object} props
 * @param {Array} props.bloques - Array de bloques a renderizar
 * @param {Object|string} props.bloqueSeleccionado - Bloque actualmente seleccionado (objeto o id)
 * @param {Object} props.bloquesConfig - Config con icon, color, label por tipo
 * @param {Object} props.editoresBloque - Map de tipo → EditorComponent
 * @param {Function} props.onSeleccionar - Callback al seleccionar bloque
 * @param {Function} props.onActualizar - Callback al actualizar contenido
 * @param {Function} props.onEliminar - Callback al eliminar
 * @param {Function} props.onDuplicar - Callback al duplicar
 * @param {Function} props.onReordenar - Callback al reordenar (drag)
 * @param {Object} props.tema - Tema para pasar a editores
 * @param {boolean} props.isLoading - Estado de carga
 * @param {string} props.emptyTitle - Título para estado vacío
 * @param {string} props.emptyMessage - Mensaje para estado vacío
 * @param {Object} props.editorExtraProps - Props adicionales para editores
 * @param {React.ReactNode} props.headerContent - Contenido opcional para mostrar arriba de la lista
 */
function BlockListEditor({
  bloques = [],
  bloqueSeleccionado,
  bloquesConfig = {},
  editoresBloque = {},
  onSeleccionar,
  onActualizar,
  onEliminar,
  onDuplicar,
  onReordenar,
  tema,
  isLoading,
  emptyTitle = 'Sin bloques',
  emptyMessage = 'Agrega bloques desde la paleta',
  editorExtraProps = {},
  headerContent,
}) {
  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler para fin de drag
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = bloques.findIndex((b) => b.id === active.id);
      const newIndex = bloques.findIndex((b) => b.id === over.id);

      const nuevasPositiones = arrayMove(bloques, oldIndex, newIndex);
      const ordenamiento = nuevasPositiones.map((b, idx) => ({
        id: b.id,
        orden: idx,
      }));

      try {
        await onReordenar(ordenamiento);
      } catch (error) {
        toast.error('Error al reordenar bloques');
        console.error('[BlockListEditor] Error reordenando:', error);
      }
    }
  };

  // Determinar si un bloque está seleccionado
  const isSelected = (bloque) => {
    if (!bloqueSeleccionado) return false;
    if (typeof bloqueSeleccionado === 'string') {
      return bloqueSeleccionado === bloque.id;
    }
    return bloqueSeleccionado?.id === bloque.id;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  // Empty state
  if (bloques.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layout className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {emptyTitle}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Header content opcional */}
      {headerContent}

      {/* Lista de bloques con DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={bloques.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {bloques.map((bloque, index) => (
              <BlockAccordionItem
                key={bloque.id}
                bloque={bloque}
                index={index}
                total={bloques.length}
                config={bloquesConfig[bloque.tipo]}
                EditorComponent={editoresBloque[bloque.tipo]}
                isSelected={isSelected(bloque)}
                onSelect={() => onSeleccionar(bloque)}
                onActualizar={(contenido) => onActualizar(bloque.id, contenido)}
                onEliminar={() => onEliminar(bloque.id)}
                onDuplicar={() => onDuplicar(bloque.id)}
                tema={tema}
                editorExtraProps={editorExtraProps}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default memo(BlockListEditor);
