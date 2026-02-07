/**
 * ====================================================================
 * USE BLOCK EDITOR HOOK (MEJORADO)
 * ====================================================================
 * Hook reutilizable para editores de bloques.
 * Soporta dos modos:
 * - Manual Save: Usado por Website (con cambios, handleSubmit, resetForm)
 * - Auto Save: Usado por Invitaciones (con onChange callback)
 *
 * @version 2.0.0 - Mejorado con soporte para estilos, autoSave, y array helpers
 * @since 2026-02-04
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { deepEqual } from './compareUtils';

/**
 * Hook para manejar el estado de un editor de bloque
 *
 * @param {Object} contenido - Contenido actual del bloque desde el servidor
 * @param {Object} defaultValues - Valores por defecto para inicializar el formulario
 * @param {Object} options - Opciones adicionales
 * @param {Object} options.estilos - Estilos del bloque (se mezclan con contenido)
 * @param {Function} options.onChange - Callback para auto-save (si se proporciona, activa modo autoSave)
 * @param {string} options.bloqueIdKey - Clave para detectar cambio de bloque (default: '_bloqueId')
 * @returns {Object} - { form, setForm, cambios, handleSubmit, handleFieldChange, resetForm, updateMultipleFields, array helpers... }
 */
export function useBlockEditor(contenido, defaultValues, options = {}) {
  const { estilos, onChange, bloqueIdKey = '_bloqueId' } = options;

  // Detectar modo por presencia de onChange
  const isAutoSaveMode = Boolean(onChange);

  // Ref para detectar cambio de bloque (evita reset mientras el usuario edita)
  const bloqueIdRef = useRef(null);
  // Ref para detectar cambios externos vs propios en autoSave
  const prevInitialFormRef = useRef(null);

  // Inicializar formulario mezclando contenido con defaults y estilos
  const initialForm = useMemo(() => {
    const merged = { ...defaultValues };

    // Aplicar contenido (sobrescribe defaults)
    if (contenido) {
      for (const key of Object.keys(contenido)) {
        const value = contenido[key];
        if (value !== undefined && value !== null) {
          merged[key] = value;
        }
      }
    }

    // Aplicar estilos (si se proporcionan)
    if (estilos) {
      for (const key of Object.keys(estilos)) {
        const value = estilos[key];
        if (value !== undefined && value !== null) {
          merged[key] = value;
        }
      }
    }

    return merged;
  }, [contenido, defaultValues, estilos]);

  const [form, setFormInternal] = useState(initialForm);
  const [cambios, setCambios] = useState(false);

  /**
   * Setter que propaga cambios automáticamente en modo autoSave
   * IMPORTANTE: onChange se llama DESPUÉS del setState usando queueMicrotask
   * para evitar loops infinitos
   */
  const setForm = useCallback(
    (updater) => {
      setFormInternal((prev) => {
        const newForm = typeof updater === 'function' ? updater(prev) : updater;

        // En modo autoSave, propagar cambios en el siguiente tick
        if (isAutoSaveMode && onChange) {
          queueMicrotask(() => {
            onChange(newForm);
          });
        }

        return newForm;
      });
    },
    [isAutoSaveMode, onChange]
  );

  // Detectar cambios comparando con el estado inicial (solo en modo manual)
  useEffect(() => {
    if (!isAutoSaveMode) {
      const hasChanges = !deepEqual(form, initialForm);
      setCambios(hasChanges);
    }
  }, [form, initialForm, isAutoSaveMode]);

  // Sincronizar cuando cambia el bloque seleccionado o hay cambios externos
  useEffect(() => {
    const currentId = contenido?.[bloqueIdKey];

    if (currentId && currentId !== bloqueIdRef.current) {
      // Cambió el bloque seleccionado, resetear formulario completo
      bloqueIdRef.current = currentId;
      prevInitialFormRef.current = initialForm;
      setFormInternal(initialForm);
    } else if (!isAutoSaveMode) {
      // Modo manual: sincronizar si cambió el contenido desde el servidor
      prevInitialFormRef.current = initialForm;
      setFormInternal((prev) => {
        if (!deepEqual(prev, initialForm)) {
          return initialForm;
        }
        return prev;
      });
    } else {
      // Modo autoSave: detectar cambios EXTERNOS (upload, Unsplash, etc.)
      // Comparar initialForm actual vs anterior para identificar qué campos cambiaron afuera
      const prevInitial = prevInitialFormRef.current;
      prevInitialFormRef.current = initialForm;

      setFormInternal((prev) => {
        if (deepEqual(prev, initialForm)) return prev;

        // Mergear solo campos que cambiaron externamente,
        // preservando ediciones locales del usuario en otros campos
        const merged = { ...prev };
        let hasExternalChanges = false;

        for (const key of Object.keys(initialForm)) {
          const wasChanged = !deepEqual(prevInitial?.[key], initialForm[key]);
          const differsFromForm = !deepEqual(prev[key], initialForm[key]);
          if (wasChanged && differsFromForm) {
            merged[key] = initialForm[key];
            hasExternalChanges = true;
          }
        }

        return hasExternalChanges ? merged : prev;
      });
    }
  }, [contenido?.[bloqueIdKey], initialForm, isAutoSaveMode, bloqueIdKey]);

  /**
   * Handler genérico para cambios de campo
   * @param {string} field - Nombre del campo
   * @param {any} value - Nuevo valor
   */
  const handleFieldChange = useCallback(
    (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [setForm]
  );

  /**
   * Actualizar múltiples campos a la vez
   * @param {Object} fields - Objeto con campos a actualizar
   */
  const updateMultipleFields = useCallback(
    (fields) => {
      setForm((prev) => ({ ...prev, ...fields }));
    },
    [setForm]
  );

  /**
   * Handler para submit del formulario (solo modo manual)
   * @param {Function} onGuardar - Función para guardar
   * @returns {Function} - Handler de evento
   */
  const handleSubmit = useCallback(
    (onGuardar) => (e) => {
      e.preventDefault();
      onGuardar(form);
      setCambios(false);
    },
    [form]
  );

  /**
   * Resetear formulario a valores iniciales
   */
  const resetForm = useCallback(() => {
    setFormInternal(initialForm);
    setCambios(false);
  }, [initialForm]);

  // ========== ARRAY ITEMS HELPERS ==========

  /**
   * Agregar item a un array
   * @param {string} fieldName - Nombre del campo array
   * @param {Object} defaultItem - Item por defecto
   */
  const handleArrayItemAdd = useCallback(
    (fieldName, defaultItem = {}) => {
      setForm((prev) => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), { ...defaultItem }],
      }));
    },
    [setForm]
  );

  /**
   * Eliminar item de un array
   * @param {string} fieldName - Nombre del campo array
   * @param {number} index - Índice del item
   */
  const handleArrayItemRemove = useCallback(
    (fieldName, index) => {
      setForm((prev) => ({
        ...prev,
        [fieldName]: (prev[fieldName] || []).filter((_, i) => i !== index),
      }));
    },
    [setForm]
  );

  /**
   * Cambiar campo de un item en un array
   * @param {string} fieldName - Nombre del campo array
   * @param {number} index - Índice del item
   * @param {string} itemField - Nombre del campo del item
   * @param {any} value - Nuevo valor
   */
  const handleArrayItemChange = useCallback(
    (fieldName, index, itemField, value) => {
      setForm((prev) => {
        const items = [...(prev[fieldName] || [])];
        items[index] = { ...items[index], [itemField]: value };
        return { ...prev, [fieldName]: items };
      });
    },
    [setForm]
  );

  /**
   * Reordenar items en un array
   * @param {string} fieldName - Nombre del campo array
   * @param {number} fromIndex - Índice origen
   * @param {number} toIndex - Índice destino
   */
  const handleArrayItemReorder = useCallback(
    (fieldName, fromIndex, toIndex) => {
      setForm((prev) => {
        const items = [...(prev[fieldName] || [])];
        const [removed] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, removed);
        return { ...prev, [fieldName]: items };
      });
    },
    [setForm]
  );

  return {
    // Estado
    form,
    setForm,
    cambios,

    // Handlers básicos
    handleFieldChange,
    updateMultipleFields,
    handleSubmit,
    resetForm,

    // Array helpers
    handleArrayItemAdd,
    handleArrayItemRemove,
    handleArrayItemChange,
    handleArrayItemReorder,
  };
}

export default useBlockEditor;
