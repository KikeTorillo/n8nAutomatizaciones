import { renderHook, act } from '@testing-library/react';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';

// Mock useToast — el store global de Zustand
vi.mock('../../hooks/useToast', () => {
  const successFn = vi.fn();
  const errorFn = vi.fn();
  return {
    useToast: () => ({
      toasts: [],
      toast: Object.assign(vi.fn(), {
        success: successFn,
        error: errorFn,
        warning: vi.fn(),
        info: vi.fn(),
      }),
      success: successFn,
      error: errorFn,
      warning: vi.fn(),
      info: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }),
    __mockSuccess: successFn,
    __mockError: errorFn,
  };
});

// Mock ConfirmDialog para evitar dependencias de UI pesadas
vi.mock('../../organisms/ConfirmDialog', () => ({
  ConfirmDialog: (props: Record<string, unknown>) => {
    if (!props.isOpen) return null;
    return <div data-testid="confirm-dialog">{String(props.message)}</div>;
  },
}));

interface MockMutation {
  mutate: ReturnType<typeof vi.fn>;
  isPending: boolean;
}

function createMockMutation(overrides?: Partial<MockMutation>): MockMutation {
  return {
    mutate: vi.fn(),
    isPending: false,
    ...overrides,
  };
}

describe('useDeleteConfirmation', () => {
  const mockItem = { id: 1, nombre: 'Producto Test' };

  describe('initial state', () => {
    it('starts with modal closed and no item selected', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      expect(result.current.isOpen).toBe(false);
      expect(result.current.itemToDelete).toBeNull();
      expect(result.current.isDeleting).toBe(false);
    });

    it('provides deleteConfirmProps with isOpen false', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      expect(result.current.deleteConfirmProps.isOpen).toBe(false);
      expect(result.current.deleteConfirmProps.variant).toBe('danger');
    });
  });

  describe('confirmDelete', () => {
    it('opens the dialog and sets the item to delete', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.itemToDelete).toEqual(mockItem);
    });

    it('sets the correct title in deleteConfirmProps', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      expect(result.current.deleteConfirmProps.title).toBe('Eliminar Producto');
    });

    it('includes item name in message via getName', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      expect(result.current.deleteConfirmProps.message).toContain(
        'Producto Test'
      );
    });

    it('uses custom getName when provided', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'servicio',
          getName: (item) => String(item.id),
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      expect(result.current.deleteConfirmProps.message).toContain('1');
    });

    it('uses custom confirmTitle when provided', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
          confirmTitle: 'Borrar para siempre',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      expect(result.current.deleteConfirmProps.title).toBe(
        'Borrar para siempre'
      );
    });
  });

  describe('confirm (onConfirm)', () => {
    it('calls deleteMutation.mutate with item id', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      act(() => {
        result.current.deleteConfirmProps.onConfirm();
      });

      expect(mutation.mutate).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('calls onSuccess callback on successful deletion', () => {
      const onSuccess = vi.fn();
      const mutation = createMockMutation();
      mutation.mutate.mockImplementation(
        (_id: unknown, opts: { onSuccess: () => void }) => {
          opts.onSuccess();
        }
      );

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
          onSuccess,
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      act(() => {
        result.current.deleteConfirmProps.onConfirm();
      });

      expect(onSuccess).toHaveBeenCalledWith(mockItem);
    });

    it('shows success toast on successful deletion', async () => {
      const { __mockSuccess } = (await import(
        '../../hooks/useToast'
      )) as unknown as { __mockSuccess: ReturnType<typeof vi.fn> };
      __mockSuccess.mockClear();

      const mutation = createMockMutation();
      mutation.mutate.mockImplementation(
        (_id: unknown, opts: { onSuccess: () => void }) => {
          opts.onSuccess();
        }
      );

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      act(() => {
        result.current.deleteConfirmProps.onConfirm();
      });

      expect(__mockSuccess).toHaveBeenCalledWith(
        'Producto eliminado correctamente'
      );
    });

    it('calls onError callback on failed deletion', () => {
      const onError = vi.fn();
      const testError = new Error('Network error');
      const mutation = createMockMutation();
      mutation.mutate.mockImplementation(
        (_id: unknown, opts: { onError: (err: Error) => void }) => {
          opts.onError(testError);
        }
      );

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
          onError,
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      act(() => {
        result.current.deleteConfirmProps.onConfirm();
      });

      expect(onError).toHaveBeenCalledWith(testError, mockItem);
    });

    it('shows error toast on failed deletion', async () => {
      const { __mockError } = (await import(
        '../../hooks/useToast'
      )) as unknown as { __mockError: ReturnType<typeof vi.fn> };
      __mockError.mockClear();

      const testError = new Error('Server error');
      const mutation = createMockMutation();
      mutation.mutate.mockImplementation(
        (_id: unknown, opts: { onError: (err: Error) => void }) => {
          opts.onError(testError);
        }
      );

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      act(() => {
        result.current.deleteConfirmProps.onConfirm();
      });

      expect(__mockError).toHaveBeenCalledWith('Server error');
    });

    it('does not call mutate if no item is selected', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      // No llamar confirmDelete, onConfirm directamente
      act(() => {
        result.current.deleteConfirmProps.onConfirm();
      });

      expect(mutation.mutate).not.toHaveBeenCalled();
    });

    it('does not call mutate if deleteMutation is null', () => {
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: null,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      act(() => {
        result.current.deleteConfirmProps.onConfirm();
      });

      // No deberia arrojar error
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('cancel (closeModal)', () => {
    it('closes the dialog', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closeModal();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('onClose in deleteConfirmProps also closes the dialog', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      act(() => {
        result.current.deleteConfirmProps.onClose();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('clears itemToDelete after a delay (animation)', () => {
      vi.useFakeTimers();
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });
      expect(result.current.itemToDelete).toEqual(mockItem);

      act(() => {
        result.current.closeModal();
      });
      // isOpen se cierra inmediatamente
      expect(result.current.isOpen).toBe(false);
      // itemToDelete se limpia despues de 200ms (animacion)
      expect(result.current.itemToDelete).toEqual(mockItem);

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current.itemToDelete).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('isDeleting state', () => {
    it('reflects deleteMutation.isPending', () => {
      const mutation = createMockMutation({ isPending: true });
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      expect(result.current.isDeleting).toBe(true);
      expect(result.current.deleteConfirmProps.isLoading).toBe(true);
    });

    it('returns false when isPending is false', () => {
      const mutation = createMockMutation({ isPending: false });
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      expect(result.current.isDeleting).toBe(false);
      expect(result.current.deleteConfirmProps.isLoading).toBe(false);
    });

    it('returns false when deleteMutation is null', () => {
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: null,
          entityName: 'producto',
        })
      );

      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe('custom messages', () => {
    it('uses custom confirmText', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
          confirmText: 'Si, borrar',
        })
      );

      expect(result.current.deleteConfirmProps.confirmText).toBe('Si, borrar');
    });

    it('uses custom confirmMessage with {name} placeholder', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
          confirmMessage: 'Borrar {name} permanentemente?',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      expect(result.current.deleteConfirmProps.message).toBe(
        'Borrar Producto Test permanentemente?'
      );
    });

    it('uses custom successMessage on deletion', async () => {
      const { __mockSuccess } = (await import(
        '../../hooks/useToast'
      )) as unknown as { __mockSuccess: ReturnType<typeof vi.fn> };
      __mockSuccess.mockClear();

      const mutation = createMockMutation();
      mutation.mutate.mockImplementation(
        (_id: unknown, opts: { onSuccess: () => void }) => {
          opts.onSuccess();
        }
      );

      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
          successMessage: 'Borrado con exito!',
        })
      );

      act(() => {
        result.current.confirmDelete(mockItem);
      });

      act(() => {
        result.current.deleteConfirmProps.onConfirm();
      });

      expect(__mockSuccess).toHaveBeenCalledWith('Borrado con exito!');
    });
  });

  describe('DeleteConfirmModal (deprecated)', () => {
    it('returns null when deleteMutation is null', () => {
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: null,
          entityName: 'producto',
        })
      );

      const modal = result.current.DeleteConfirmModal();
      expect(modal).toBeNull();
    });

    it('returns a component when deleteMutation is provided', () => {
      const mutation = createMockMutation();
      const { result } = renderHook(() =>
        useDeleteConfirmation({
          deleteMutation: mutation,
          entityName: 'producto',
        })
      );

      const modal = result.current.DeleteConfirmModal();
      expect(modal).not.toBeNull();
    });
  });
});
