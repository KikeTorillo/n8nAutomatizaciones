import { memo, forwardRef, type ReactNode, type ComponentType } from 'react';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '../atoms/Button';
import { ConfirmDialog } from './ConfirmDialog';
import { ExpandableSection } from './ExpandableSection';
import { useExpandableCrudLogic } from '../hooks/useExpandableCrudLogic';

/**
 * Contexto de acciones para renderItem
 */
export interface ItemActions {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Contexto de acciones para renderList
 */
export interface ListActions<T> {
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}

/**
 * Configuración de eliminación
 */
export interface DeleteConfig<T> {
  /** Título del diálogo de confirmación */
  title?: string;
  /** Función para obtener el mensaje de confirmación */
  getMessage: (item: T) => string;
  /** Callback de eliminación (preferido sobre mutation) */
  onDelete?: (item: T) => Promise<void>;
  /** Si está eliminando (preferido sobre mutation.isPending) */
  isDeleting?: boolean;
  /** @deprecated Usar onDelete en su lugar */
  mutation?: {
    mutateAsync: (params: unknown) => Promise<unknown>;
    isPending?: boolean;
  };
  /** @deprecated Usar onDelete en su lugar */
  getDeleteParams?: (item: T) => unknown;
  /** Mensaje de éxito */
  successMessage?: string;
  /** Mensaje de error */
  errorMessage?: string;
  /** Texto del botón confirmar */
  confirmText?: string;
  /** Texto del botón cancelar */
  cancelText?: string;
}

/**
 * Props base para el drawer
 */
export interface DrawerComponentProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Props del componente ExpandableCrudSection
 */
export interface ExpandableCrudSectionProps<
  T extends { id?: string | number },
> {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  defaultExpanded?: boolean;
  items?: T[];
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  addButtonText?: string;
  renderItem?: (item: T, actions: ItemActions) => ReactNode;
  renderList?: (items: T[], actions: ListActions<T>) => ReactNode;
  listClassName?: string;
  deleteConfig?: DeleteConfig<T>;
  DrawerComponent?: ComponentType<DrawerComponentProps<T>>;
  drawerProps?: Record<string, unknown>;
  itemPropName?: string;
  headerActions?: ReactNode;
  onItemEdit?: (item: T) => void;
  onItemDelete?: (item: T) => void;
  onDeleteSuccess?: (message: string) => void;
  onDeleteError?: (message: string) => void;
}

/**
 * ExpandableCrudSection - Componente genérico para secciones CRUD expandibles
 *
 * Compone ExpandableSection (UI pura) + useExpandableCrudLogic (lógica CRUD).
 */
function ExpandableCrudSectionComponent<T extends { id?: string | number }>(
  {
    icon: Icon,
    title,
    count,
    defaultExpanded = false,
    items = [],
    isLoading = false,
    error = null,
    emptyMessage = 'No hay registros',
    loadingMessage = 'Cargando...',
    errorMessage = 'Error al cargar datos',
    addButtonText = 'Agregar',
    renderItem,
    renderList,
    listClassName = 'space-y-2',
    deleteConfig,
    DrawerComponent,
    drawerProps = {},
    itemPropName = 'item',
    headerActions,
    onItemEdit,
    onItemDelete,
    onDeleteSuccess,
    onDeleteError,
  }: ExpandableCrudSectionProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    showDrawer,
    itemToEdit,
    itemToDelete,
    handleAdd,
    handleEdit,
    handleCloseDrawer,
    handleDeleteRequest,
    handleDeleteConfirm,
    clearItemToDelete,
  } = useExpandableCrudLogic<T>({
    deleteConfig: deleteConfig
      ? {
          onDelete: deleteConfig.onDelete,
          isDeleting: deleteConfig.isDeleting,
          mutation: deleteConfig.mutation,
          getDeleteParams: deleteConfig.getDeleteParams,
          successMessage: deleteConfig.successMessage,
          errorMessage: deleteConfig.errorMessage,
          fallbackDeleteParams: drawerProps,
        }
      : undefined,
    onItemEdit,
    onItemDelete,
    onDeleteSuccess,
    onDeleteError,
  });

  const displayCount = count ?? items.length;

  return (
    <div ref={ref}>
      <ExpandableSection
        icon={Icon}
        title={title}
        count={displayCount}
        defaultExpanded={defaultExpanded}
        headerActions={headerActions}
        contentClassName="space-y-4"
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{loadingMessage}</span>
          </div>
        )}

        {!!error && !isLoading && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {items.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                {emptyMessage}
              </div>
            ) : renderList ? (
              renderList(items, {
                onEdit: handleEdit,
                onDelete: handleDeleteRequest,
              })
            ) : (
              <div className={listClassName}>
                {items.map((item, index) => (
                  <div key={item.id || index}>
                    {renderItem?.(item, {
                      onEdit: () => handleEdit(item),
                      onDelete: () => handleDeleteRequest(item),
                    })}
                  </div>
                ))}
              </div>
            )}

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
      </ExpandableSection>

      {deleteConfig && (
        <ConfirmDialog
          isOpen={!!itemToDelete}
          onClose={clearItemToDelete}
          onConfirm={handleDeleteConfirm}
          title={deleteConfig.title || 'Confirmar eliminación'}
          message={itemToDelete ? deleteConfig.getMessage(itemToDelete) : ''}
          confirmText={deleteConfig.confirmText || 'Eliminar'}
          cancelText={deleteConfig.cancelText || 'Cancelar'}
          variant="danger"
          isLoading={
            deleteConfig.isDeleting ?? deleteConfig.mutation?.isPending
          }
        />
      )}

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
}

const _ExpandableCrudSection = memo(forwardRef(ExpandableCrudSectionComponent));
(_ExpandableCrudSection as { displayName?: string }).displayName =
  'ExpandableCrudSection';

export const ExpandableCrudSection =
  _ExpandableCrudSection as typeof ExpandableCrudSectionComponent;

export { ExpandableCrudSection as default };
