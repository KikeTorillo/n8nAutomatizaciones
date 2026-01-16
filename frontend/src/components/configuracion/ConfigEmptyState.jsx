import { Plus, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Estado vacío genérico para páginas de configuración
 * Muestra mensaje diferente si hay filtros activos
 *
 * @param {Object} props
 * @param {React.ElementType} props.icon - Icono Lucide a mostrar
 * @param {string} props.title - Título principal
 * @param {string} [props.description] - Descripción adicional
 * @param {string} [props.actionLabel] - Label del botón de acción
 * @param {function} [props.onAction] - Handler del botón de acción
 * @param {boolean} [props.isFiltered=false] - Si hay filtros activos
 * @param {string} [props.filteredTitle="No se encontraron resultados"] - Título cuando hay filtros
 * @param {string} [props.filteredDescription="Intenta con otros términos de búsqueda"] - Descripción cuando hay filtros
 */
function ConfigEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  isFiltered = false,
  filteredTitle = 'No se encontraron resultados',
  filteredDescription = 'Intenta con otros términos de búsqueda',
}) {
  const DisplayIcon = isFiltered ? Search : Icon;
  const displayTitle = isFiltered ? filteredTitle : title;
  const displayDescription = isFiltered ? filteredDescription : description;

  return (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <DisplayIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <p className="text-gray-900 dark:text-gray-100 font-medium mb-2">
        {displayTitle}
      </p>
      {displayDescription && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
          {displayDescription}
        </p>
      )}
      {!isFiltered && onAction && actionLabel && (
        <Button onClick={onAction} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default ConfigEmptyState;
