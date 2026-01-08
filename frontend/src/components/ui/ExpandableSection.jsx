import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';

/**
 * ExpandableSection - Sección expandible reutilizable con soporte CRUD
 *
 * Elimina duplicación en secciones como EducacionFormalSection, ExperienciaLaboralSection, etc.
 *
 * @param {Object} props
 * @param {string} props.title - Título de la sección
 * @param {React.ComponentType} [props.icon] - Icono de lucide-react
 * @param {Array} props.items - Lista de items a renderizar
 * @param {Function} props.renderItem - Función que renderiza cada item
 * @param {Function} [props.onAdd] - Callback para agregar nuevo item
 * @param {Function} [props.onEdit] - Callback para editar item (recibe item)
 * @param {Function} [props.onDelete] - Callback para eliminar item (recibe item)
 * @param {string} [props.addButtonLabel] - Texto del botón agregar (default: "Agregar")
 * @param {string} [props.emptyMessage] - Mensaje cuando no hay items
 * @param {boolean} [props.defaultExpanded] - Si inicia expandida (default: false)
 * @param {boolean} [props.showCount] - Mostrar contador de items (default: true)
 * @param {boolean} [props.loading] - Estado de carga
 * @param {string} [props.deleteTitle] - Título del dialog de confirmación
 * @param {string} [props.deleteMessage] - Mensaje del dialog de confirmación
 * @param {Function} [props.getDeleteMessage] - Función para generar mensaje de delete (recibe item)
 * @param {string} [props.className] - Clases adicionales
 */
export function ExpandableSection({
  title,
  icon: Icon,
  items = [],
  renderItem,
  onAdd,
  onEdit,
  onDelete,
  addButtonLabel = 'Agregar',
  emptyMessage = 'No hay elementos',
  defaultExpanded = false,
  showCount = true,
  loading = false,
  deleteTitle = 'Confirmar eliminación',
  deleteMessage = '¿Estás seguro de que deseas eliminar este elemento?',
  getDeleteMessage,
  className,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleDelete = useCallback((item) => {
    setConfirmDelete(item);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (confirmDelete && onDelete) {
      onDelete(confirmDelete);
    }
    setConfirmDelete(null);
  }, [confirmDelete, onDelete]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(null);
  }, []);

  return (
    <div
      className={cn(
        'border-t border-gray-200 dark:border-gray-700 pt-4 mt-4',
        className
      )}
    >
      {/* Header expandible */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {showCount && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({items.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform" />
          )}
        </div>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic py-4 text-center">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">{renderItem(item)}</div>
                    {(onEdit || onDelete) && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón agregar */}
          {onAdd && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="mt-4 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      )}

      {/* Dialog de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={deleteTitle}
        message={
          getDeleteMessage && confirmDelete
            ? getDeleteMessage(confirmDelete)
            : deleteMessage
        }
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}

/**
 * ExpandableSectionItem - Componente auxiliar para renderizar items estándar
 *
 * @param {Object} props
 * @param {string} props.title - Título del item
 * @param {string} [props.subtitle] - Subtítulo opcional
 * @param {string} [props.description] - Descripción adicional
 * @param {React.ReactNode} [props.badge] - Badge opcional
 * @param {React.ReactNode} [props.children] - Contenido adicional
 */
export function ExpandableSectionItem({
  title,
  subtitle,
  description,
  badge,
  children,
}) {
  return (
    <div>
      <div className="flex items-start gap-2 mb-1">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h4>
        {badge}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
      )}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

export default ExpandableSection;
