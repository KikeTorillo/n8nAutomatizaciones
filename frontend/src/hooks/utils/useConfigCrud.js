import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useModalManager } from './useModalManager';
import { useToast } from './useToast';

/**
 * @deprecated Usar la combinación de hooks especializados:
 * - useFormDrawer (modal + form + mutations)
 * - useFilters (búsqueda y filtros)
 * - useDeleteConfirmation (confirmación de eliminación)
 *
 * Este hook combina demasiadas responsabilidades en uno solo.
 *
 * useConfigCrud - Hook genérico para centralizar lógica CRUD en páginas de configuración
 *
 * Reduce boilerplate de handlers, filtrado, modales y forms en páginas CRUD simples.
 *
 * @param {Object} options
 * @param {Array} options.items - Lista de items (data de la query)
 * @param {Object} options.defaultValues - Valores por defecto del formulario
 * @param {Object} [options.schema] - Schema Zod para validación (opcional)
 * @param {Object} options.createMutation - Mutation de TanStack Query para crear
 * @param {Object} options.updateMutation - Mutation de TanStack Query para actualizar
 * @param {Object} options.deleteMutation - Mutation de TanStack Query para eliminar
 * @param {function} [options.filterFn] - Función custom de filtrado (item, { searchTerm, filters }) => boolean
 * @param {string} [options.searchField="nombre"] - Campo por defecto para búsqueda
 * @param {Object} [options.toastMessages] - Mensajes personalizados { created, updated, deleted }
 * @param {function} [options.preparePayload] - Función para preparar datos antes de enviar (data) => payload
 * @param {function} [options.prepareEditValues] - Función para preparar valores al editar (item) => formValues
 *
 * @returns {Object}
 */
export function useConfigCrud({
  items = [],
  defaultValues = {},
  schema,
  createMutation,
  updateMutation,
  deleteMutation,
  filterFn,
  searchField = 'nombre',
  toastMessages = {},
  preparePayload,
  prepareEditValues,
}) {
  const toast = useToast();

  // Estado de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  // Modal manager con estados form y delete
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
  });

  // React Hook Form con resolver opcional
  const formOptions = {
    defaultValues,
    ...(schema && { resolver: zodResolver(schema) }),
  };

  const form = useForm(formOptions);
  const { reset, handleSubmit, formState: { errors } } = form;

  // Mensajes de toast con defaults
  const messages = {
    created: toastMessages.created || 'Registro creado',
    updated: toastMessages.updated || 'Registro actualizado',
    deleted: toastMessages.deleted || 'Registro eliminado',
    createError: toastMessages.createError || 'Error al crear',
    updateError: toastMessages.updateError || 'Error al actualizar',
    deleteError: toastMessages.deleteError || 'Error al eliminar',
  };

  // Función para actualizar un filtro específico
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Filtrar items
  const filteredItems = useMemo(() => {
    let result = items;

    // Si hay filterFn custom, usarla
    if (filterFn) {
      result = result.filter(item => filterFn(item, { searchTerm, filters }));
    } else {
      // Filtrado por defecto: searchTerm en searchField
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(item =>
          item[searchField]?.toLowerCase().includes(term)
        );
      }

      // Aplicar filtros adicionales
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          result = result.filter(item => item[key] === value);
        }
      });
    }

    return result;
  }, [items, searchTerm, filters, filterFn, searchField]);

  // Handler: Abrir drawer para crear nuevo
  const handleNew = useCallback((extraDefaults = {}) => {
    reset({
      ...defaultValues,
      ...extraDefaults,
    });
    openModal('form', null);
  }, [reset, defaultValues, openModal]);

  // Handler: Abrir drawer para editar
  const handleEdit = useCallback((item) => {
    const values = prepareEditValues
      ? prepareEditValues(item)
      : { ...defaultValues, ...item };

    reset(values);
    openModal('form', item);
  }, [reset, defaultValues, prepareEditValues, openModal]);

  // Handler: Abrir confirmación de eliminar
  const handleDelete = useCallback((item) => {
    openModal('delete', item);
  }, [openModal]);

  // Handler: Submit del formulario
  const onSubmit = useCallback(async (data) => {
    const editingItem = getModalData('form');
    const payload = preparePayload ? preparePayload(data) : data;

    try {
      if (editingItem) {
        // Modo edición
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: payload,
        });
        toast.success(messages.updated);
      } else {
        // Modo creación
        await createMutation.mutateAsync(payload);
        toast.success(messages.created);
      }

      closeModal('form');
      reset(defaultValues);
    } catch (err) {
      const errorMsg = err.message || (editingItem ? messages.updateError : messages.createError);
      toast.error(errorMsg);
    }
  }, [
    getModalData,
    preparePayload,
    updateMutation,
    createMutation,
    toast,
    messages,
    closeModal,
    reset,
    defaultValues,
  ]);

  // Handler: Confirmar eliminación
  const confirmDelete = useCallback(async () => {
    const deleteItem = getModalData('delete');
    if (!deleteItem) return;

    try {
      await deleteMutation.mutateAsync(deleteItem.id);
      toast.success(messages.deleted);
      closeModal('delete');
    } catch (err) {
      toast.error(err.message || messages.deleteError);
    }
  }, [getModalData, deleteMutation, toast, messages, closeModal]);

  // Estado de loading combinado
  const isSubmitting = createMutation?.isPending || updateMutation?.isPending;
  const isDeleting = deleteMutation?.isPending;

  // Datos del item que se está editando
  const editingItem = getModalData('form');
  const deletingItem = getModalData('delete');

  return {
    // Estado de búsqueda/filtros
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    setFilters,
    filteredItems,

    // Modal management
    isOpen,
    openModal,
    closeModal,
    getModalData,

    // CRUD handlers
    handleNew,
    handleEdit,
    handleDelete,
    confirmDelete,

    // Form
    form, // Objeto completo de react-hook-form (register, watch, setValue, etc.)
    handleSubmit: handleSubmit(onSubmit),
    onSubmit,
    errors,
    reset,

    // Estado
    isSubmitting,
    isDeleting,
    isEditing: !!editingItem,
    editingItem,
    deletingItem,
  };
}

export default useConfigCrud;
