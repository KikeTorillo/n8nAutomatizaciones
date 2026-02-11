import { useState, useCallback, useMemo } from 'react';

export interface ModalState {
  isOpen: boolean;
  data: unknown;
  [key: string]: unknown;
}

type ModalMap = Record<string, ModalState>;

interface ModalManagerReturn {
  modals: ModalMap;
  openModal: (
    modalKey: string,
    data?: unknown,
    extraProps?: Record<string, unknown>
  ) => void;
  closeModal: (modalKey: string, clearData?: boolean) => void;
  closeAll: () => void;
  isOpen: (modalKey: string) => boolean;
  getModalData: (modalKey: string) => unknown;
  getModalProps: (modalKey: string) => ModalState;
  updateModal: (modalKey: string, updates: Partial<ModalState>) => void;
  transitionModal: (
    fromModal: string,
    toModal: string,
    data?: unknown,
    delay?: number
  ) => void;
}

/**
 * useModalManager - Hook para gestionar múltiples modales de forma organizada
 */
export function useModalManager(
  initialState: Record<string, Partial<ModalState>> = {}
): ModalManagerReturn {
   
  const normalizedInitial = useMemo<ModalMap>(() => {
    const normalized: ModalMap = {};
    Object.keys(initialState).forEach((key) => {
      const value = initialState[key];
      normalized[key] = {
        isOpen: value?.isOpen ?? false,
        data: value?.data ?? null,
        ...value,
      } as ModalState;
    });
    return normalized;
  }, []);

  const [modals, setModals] = useState<ModalMap>(normalizedInitial);

  const openModal = useCallback(
    (
      modalKey: string,
      data: unknown = null,
      extraProps: Record<string, unknown> = {}
    ) => {
      setModals((prev) => ({
        ...prev,
        [modalKey]: {
          ...prev[modalKey],
          isOpen: true,
          data,
          ...extraProps,
        },
      }));
    },
    []
  );

  const closeModal = useCallback((modalKey: string, clearData = true) => {
    setModals((prev) => ({
      ...prev,
      [modalKey]: {
        ...prev[modalKey],
        isOpen: false,
        ...(clearData ? { data: null } : {}),
      },
    }));
  }, []);

  const closeAll = useCallback(() => {
    setModals((prev) => {
      const closed: ModalMap = {};
      Object.keys(prev).forEach((key) => {
        closed[key] = {
          ...prev[key],
          isOpen: false,
          data: null,
        };
      });
      return closed;
    });
  }, []);

  const isOpen = useCallback(
    (modalKey: string): boolean => {
      return (modals[modalKey]?.isOpen as boolean) ?? false;
    },
    [modals]
  );

  const getModalData = useCallback(
    (modalKey: string): unknown => {
      return modals[modalKey]?.data ?? null;
    },
    [modals]
  );

  const getModalProps = useCallback(
    (modalKey: string): ModalState => {
      return modals[modalKey] ?? { isOpen: false, data: null };
    },
    [modals]
  );

  const updateModal = useCallback(
    (modalKey: string, updates: Partial<ModalState>) => {
      setModals((prev) => ({
        ...prev,
        [modalKey]: {
          ...prev[modalKey],
          ...updates,
        },
      }));
    },
    []
  );

  const transitionModal = useCallback(
    (fromModal: string, toModal: string, data: unknown = null, delay = 300) => {
      closeModal(fromModal, false);
      setTimeout(() => {
        openModal(toModal, data);
      }, delay);
    },
    [closeModal, openModal]
  );

  return {
    modals,
    openModal,
    closeModal,
    closeAll,
    isOpen,
    getModalData,
    getModalProps,
    updateModal,
    transitionModal,
  };
}

interface SimpleModalReturn<T> {
  isOpen: boolean;
  data: T | null;
  open: (newData?: T | null) => void;
  close: (clearData?: boolean) => void;
  toggle: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * useSimpleModal - Hook simplificado para un solo modal
 */
export function useSimpleModal<T = unknown>(
  initialData: T | null = null
): SimpleModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(initialData);

  const open = useCallback((newData: T | null = null) => {
    setData(newData);
    setIsOpen(true);
  }, []);

  const close = useCallback((clearData = true) => {
    setIsOpen(false);
    if (clearData) {
      setData(null);
    }
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData,
  };
}

export default useModalManager;
