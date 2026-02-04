/**
 * Hook para manejo de estado de formularios en tabs
 * Extrae patrón repetido de showForm/editingId/form en tabs de eventos-digitales
 *
 * Fecha creación: 3 Febrero 2026
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Hook genérico para manejo de estado de formularios en tabs
 * @param {Object} initialForm - Valores iniciales del formulario
 * @returns {Object} Estado y handlers del formulario
 *
 * @example
 * const {
 *   showForm, setShowForm,
 *   editingId, isEditing,
 *   form, setForm, updateField,
 *   handleNuevo, handleEditar, handleCancelar, resetForm
 * } = useTabFormState({
 *   nombre: '',
 *   tipo: 'producto',
 *   descripcion: ''
 * });
 */
export function useTabFormState(initialForm) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  // Indica si estamos editando un registro existente
  const isEditing = editingId !== null;

  /**
   * Resetea el formulario a valores iniciales
   */
  const resetForm = useCallback(() => {
    setForm(initialForm);
    setEditingId(null);
  }, [initialForm]);

  /**
   * Iniciar creación de nuevo registro
   */
  const handleNuevo = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  /**
   * Iniciar edición de registro existente
   * @param {Object} item - Registro a editar
   * @param {Function} mapper - Función opcional para mapear item a form
   */
  const handleEditar = useCallback((item, mapper = null) => {
    const formData = mapper ? mapper(item) : { ...item };
    setForm(formData);
    setEditingId(item.id);
    setShowForm(true);
  }, []);

  /**
   * Cancelar edición/creación
   */
  const handleCancelar = useCallback(() => {
    resetForm();
    setShowForm(false);
  }, [resetForm]);

  /**
   * Llamar después de guardar exitosamente
   */
  const handleGuardadoExitoso = useCallback(() => {
    resetForm();
    setShowForm(false);
  }, [resetForm]);

  /**
   * Actualizar un campo específico del formulario
   * @param {string} field - Nombre del campo
   * @param {*} value - Nuevo valor
   */
  const updateField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handler para onChange de inputs
   * @param {string} field - Nombre del campo
   * @returns {Function} Handler para onChange
   */
  const getFieldHandler = useCallback((field) => {
    return (e) => updateField(field, e.target.value);
  }, [updateField]);

  return useMemo(() => ({
    // Estado
    showForm,
    setShowForm,
    editingId,
    isEditing,
    form,
    setForm,

    // Handlers
    handleNuevo,
    handleEditar,
    handleCancelar,
    handleGuardadoExitoso,
    resetForm,
    updateField,
    getFieldHandler
  }), [
    showForm, editingId, isEditing, form,
    handleNuevo, handleEditar, handleCancelar, handleGuardadoExitoso,
    resetForm, updateField, getFieldHandler
  ]);
}

export default useTabFormState;
