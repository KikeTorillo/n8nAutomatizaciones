import { useState, useCallback, useMemo, type ChangeEvent } from 'react';

interface TabFormStateReturn<T extends Record<string, unknown>> {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingId: string | number | null;
  isEditing: boolean;
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  handleNuevo: () => void;
  handleEditar: (item: Record<string, unknown>, mapper?: ((item: Record<string, unknown>) => T) | null) => void;
  handleCancelar: () => void;
  handleGuardadoExitoso: () => void;
  resetForm: () => void;
  updateField: (field: string, value: unknown) => void;
  getFieldHandler: (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

/**
 * Hook genérico para manejo de estado de formularios en tabs
 */
export function useTabFormState<T extends Record<string, unknown>>(initialForm: T): TabFormStateReturn<T> {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState<T>(initialForm);

  const isEditing = editingId !== null;

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setEditingId(null);
  }, [initialForm]);

  const handleNuevo = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const handleEditar = useCallback((item: Record<string, unknown>, mapper: ((item: Record<string, unknown>) => T) | null = null) => {
    const formData = mapper ? mapper(item) : { ...item } as T;
    setForm(formData);
    setEditingId(item.id as string | number);
    setShowForm(true);
  }, []);

  const handleCancelar = useCallback(() => {
    resetForm();
    setShowForm(false);
  }, [resetForm]);

  const handleGuardadoExitoso = useCallback(() => {
    resetForm();
    setShowForm(false);
  }, [resetForm]);

  const updateField = useCallback((field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const getFieldHandler = useCallback((field: string) => {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => updateField(field, e.target.value);
  }, [updateField]);

  return useMemo(() => ({
    showForm,
    setShowForm,
    editingId,
    isEditing,
    form,
    setForm,
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
