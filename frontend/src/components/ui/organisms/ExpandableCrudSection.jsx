/**
 * ExpandableCrudSection - Componente genérico para secciones CRUD expandibles
 *
 * Elimina ~600 LOC de código duplicado en:
 * - EducacionFormalSection
 * - ExperienciaLaboralSection
 * - HabilidadesSection
 * - CuentasBancariasSection
 *
 * @example
 * <ExpandableCrudSection
 *   icon={GraduationCap}
 *   title="Educación Formal"
 *   items={educaciones}
 *   isLoading={isLoading}
 *   error={error}
 *   emptyMessage="No hay educación registrada"
 *   addButtonText="Agregar Educación"
 *   renderItem={(item, actions) => <EducacionCard item={item} {...actions} />}
 *   deleteConfig={{
 *     title: "Eliminar Educación",
 *     getMessage: (item) => `¿Eliminar "${item.titulo}"?`,
 *     mutation: eliminarMutation
 *   }}
 *   onAdd={() => openDrawer()}
 *   DrawerComponent={EducacionDrawer}
 *   drawerProps={{ profesionalId }}
 * />
 */
import { useState, memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Loader2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '../atoms/Button';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '@/hooks/utils';

/**
 * IMPORTANTE: Memoizar `renderItem` con useCallback en el componente padre
 * para evitar re-renders innecesarios.
 */
const ExpandableCrudSection = memo(function ExpandableCrudSection({
  // Header
  icon: Icon,
  title,
  count,
  defaultExpanded = false,

  // Data
  items = [],
  isLoading = false,
  error = null,

  // Messages
  emptyMessage = 'No hay registros',
  loadingMessage = 'Cargando...',
  errorMessage = 'Error al cargar datos',
  addButtonText = 'Agregar',

  // Rendering
  renderItem,
  renderList,
  listClassName = 'space-y-2',

  // Delete
  deleteConfig,

  // Drawer/Modal
  DrawerComponent,
  drawerProps = {},
  itemPropName = 'item', // Nombre del prop para pasar el item al drawer

  // Extra actions (for custom buttons in header)
  headerActions,

  // Callbacks
  onItemEdit,
  onItemDelete,
}) {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showDrawer, setShowDrawer] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Handlers
  const handleAdd = () => {
    setItemToEdit(null);
    setShowDrawer(true);
  };

  const handleEdit = (item) => {
    setItemToEdit(item);
    setShowDrawer(true);
    onItemEdit?.(item);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setItemToEdit(null);
  };

  const handleDeleteRequest = (item) => {
    setItemToDelete(item);
    onItemDelete?.(item);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !deleteConfig?.mutation) return;

    try {
      const deleteParams = deleteConfig.getDeleteParams
        ? deleteConfig.getDeleteParams(itemToDelete)
        : { id: itemToDelete.id, ...drawerProps };

      await deleteConfig.mutation.mutateAsync(deleteParams);
      toast.success(deleteConfig.successMessage || 'Eliminado correctamente');
      setItemToDelete(null);
    } catch (err) {
      toast.error(err.message || deleteConfig.errorMessage || 'Error al eliminar');
    }
  };

  // Computed count
  const displayCount = count ?? items.length;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      {/* Header expandible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 mb-4"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h4>
          {displayCount > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
              {displayCount}
            </span>
          )}
          {headerActions}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="pl-7 space-y-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{loadingMessage}</span>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <>
              {/* Empty state */}
              {items.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  {emptyMessage}
                </div>
              ) : (
                /* List rendering */
                renderList ? (
                  renderList(items, { onEdit: handleEdit, onDelete: handleDeleteRequest })
                ) : (
                  <div className={listClassName}>
                    {items.map((item, index) => (
                      <div key={item.id || index}>
                        {renderItem(item, {
                          onEdit: () => handleEdit(item),
                          onDelete: () => handleDeleteRequest(item),
                        })}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Add button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addButtonText}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Confirm delete dialog */}
      {deleteConfig && (
        <ConfirmDialog
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title={deleteConfig.title || 'Confirmar eliminación'}
          message={itemToDelete ? deleteConfig.getMessage(itemToDelete) : ''}
          confirmText={deleteConfig.confirmText || 'Eliminar'}
          cancelText={deleteConfig.cancelText || 'Cancelar'}
          variant="danger"
          isLoading={deleteConfig.mutation?.isPending}
        />
      )}

      {/* Drawer for create/edit */}
      {DrawerComponent && (
        <DrawerComponent
          isOpen={showDrawer}
          onClose={handleCloseDrawer}
          onSuccess={handleCloseDrawer}
          {...drawerProps}
          {...(itemToEdit && { [itemPropName]: itemToEdit })}
        />
      )}
    </div>
  );
});

ExpandableCrudSection.displayName = 'ExpandableCrudSection';

ExpandableCrudSection.propTypes = {
  // Header
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  defaultExpanded: PropTypes.bool,

  // Data
  items: PropTypes.array,
  isLoading: PropTypes.bool,
  error: PropTypes.any,

  // Messages
  emptyMessage: PropTypes.string,
  loadingMessage: PropTypes.string,
  errorMessage: PropTypes.string,
  addButtonText: PropTypes.string,

  // Rendering
  renderItem: PropTypes.func,
  renderList: PropTypes.func,
  listClassName: PropTypes.string,

  // Delete config
  deleteConfig: PropTypes.shape({
    title: PropTypes.string,
    getMessage: PropTypes.func.isRequired,
    mutation: PropTypes.object.isRequired,
    getDeleteParams: PropTypes.func,
    successMessage: PropTypes.string,
    errorMessage: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
  }),

  // Drawer
  DrawerComponent: PropTypes.elementType,
  drawerProps: PropTypes.object,
  itemPropName: PropTypes.string,

  // Extra actions
  headerActions: PropTypes.node,

  // Callbacks
  onItemEdit: PropTypes.func,
  onItemDelete: PropTypes.func,
};

export { ExpandableCrudSection };
export default ExpandableCrudSection;
