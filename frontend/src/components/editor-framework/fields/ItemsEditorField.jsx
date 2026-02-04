/**
 * ItemsEditorField - Campo para editar listas de items (Timeline, Servicios, etc.)
 */
import { memo } from 'react';
import { ChevronRight } from 'lucide-react';

function ItemsEditorField({ field, fieldKey, label: labelProp, itemType: itemTypeProp, value, onOpenItemsEditor }) {
  // Soporta tanto {field} como props directos
  const key = field?.key ?? fieldKey;
  const label = field?.label ?? labelProp;
  const itemType = field?.itemType ?? itemTypeProp;
  const itemCount = Array.isArray(value) ? value.length : 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => onOpenItemsEditor?.(key, itemType)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
            {itemCount}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
      </button>
    </div>
  );
}

export default memo(ItemsEditorField);
