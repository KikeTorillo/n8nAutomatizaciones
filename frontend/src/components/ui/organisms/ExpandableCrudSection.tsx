import { useState, memo, type ReactNode, type ComponentType } from 'react';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '../atoms/Button';
import { ConfirmDialog } from './ConfirmDialog';
import { ExpandableSection } from './ExpandableSection';
import { useToast } from '@/hooks/utils';

/** Interface para el retorno de useToast */
interface ToastHook {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

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
  /** Mutación de TanStack Query */
  mutation: {
    mutateAsync: (params: unknown) => Promise<unknown>;
    isPending?: boolean;
  };
  /** Función para obtener parámetros de eliminación */
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
  [key: string]: unknown;
}

/**
 * Props del componente ExpandableCrudSection
 */
export interface ExpandableCrudSectionProps<T extends { id?: string | number }> {
  // Header
  /** Icono del header */
  icon?: ComponentType<{ className?: string }>;
  /** Título de la sección */
  title: string;
  /** Contador manual (si no se quiere usar items.length) */
  count?: number;
  /** Si inicia expandido */
  defaultExpanded?: boolean;

  // Data
  /** Array de items */
  items?: T[];
  /** Estado de carga */
  isLoading?: boolean;
  /** Error */
  error?: unknown;

  // Messages
  /** Mensaje cuando está vacío */
  emptyMessage?: string;
  /** Mensaje de carga */
  loadingMessage?: string;
  /** Mensaje de error */
  errorMessage?: string;
  /** Texto del botón agregar */
  addButtonText?: string;

  // Rendering
  /** Función para renderizar un item */
  renderItem?: (item: T, actions: ItemActions) => ReactNode;
  /** Función para renderizar la lista completa */
  renderList?: (items: T[], actions: ListActions<T>) => ReactNode;
  /** Clases para el contenedor de la lista */
  listClassName?: string;

  // Delete
  /** Configuración de eliminación */
  deleteConfig?: DeleteConfig<T>;

  // Drawer
  /** Componente del drawer */
  DrawerComponent?: ComponentType<DrawerComponentProps<T>>;
  /** Props adicionales para el drawer */
  drawerProps?: Record<string, unknown>;
  /** Nombre del prop para pasar el item al drawer */
  itemPropName?: string;

  // Extra
  /** Acciones adicionales en el header */
  headerActions?: ReactNode;

  // Callbacks
  /** Callback cuando se edita un item */
  onItemEdit?: (item: T) => void;
  /** Callback cuando se elimina un item */
  onItemDelete?: (item: T) => void;
}

/**
 * ExpandableCrudSection - Componente genérico para secciones CRUD expandibles
 *
 * Compone ExpandableSection (UI pura) + lógica CRUD (drawers, delete, toast).
 *
 * IMPORTANTE: Memoizar `renderItem` con useCallback en el componente padre
 * para evitar re-renders innecesarios.
 */
function ExpandableCrudSectionComponent<T extends { id?: string | number }>({
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
  itemPropName = 'item',

  // Extra actions
  headerActions,

  // Callbacks
  onItemEdit,
  onItemDelete,
}: ExpandableCrudSectionProps<T>) {
  const toast = useToast() as ToastHook;
  const [showDrawer, setShowDrawer] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  // Handlers
  const handleAdd = () => {
    setItemToEdit(null);
    setShowDrawer(true);
  };

  const handleEdit = (item: T) => {
    setItemToEdit(item);
    setShowDrawer(true);
    onItemEdit?.(item);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setItemToEdit(null);
  };

  const handleDeleteRequest = (item: T) => {
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
      const errorMsg =
        err instanceof Error ? err.message : deleteConfig.errorMessage || 'Error al eliminar';
      toast.error(errorMsg);
    }
  };

  // Computed count
  const displayCount = count ?? items.length;

  return (
    <>
      <ExpandableSection
        icon={Icon}
        title={title}
        count={displayCount}
        defaultExpanded={defaultExpanded}
        headerActions={headerActions}
        contentClassName="space-y-4"
      >
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
            ) : /* List rendering */
            renderList ? (
              renderList(items, { onEdit: handleEdit, onDelete: handleDeleteRequest })
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

            {/* Add button */}
            <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
            </Button>
          </>
        )}
      </ExpandableSection>

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
    </>
  );
}

export const ExpandableCrudSection = memo(
  ExpandableCrudSectionComponent
) as typeof ExpandableCrudSectionComponent;

// @ts-expect-error - displayName en memo con generics
ExpandableCrudSection.displayName = 'ExpandableCrudSection';

export { ExpandableCrudSection as default };
