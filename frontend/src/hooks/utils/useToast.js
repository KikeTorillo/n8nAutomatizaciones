import { create } from 'zustand';

/**
 * Store de Zustand para manejar toasts
 */
const useToastStore = create((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now() + Math.random();
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
   * Mostrar toast genérico
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones del toast
   * @param {('success'|'error'|'info'|'warning')} options.type - Tipo de toast
   * @param {number} options.duration - Duración en ms (0 = sin auto-cerrar)
   */
  const toast = (message, options = {}) => {
    return addToast({
      message,
      type: options.type || 'info',
      duration: options.duration !== undefined ? options.duration : 5000,
    });
  };

  /**
   * Mostrar toast de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones del toast
   */
  const success = (message, options = {}) => {
    return toast(message, { ...options, type: 'success' });
  };

  /**
   * Mostrar toast de error
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones del toast
   */
  const error = (message, options = {}) => {
    return toast(message, { ...options, type: 'error' });
  };

  /**
   * Mostrar toast de advertencia
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones del toast
   */
  const warning = (message, options = {}) => {
    return toast(message, { ...options, type: 'warning' });
  };

  /**
   * Mostrar toast de información
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones del toast
   */
  const info = (message, options = {}) => {
    return toast(message, { ...options, type: 'info' });
  };

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
