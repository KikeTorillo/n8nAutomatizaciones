import { useState, useCallback } from 'react';
import { useToast } from './useToast';

interface ToastHook {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface DeleteConfig<T> {
  onDelete?: (item: T) => Promise<void>;
  isDeleting?: boolean;
  /** @deprecated Usar onDelete en su lugar */
  mutation?: {
    mutateAsync: (params: unknown) => Promise<unknown>;
    isPending?: boolean;
  };
  /** @deprecated Usar onDelete en su lugar */
  getDeleteParams?: (item: T) => unknown;
  successMessage?: string;
  errorMessage?: string;
  fallbackDeleteParams?: Record<string, unknown>;
}

export interface UseExpandableCrudLogicOptions<T> {
  deleteConfig?: DeleteConfig<T>;
  onItemEdit?: (item: T) => void;
  onItemDelete?: (item: T) => void;
  onDeleteSuccess?: (message: string) => void;
  onDeleteError?: (message: string) => void;
}

export interface UseExpandableCrudLogicReturn<T> {
  showDrawer: boolean;
  itemToEdit: T | null;
  itemToDelete: T | null;
  handleAdd: () => void;
  handleEdit: (item: T) => void;
  handleCloseDrawer: () => void;
  handleDeleteRequest: (item: T) => void;
  handleDeleteConfirm: () => Promise<void>;
  clearItemToDelete: () => void;
}

/**
 * Hook que encapsula la lógica CRUD de ExpandableCrudSection
 */
export function useExpandableCrudLogic<T extends { id?: string | number }>(
  options: UseExpandableCrudLogicOptions<T> = {}
): UseExpandableCrudLogicReturn<T> {
  const {
    deleteConfig,
    onItemEdit,
    onItemDelete,
    onDeleteSuccess,
    onDeleteError,
  } = options;

  const toast = useToast() as ToastHook;
  const [showDrawer, setShowDrawer] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const handleAdd = useCallback(() => {
    setItemToEdit(null);
    setShowDrawer(true);
  }, []);

  const handleEdit = useCallback(
    (item: T) => {
      setItemToEdit(item);
      setShowDrawer(true);
      onItemEdit?.(item);
    },
    [onItemEdit]
  );

  const handleCloseDrawer = useCallback(() => {
    setShowDrawer(false);
    setItemToEdit(null);
  }, []);

  const handleDeleteRequest = useCallback(
    (item: T) => {
      setItemToDelete(item);
      onItemDelete?.(item);
    },
    [onItemDelete]
  );

  const clearItemToDelete = useCallback(() => {
    setItemToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete || !deleteConfig) return;

    try {
      if (deleteConfig.onDelete) {
        await deleteConfig.onDelete(itemToDelete);
      } else if (deleteConfig.mutation) {
        const deleteParams = deleteConfig.getDeleteParams
          ? deleteConfig.getDeleteParams(itemToDelete)
          : { id: itemToDelete.id, ...deleteConfig.fallbackDeleteParams };
        await deleteConfig.mutation.mutateAsync(deleteParams);
      } else {
        return;
      }
      const successMsg =
        deleteConfig.successMessage || 'Eliminado correctamente';
      (onDeleteSuccess || toast.success)(successMsg);
      setItemToDelete(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : deleteConfig.errorMessage || 'Error al eliminar';
      (onDeleteError || toast.error)(errorMsg);
    }
  }, [itemToDelete, deleteConfig, onDeleteSuccess, onDeleteError, toast]);

  return {
    showDrawer,
    itemToEdit,
    itemToDelete,
    handleAdd,
    handleEdit,
    handleCloseDrawer,
    handleDeleteRequest,
    handleDeleteConfirm,
    clearItemToDelete,
  };
}
