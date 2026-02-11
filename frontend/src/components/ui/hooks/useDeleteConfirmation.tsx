import { useState, useCallback, useMemo, type ReactNode } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { ConfirmDialog } from '../organisms/ConfirmDialog';
import { useToast } from './useToast';

type EntityItem = Record<string, unknown>;

export interface DeleteConfirmationOptions {
  deleteMutation: Pick<
    UseMutationResult<unknown, Error, unknown>,
    'mutate' | 'isPending'
  > | null;
  entityName: string;
  getName?: (item: EntityItem) => string;
  successMessage?: string;
  errorMessage?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmText?: string;
  onSuccess?: (item: EntityItem) => void;
  onError?: (error: Error, item: EntityItem) => void;
  renderChildren?: (item: EntityItem | null) => ReactNode;
}

export interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  variant: string;
  isLoading: boolean;
  children?: ReactNode;
}

export interface DeleteConfirmationReturn {
  confirmDelete: (item: EntityItem) => void;
  deleteConfirmProps: DeleteConfirmProps;
  /** @deprecated Usar deleteConfirmProps con <ConfirmDialog {...deleteConfirmProps} /> */
  DeleteConfirmModal: () => JSX.Element | null;
  isDeleting: boolean;
  itemToDelete: EntityItem | null;
  isOpen: boolean;
  closeModal: () => void;
}

/**
 * Hook para manejar confirmación de eliminación con patrón estandarizado.
 */
export function useDeleteConfirmation({
  deleteMutation,
  entityName,
  getName = (item) =>
    (item?.nombre as string) || (item?.name as string) || 'este elemento',
  successMessage,
  errorMessage,
  confirmTitle,
  confirmMessage,
  confirmText = 'Eliminar',
  onSuccess,
  onError,
  renderChildren,
}: DeleteConfirmationOptions): DeleteConfirmationReturn {
  const { success: showSuccess, error: showError } = useToast();
  const [itemToDelete, setItemToDelete] = useState<EntityItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const capitalizedEntity = useMemo(() => {
    return entityName.charAt(0).toUpperCase() + entityName.slice(1);
  }, [entityName]);

  const confirmDelete = useCallback((item: EntityItem) => {
    setItemToDelete(item);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setItemToDelete(null), 200);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!itemToDelete || !deleteMutation) return;

    const itemId = itemToDelete.id;

    deleteMutation.mutate(itemId, {
      onSuccess: () => {
        showSuccess(
          successMessage || `${capitalizedEntity} eliminado correctamente`
        );
        closeModal();
        onSuccess?.(itemToDelete);
      },
      onError: (
        err: Error & { response?: { data?: { mensaje?: string } } }
      ) => {
        const mensaje =
          err.response?.data?.mensaje ||
          err.message ||
          errorMessage ||
          `Error al eliminar ${entityName}`;
        showError(mensaje);
        onError?.(err, itemToDelete);
      },
    });
  }, [
    itemToDelete,
    deleteMutation,
    successMessage,
    errorMessage,
    capitalizedEntity,
    entityName,
    showSuccess,
    showError,
    closeModal,
    onSuccess,
    onError,
  ]);

  const defaultMessage = `¿Estás seguro de que deseas eliminar ${entityName === 'el' || entityName.startsWith('el ') ? '' : entityName.match(/^[aeiou]/i) ? 'la ' : 'el '}${entityName} "{name}"? Esta acción no se puede deshacer.`;

  const finalMessage = useMemo(() => {
    const template = confirmMessage || defaultMessage;
    const name = itemToDelete ? getName(itemToDelete) : '';
    return template.replace('{name}', name);
  }, [confirmMessage, defaultMessage, itemToDelete, getName]);

  const deleteConfirmProps = useMemo(
    (): DeleteConfirmProps => ({
      isOpen,
      onClose: closeModal,
      onConfirm: handleConfirm,
      title: confirmTitle || `Eliminar ${capitalizedEntity}`,
      message: finalMessage,
      confirmText,
      variant: 'danger',
      isLoading: deleteMutation?.isPending ?? false,
      children: renderChildren ? renderChildren(itemToDelete) : undefined,
    }),
    [
      isOpen,
      closeModal,
      handleConfirm,
      confirmTitle,
      capitalizedEntity,
      finalMessage,
      confirmText,
      deleteMutation,
      renderChildren,
      itemToDelete,
    ]
  );

  const DeleteConfirmModal = useCallback(() => {
    if (!deleteMutation) return null;
    return <ConfirmDialog {...deleteConfirmProps} />;
  }, [deleteMutation, deleteConfirmProps]);

  return {
    confirmDelete,
    deleteConfirmProps,
    DeleteConfirmModal,
    isDeleting: deleteMutation?.isPending ?? false,
    itemToDelete,
    isOpen,
    closeModal,
  };
}

export default useDeleteConfirmation;
