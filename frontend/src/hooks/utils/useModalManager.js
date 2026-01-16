import { useState, useCallback, useMemo } from 'react';

/**
 * useModalManager - Hook para gestionar múltiples modales de forma organizada
 *
 * Reduce el boilerplate de múltiples useState para modales en páginas complejas.
 *
 * @param {Object} initialState - Estado inicial con claves para cada modal
 * @returns {Object} - Objeto con estado y funciones de control
 *
 * @example
 * const { modals, openModal, closeModal, closeAll, isOpen, getModalData } = useModalManager({
 *   detalles: { isOpen: false, data: null },
 *   formulario: { isOpen: false, data: null, mode: 'create' },
 *   cancelar: { isOpen: false, data: null },
 *   completar: { isOpen: false, data: null },
 * });
 *
 * // Abrir modal
 * openModal('detalles', { cita });
 *
 * // Cerrar modal
 * closeModal('detalles');
 *
 * // Verificar si está abierto
 * if (isOpen('detalles')) { ... }
 *
 * // Obtener datos del modal
 * const { cita } = getModalData('detalles');
 */
export function useModalManager(initialState = {}) {
  // Normalizar estado inicial
  const normalizedInitial = useMemo(() => {
    const normalized = {};
    Object.keys(initialState).forEach((key) => {
      const value = initialState[key];
      normalized[key] = {
        isOpen: value?.isOpen ?? false,
        data: value?.data ?? null,
        ...value,
      };
    });
    return normalized;
  }, []); // Solo se ejecuta una vez

  const [modals, setModals] = useState(normalizedInitial);

  /**
   * Abrir un modal con datos opcionales
   * @param {string} modalKey - Clave del modal
   * @param {Object} data - Datos a pasar al modal
   * @param {Object} extraProps - Props adicionales (ej: mode, fechaPreseleccionada)
   */
  const openModal = useCallback((modalKey, data = null, extraProps = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalKey]: {
        ...prev[modalKey],
        isOpen: true,
        data,
        ...extraProps,
      },
    }));
  }, []);

  /**
   * Cerrar un modal y opcionalmente limpiar sus datos
   * @param {string} modalKey - Clave del modal
   * @param {boolean} clearData - Si se deben limpiar los datos (default: true)
   */
  const closeModal = useCallback((modalKey, clearData = true) => {
    setModals((prev) => ({
      ...prev,
      [modalKey]: {
        ...prev[modalKey],
        isOpen: false,
        ...(clearData ? { data: null } : {}),
      },
    }));
  }, []);

  /**
   * Cerrar todos los modales
   */
  const closeAll = useCallback(() => {
    setModals((prev) => {
      const closed = {};
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

  /**
   * Verificar si un modal está abierto
   * @param {string} modalKey - Clave del modal
   * @returns {boolean}
   */
  const isOpen = useCallback(
    (modalKey) => {
      return modals[modalKey]?.isOpen ?? false;
    },
    [modals]
  );

  /**
   * Obtener los datos de un modal
   * @param {string} modalKey - Clave del modal
   * @returns {any}
   */
  const getModalData = useCallback(
    (modalKey) => {
      return modals[modalKey]?.data ?? null;
    },
    [modals]
  );

  /**
   * Obtener todas las props de un modal
   * @param {string} modalKey - Clave del modal
   * @returns {Object}
   */
  const getModalProps = useCallback(
    (modalKey) => {
      return modals[modalKey] ?? { isOpen: false, data: null };
    },
    [modals]
  );

  /**
   * Actualizar props de un modal sin cambiar su estado abierto/cerrado
   * @param {string} modalKey - Clave del modal
   * @param {Object} updates - Props a actualizar
   */
  const updateModal = useCallback((modalKey, updates) => {
    setModals((prev) => ({
      ...prev,
      [modalKey]: {
        ...prev[modalKey],
        ...updates,
      },
    }));
  }, []);

  /**
   * Transición suave entre modales (cierra uno y abre otro con delay)
   * @param {string} fromModal - Modal a cerrar
   * @param {string} toModal - Modal a abrir
   * @param {Object} data - Datos para el nuevo modal
   * @param {number} delay - Delay en ms (default: 300)
   */
  const transitionModal = useCallback(
    (fromModal, toModal, data = null, delay = 300) => {
      closeModal(fromModal, false); // No limpiar datos aún
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

/**
 * useSimpleModal - Hook simplificado para un solo modal
 *
 * @param {any} initialData - Datos iniciales del modal
 * @returns {Object}
 *
 * @example
 * const { isOpen, data, open, close, toggle } = useSimpleModal();
 *
 * <Button onClick={() => open(cita)}>Ver</Button>
 * <Modal isOpen={isOpen} onClose={close}>
 *   <CitaDetail cita={data} />
 * </Modal>
 */
export function useSimpleModal(initialData = null) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(initialData);

  const open = useCallback((newData = null) => {
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
