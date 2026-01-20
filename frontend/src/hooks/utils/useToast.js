import { create } from 'zustand';
import { generateId } from '@/lib/utils';

/**
 * Store de Zustand para manejar toasts
 */
const useToastStore = create((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    const newToast = {
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

/**
 * Hook para mostrar notificaciones toast
 * @returns {Object} - { toasts, toast, success, error, warning, info, remove, clear }
 */
export function useToast() {
  const { toasts, addToast, removeToast, clearAll } = useToastStore();

  /**
   * Mostrar toast de éxito
   */
  const success = (message, options = {}) => {
    return addToast({ message, type: 'success', duration: options.duration ?? 5000 });
  };

  /**
   * Mostrar toast de error
   */
  const error = (message, options = {}) => {
    return addToast({ message, type: 'error', duration: options.duration ?? 5000 });
  };

  /**
   * Mostrar toast de advertencia
   */
  const warning = (message, options = {}) => {
    return addToast({ message, type: 'warning', duration: options.duration ?? 5000 });
  };

  /**
   * Mostrar toast de información
   */
  const info = (message, options = {}) => {
    return addToast({ message, type: 'info', duration: options.duration ?? 5000 });
  };

  /**
   * Toast genérico - soporta ambos patrones:
   * - toast('mensaje', { type: 'success' })
   * - toast.success('mensaje')
   */
  const toast = (message, options = {}) => {
    return addToast({
      message,
      type: options.type || 'info',
      duration: options.duration ?? 5000,
    });
  };

  // Agregar métodos al objeto toast para soportar toast.success(), toast.error(), etc.
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
