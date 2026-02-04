/**
 * ====================================================================
 * USE INVITACION BLOCK EDITOR HOOK
 * ====================================================================
 * Hook para editores de bloques de invitaciones con guardado automático.
 *
 * IMPORTANTE: Este hook corrige el bug de useAutoSaveEditor.
 * La diferencia clave es que onChange se llama DESPUÉS de setState,
 * no dentro del callback de setState (lo cual causaba loops infinitos).
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * useInvitacionBlockEditor - Hook para editores con guardado automático
 *
 * @param {Object} contenido - Contenido actual del bloque
 * @param {Object} estilos - Estilos del bloque
 * @param {Object} defaultValues - Valores por defecto
 * @param {Function} onChange - Callback que se llama en cada cambio
 * @returns {Object} - { form, setForm, handleFieldChange, updateMultipleFields, handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange }
 */
export function useInvitacionBlockEditor(contenido, estilos, defaultValues, onChange) {
  // ID del bloque para detectar cambios de selección
  const bloqueIdRef = useRef(null);

  // Combinar defaults + contenido + estilos (solo calcular una vez por bloque)
  const initialForm = useMemo(() => {
    const merged = { ...defaultValues };

    // Aplicar contenido (sobrescribe defaults)
    if (contenido) {
      for (const key of Object.keys(contenido)) {
        if (contenido[key] !== undefined && contenido[key] !== null) {
          merged[key] = contenido[key];
        }
      }
    }

    // Aplicar estilos
    if (estilos) {
      for (const key of Object.keys(estilos)) {
        if (estilos[key] !== undefined && estilos[key] !== null) {
          merged[key] = estilos[key];
        }
      }
    }

    return merged;
  }, [contenido, estilos, defaultValues]);

  const [form, setFormInternal] = useState(initialForm);

  // Sincronizar SOLO cuando cambia la selección de bloque (contenido._bloqueId)
  // NO cuando cambia el contenido (eso causaría reset mientras el usuario edita)
  useEffect(() => {
    const currentId = contenido?._bloqueId;
    if (currentId && currentId !== bloqueIdRef.current) {
      bloqueIdRef.current = currentId;
      setFormInternal(initialForm);
    }
  }, [contenido?._bloqueId, initialForm]);

  /**
   * Setter que propaga cambios automáticamente
   * IMPORTANTE: onChange se llama DESPUÉS del setState, no dentro
   */
  const setForm = useCallback(
    (updater) => {
      setFormInternal((prev) => {
        const newForm = typeof updater === 'function' ? updater(prev) : updater;
        // Programar la propagación en el siguiente tick para evitar loops
        // (el setState ya habrá terminado cuando onChange se ejecute)
        // NOTA: Enviamos newForm directamente porque actualizarBloqueLocal
        // ya hace el merge con b.contenido internamente
        queueMicrotask(() => {
          onChange?.(newForm);
        });
        return newForm;
      });
    },
    [onChange]
  );

  /**
   * Handler genérico para cambios de campo
   */
  const handleFieldChange = useCallback(
    (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [setForm]
  );

  /**
   * Actualizar múltiples campos a la vez
   */
  const updateMultipleFields = useCallback(
    (fields) => {
      setForm((prev) => ({ ...prev, ...fields }));
    },
    [setForm]
  );

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
    form,
    setForm,
    handleFieldChange,
    updateMultipleFields,
    // Array helpers
    handleArrayItemAdd,
    handleArrayItemRemove,
    handleArrayItemChange,
    handleArrayItemReorder,
  };
}

export default useInvitacionBlockEditor;
