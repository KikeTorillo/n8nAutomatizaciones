/**
 * ====================================================================
 * ARRAY ITEMS EDITOR
 * ====================================================================
 *
 * Componente reutilizable para editar arrays de items (FAQ, testimonios, etc).
 * Maneja agregar, eliminar y renderizar items.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Editor de array de items
 *
 * @param {Object} props
 * @param {Array} props.items - Array de items
 * @param {string} props.label - Label del grupo
 * @param {Function} props.onAgregar - Callback para agregar item
 * @param {Function} props.onEliminar - Callback para eliminar item (recibe index)
 * @param {string} props.itemName - Nombre singular del item (ej: "Pregunta")
 * @param {Function} props.renderItem - Función que renderiza cada item (item, index) => JSX
 * @param {React.ReactNode} props.itemIcon - Icono para cada item
 * @param {string} props.iconColor - Color del icono (ej: "text-blue-500")
 * @param {boolean} props.showDragHandle - Mostrar handle de drag
 * @param {number} props.maxItems - Máximo de items permitidos
 */
export function ArrayItemsEditor({
  items = [],
  label,
  onAgregar,
  onEliminar,
  itemName = 'Item',
  renderItem,
  itemIcon: ItemIcon,
  iconColor = 'text-blue-500',
  showDragHandle = true,
  maxItems = Infinity,
}) {
  const canAddMore = items.length < maxItems;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} ({items.length})
        </label>
        {canAddMore && (
          <Button type="button" variant="ghost" size="sm" onClick={onAgregar}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar {itemName}
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            {/* Item Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {showDragHandle && (
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                )}
                {ItemIcon && <ItemIcon className={`w-4 h-4 ${iconColor}`} />}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {itemName} {index + 1}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEliminar(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Item Content */}
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No hay {label.toLowerCase()} agregados</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAgregar}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar {itemName}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ArrayItemsEditor;
