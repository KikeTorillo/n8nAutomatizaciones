/**
 * ====================================================================
 * BLOCK ACCORDION ITEM
 * ====================================================================
 * Item individual del acordeón de bloques.
 * Memoizado para evitar re-renders innecesarios.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useState, memo } from 'react';
import {
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Loader2,
  Layout,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useModalManager } from '@/hooks/utils';
import { ConfirmDialog } from '@/components/ui';

/**
 * BlockAccordionItem - Item memoizado del acordeón
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {number} props.index - Índice en la lista
 * @param {number} props.total - Total de bloques
 * @param {Object} props.config - Config del tipo (icon, label, color)
 * @param {React.Component} props.EditorComponent - Componente editor a renderizar
 * @param {boolean} props.isSelected - Si está seleccionado
 * @param {Function} props.onSelect - Callback al seleccionar
 * @param {Function} props.onActualizar - Callback al actualizar contenido
 * @param {Function} props.onEliminar - Callback al eliminar
 * @param {Function} props.onDuplicar - Callback al duplicar
 * @param {Object} props.tema - Tema para pasar al editor
 * @param {Object} props.editorExtraProps - Props adicionales para el editor
 */
const BlockAccordionItem = memo(function BlockAccordionItem({
  bloque,
  index,
  total,
  config,
  EditorComponent,
  isSelected,
  onSelect,
  onActualizar,
  onEliminar,
  onDuplicar,
  tema,
  editorExtraProps = {},
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modales centralizados
  const { openModal, closeModal, isOpen } = useModalManager({
    delete: { isOpen: false },
  });

  // Config fallback
  const Icon = config?.icon || Layout;
  const label = config?.label || bloque.tipo;
  const colorClass = config?.color || 'primary';

  // Sortable hook para drag & drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bloque.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Handler para guardar cambios
  const handleGuardar = async (nuevoContenido) => {
    setIsSaving(true);
    try {
      await onActualizar(nuevoContenido);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para eliminar
  const handleEliminar = () => {
    onEliminar();
    closeModal('delete');
  };

  // Handler para toggle expansión
  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Handler para click en header
  const handleHeaderClick = () => {
    onSelect();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border-2 transition-all
        ${isSelected
          ? 'border-primary-400 dark:border-primary-500 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${isDragging ? 'shadow-lg z-50' : ''}
      `}
    >
      {/* Header del bloque */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={handleHeaderClick}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Icono del tipo */}
        <div className={`p-2 rounded-lg bg-${colorClass}-100 dark:bg-${colorClass}-900/30`}>
          <Icon className={`w-5 h-5 text-${colorClass}-600 dark:text-${colorClass}-400`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bloque {index + 1} de {total}
          </p>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-1">
          {isSaving && (
            <Loader2 className="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400" />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicar();
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Duplicar"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('delete');
            }}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleExpand}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Editor expandido */}
      {isExpanded && EditorComponent && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <EditorComponent
            contenido={bloque.contenido || {}}
            estilos={bloque.estilos || {}}
            onGuardar={handleGuardar}
            onChange={handleGuardar}
            tema={tema}
            isSaving={isSaving}
            {...editorExtraProps}
          />
        </div>
      )}

      {/* Modal confirmar eliminar */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={handleEliminar}
        title="Eliminar Bloque"
        message={`¿Estás seguro de eliminar el bloque "${label}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
});

export default BlockAccordionItem;
