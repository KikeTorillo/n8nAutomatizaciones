import { useState, useCallback } from 'react';
import { useModalManager } from './useModalManager';
import { useToast } from './useToast';

/**
 * Hook reutilizable para operaciones CRUD con modales
 * Elimina código duplicado en páginas de listado con formularios drawer/modal
 *
 * @param {Object} options - Opciones de configuración
 * @param {Object} options.deleteMutation - Mutation de TanStack Query para eliminar
 * @param {Function} [options.getDeleteId] - Función para extraer ID del item a eliminar (default: item => item.id)
 * @param {Object} [options.deleteParams] - Parámetros adicionales para la mutation de delete
 * @param {string} [options.entityName] - Nombre de la entidad para mensajes (ej: 'producto', 'combo')
 * @param {Object} [options.messages] - Mensajes personalizados { deleteSuccess, deleteError }
 * @param {Object} [options.modals] - Configuración inicial de modales (default: { form, delete })
 * @returns {Object} Handlers y estado para CRUD
 *
 * @example
 * const {
 *   openModal, closeModal, isOpen, getModalData,
 *   handleNuevo, handleEditar, handleEliminar, confirmarEliminar,
 *   drawerKey, handleDrawerSuccess
 * } = useCrudHandlers({
 *   deleteMutation: eliminarMutation,
 *   getDeleteId: (item) => item.producto_id,
 *   deleteParams: { sucursalId: sucursalActiva?.id },
 *   entityName: 'combo',
 * });
 */
export function useCrudHandlers(options = {}) {
  const {
    deleteMutation,
    getDeleteId = (item) => item?.id,
    deleteParams = {},
    entityName = 'elemento',
    messages = {},
    modals = {
      form: { isOpen: false, data: null },
      delete: { isOpen: false, data: null },
    },
  } = options;

  const toast = useToast();
  const [drawerKey, setDrawerKey] = useState(0);

  // Modal manager
  const {
    openModal,
    closeModal,
    isOpen,
    getModalData,
    transitionModal,
  } = useModalManager(modals);

  // Incrementar drawerKey para forzar reset del drawer
  const resetDrawer = useCallback(() => {
    setDrawerKey((k) => k + 1);
  }, []);

  // Handler para crear nuevo
  const handleNuevo = useCallback(() => {
    resetDrawer();
    openModal('form', null);
  }, [resetDrawer, openModal]);

  // Handler para editar existente
  const handleEditar = useCallback((item) => {
    resetDrawer();
    openModal('form', item);
  }, [resetDrawer, openModal]);

  // Handler para abrir confirmación de eliminar
  const handleEliminar = useCallback((item) => {
    openModal('delete', item);
  }, [openModal]);

  // Confirmar y ejecutar eliminación
  const confirmarEliminar = useCallback(async () => {
    const deleteData = getModalData('delete');
    if (!deleteData || !deleteMutation) return;

    try {
      const id = getDeleteId(deleteData);
      const params = typeof deleteParams === 'function'
        ? deleteParams(deleteData)
        : { ...deleteParams };

      // Si getDeleteId retorna un objeto, usarlo directamente
      const mutationParams = typeof id === 'object' ? id : { id, ...params };

      await deleteMutation.mutateAsync(mutationParams);
      toast.success(messages.deleteSuccess || `${capitalize(entityName)} eliminado`);
      closeModal('delete');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        messages.deleteError ||
        `Error al eliminar ${entityName}`
      );
    }
  }, [
    getModalData,
    deleteMutation,
    getDeleteId,
    deleteParams,
    entityName,
    messages,
    toast,
    closeModal,
  ]);

  // Handler para éxito del drawer/formulario
  const handleDrawerSuccess = useCallback(() => {
    closeModal('form');
  }, [closeModal]);

  // Handler para cerrar drawer
  const handleDrawerClose = useCallback(() => {
    closeModal('form');
  }, [closeModal]);

  return {
    // Modal manager exports
    openModal,
    closeModal,
    isOpen,
    getModalData,
    transitionModal,

    // CRUD handlers
    handleNuevo,
    handleEditar,
    handleEliminar,
    confirmarEliminar,

    // Drawer management
    drawerKey,
    resetDrawer,
    handleDrawerSuccess,
    handleDrawerClose,

    // Helpers
    isDeleting: deleteMutation?.isPending || false,
    formData: getModalData('form'),
    deleteData: getModalData('delete'),
    isFormOpen: isOpen('form'),
    isDeleteOpen: isOpen('delete'),
  };
}

// Helper para capitalizar primera letra
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default useCrudHandlers;
