import { useState, useCallback } from 'react';

/**
 * Hook para gestionar estado de modales/drawers de formularios
 * Simplifica el patrón común de crear/editar entidades
 *
 * @param {*} defaultData - Valor por defecto para data
 * @returns {Object} { isOpen, mode, data, openCreate, openEdit, close }
 *
 * @example
 * const { isOpen, mode, data, openCreate, openEdit, close } = useFormModal();
 *
 * // Abrir para crear
 * <Button onClick={openCreate}>Nuevo</Button>
 *
 * // Abrir para editar
 * <Button onClick={() => openEdit(item)}>Editar</Button>
 *
 * // Usar en Drawer
 * <FormDrawer
 *   isOpen={isOpen}
 *   onClose={close}
 *   mode={mode}
 *   entity={data}
 * />
 */
export function useFormModal(defaultData = null) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [data, setData] = useState(defaultData);

  /**
   * Abrir modal en modo crear
   */
  const openCreate = useCallback(() => {
    setMode('create');
    setData(null);
    setIsOpen(true);
  }, []);

  /**
   * Abrir modal en modo editar con datos
   * @param {*} editData - Datos de la entidad a editar
   */
  const openEdit = useCallback((editData) => {
    setMode('edit');
    setData(editData);
    setIsOpen(true);
  }, []);

  /**
   * Cerrar modal y limpiar datos después de animación
   */
  const close = useCallback(() => {
    setIsOpen(false);
    // Limpiar data después de la animación de cierre
    setTimeout(() => setData(null), 300);
  }, []);

  /**
   * Cerrar modal inmediatamente (sin delay)
   */
  const closeImmediate = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return {
    isOpen,
    mode,
    data,
    openCreate,
    openEdit,
    close,
    closeImmediate,
    // Alias para compatibilidad
    isEditing: mode === 'edit',
    isCreating: mode === 'create',
  };
}

export default useFormModal;
