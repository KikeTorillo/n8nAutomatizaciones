import type { UseMutationResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export interface DeleteConfirmationOptions {
  deleteMutation: Pick<UseMutationResult<unknown, Error, unknown>, 'mutate' | 'isPending'> | null;
  entityName: string;
  getName?: (item: Record<string, unknown>) => string;
  successMessage?: string;
  errorMessage?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmText?: string;
  onSuccess?: (item: Record<string, unknown>) => void;
  onError?: (error: Error, item: Record<string, unknown>) => void;
  renderChildren?: (item: Record<string, unknown> | null) => ReactNode;
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
  confirmDelete: (item: Record<string, unknown>) => void;
  deleteConfirmProps: DeleteConfirmProps;
  DeleteConfirmModal: () => JSX.Element | null;
  isDeleting: boolean;
  itemToDelete: Record<string, unknown> | null;
  isOpen: boolean;
  closeModal: () => void;
}

export function useDeleteConfirmation(options: DeleteConfirmationOptions): DeleteConfirmationReturn;
export default useDeleteConfirmation;
