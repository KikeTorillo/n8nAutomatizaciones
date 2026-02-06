import { create } from 'zustand';
import { generateId } from '@/lib/utils';
import type { ToastType } from '@/types/ui';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: { message: string; type?: ToastType; duration?: number }) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

interface ToastFn {
  (message: string, options?: ToastOptions): string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
}

export interface UseToastReturn {
  toasts: Toast[];
  toast: ToastFn;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  remove: (id: string) => void;
  clear: () => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      message: toast.message,
      type: toast.type || 'info',
      duration: toast.duration || 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

export function useToast(): UseToastReturn {
  const { toasts, addToast, removeToast, clearAll } = useToastStore();

  const success = (message: string, options: ToastOptions = {}) => {
    return addToast({ message, type: 'success', duration: options.duration ?? 5000 });
  };

  const error = (message: string, options: ToastOptions = {}) => {
    return addToast({ message, type: 'error', duration: options.duration ?? 5000 });
  };

  const warning = (message: string, options: ToastOptions = {}) => {
    return addToast({ message, type: 'warning', duration: options.duration ?? 5000 });
  };

  const info = (message: string, options: ToastOptions = {}) => {
    return addToast({ message, type: 'info', duration: options.duration ?? 5000 });
  };

  const toast = ((message: string, options: ToastOptions = {}) => {
    return addToast({
      message,
      type: options.type || 'info',
      duration: options.duration ?? 5000,
    });
  }) as ToastFn;

  toast.success = success;
  toast.error = error;
  toast.warning = warning;
  toast.info = info;

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    remove: removeToast,
    clear: clearAll,
  };
}

export default useToast;
