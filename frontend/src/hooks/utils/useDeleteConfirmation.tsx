import { useState, useCallback, useMemo } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { useToast } from './useToast';

/**
 * Hook para manejar confirmación de eliminación con patrón estandarizado.
 * Encapsula el estado del modal, la mutación y los mensajes toast.
 *
 * @param {Object} options - Opciones de configuración
 * @param {Object} options.deleteMutation - Mutación de TanStack Query (useEliminar*)
 * @param {string} options.entityName - Nombre de la entidad (ej: 'producto', 'categoría')
 * @param {Function} [options.getName] - Función para obtener el nombre del item (item => item.nombre)
 * @param {string} [options.successMessage] - Mensaje personalizado de éxito
 * @param {string} [options.errorMessage] - Mensaje personalizado de error
 * @param {string} [options.confirmTitle] - Título del modal (default: "Eliminar {entityName}")
 * @param {string} [options.confirmMessage] - Mensaje del modal (puede usar {name} como placeholder)
 * @param {string} [options.confirmText] - Texto del botón confirmar (default: "Eliminar")
 * @param {Function} [options.onSuccess] - Callback adicional tras éxito
 * @param {Function} [options.onError] - Callback adicional tras error
 * @param {Function} [options.renderChildren] - Función para renderizar contenido adicional en el modal
 *
 * @returns {Object} { confirmDelete, deleteConfirmProps, DeleteConfirmModal, isDeleting, itemToDelete }
 *
 * @example
 * // Patrón nuevo (preferido): spread de props en ConfirmDialog
 * const { confirmDelete, deleteConfirmProps } = useDeleteConfirmation({
 *   deleteMutation: useEliminarProducto(),
 *   entityName: 'producto',
 *   getName: (p) => p.nombre,
 * });
 * <ConfirmDialog {...deleteConfirmProps} />
 *
 * @example
 * // Patrón legacy: componente inline (deprecated)
 * const { confirmDelete, DeleteConfirmModal } = useDeleteConfirmation({...});
 * <DeleteConfirmModal />
 */
export function useDeleteConfirmation({
  deleteMutation,
  entityName,
  getName = (item) => item?.nombre || item?.name || 'este elemento',
  successMessage,
  errorMessage,
  confirmTitle,
  confirmMessage,
  confirmText = 'Eliminar',
  onSuccess,
  onError,
  renderChildren,
}) {
  const { success: showSuccess, error: showError } = useToast();
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Capitalizar primera letra del nombre de entidad
  const capitalizedEntity = useMemo(() => {
    return entityName.charAt(0).toUpperCase() + entityName.slice(1);
  }, [entityName]);

  // Abrir modal de confirmación
  const confirmDelete = useCallback((item) => {
    setItemToDelete(item);
    setIsOpen(true);
  }, []);

  // Cerrar modal
  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Delay para permitir animación de cierre
    setTimeout(() => setItemToDelete(null), 200);
  }, []);

  // Ejecutar eliminación
  const handleConfirm = useCallback(() => {
    if (!itemToDelete || !deleteMutation) return;

    const itemId = itemToDelete.id;
    const itemName = getName(itemToDelete);

    deleteMutation.mutate(itemId, {
      onSuccess: () => {
        showSuccess(successMessage || `${capitalizedEntity} eliminado correctamente`);
        closeModal();
        onSuccess?.(itemToDelete);
      },
      onError: (err) => {
        const mensaje = err.response?.data?.mensaje || err.message || errorMessage || `Error al eliminar ${entityName}`;
        showError(mensaje);
        onError?.(err, itemToDelete);
      },
    });
  }, [
    itemToDelete,
    deleteMutation,
    getName,
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

  // Mensaje por defecto con placeholder {name}
  const defaultMessage = `¿Estás seguro de que deseas eliminar ${entityName === 'el' || entityName.startsWith('el ') ? '' : (entityName.match(/^[aeiou]/i) ? 'la ' : 'el ')}${entityName} "{name}"? Esta acción no se puede deshacer.`;

  const finalMessage = useMemo(() => {
    const template = confirmMessage || defaultMessage;
    const name = itemToDelete ? getName(itemToDelete) : '';
    return template.replace('{name}', name);
  }, [confirmMessage, defaultMessage, itemToDelete, getName]);

  // Props para spread directo en <ConfirmDialog> (patrón preferido)
  const deleteConfirmProps = useMemo(() => ({
    isOpen,
    onClose: closeModal,
    onConfirm: handleConfirm,
    title: confirmTitle || `Eliminar ${capitalizedEntity}`,
    message: finalMessage,
    confirmText,
    variant: 'danger',
    isLoading: deleteMutation?.isPending ?? false,
    children: renderChildren ? renderChildren(itemToDelete) : undefined,
  }), [
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
  ]);

  /** @deprecated Usar deleteConfirmProps con <ConfirmDialog {...deleteConfirmProps} /> */
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
