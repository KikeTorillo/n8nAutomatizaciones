/**
 * ====================================================================
 * USE ARRAY ITEMS HOOK
 * ====================================================================
 * Hook reutilizable para manejo de arrays en editores de bloques.
 * Reduce duplicación del patrón: handleAgregar/handleEliminar/handleChange
 */

import { useCallback } from 'react';

/**
 * Hook para manejar arrays de items en editores de bloques
 * @param {Function} setForm - Función setState del formulario
 * @param {string} fieldName - Nombre del campo array en el formulario
 * @param {Object} defaultItem - Objeto por defecto para nuevos items
 * @returns {Object} - { handleAgregar, handleEliminar, handleChange, handleMover }
 */
export function useArrayItems(setForm, fieldName, defaultItem = {}) {
  /**
   * Agregar nuevo item al array
   */
  const handleAgregar = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), { ...defaultItem }],
    }));
  }, [setForm, fieldName, defaultItem]);

  /**
   * Eliminar item por índice
   * @param {number} index - Índice del item a eliminar
   */
  const handleEliminar = useCallback(
    (index) => {
      setForm((prev) => ({
        ...prev,
        [fieldName]: (prev[fieldName] || []).filter((_, i) => i !== index),
      }));
    },
    [setForm, fieldName]
  );

  /**
   * Cambiar campo de un item específico
   * @param {number} index - Índice del item
   * @param {string} campo - Nombre del campo a cambiar
   * @param {any} valor - Nuevo valor
   */
  const handleChange = useCallback(
    (index, campo, valor) => {
      setForm((prev) => {
        const items = [...(prev[fieldName] || [])];
        items[index] = { ...items[index], [campo]: valor };
        return { ...prev, [fieldName]: items };
      });
    },
    [setForm, fieldName]
  );

  /**
   * Mover item de una posición a otra
   * @param {number} fromIndex - Índice origen
   * @param {number} toIndex - Índice destino
   */
  const handleMover = useCallback(
    (fromIndex, toIndex) => {
      setForm((prev) => {
        const items = [...(prev[fieldName] || [])];
        const [removed] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, removed);
        return { ...prev, [fieldName]: items };
      });
    },
    [setForm, fieldName]
  );

  /**
   * Duplicar un item
   * @param {number} index - Índice del item a duplicar
   */
  const handleDuplicar = useCallback(
    (index) => {
      setForm((prev) => {
        const items = [...(prev[fieldName] || [])];
        const itemDuplicado = { ...items[index] };
        items.splice(index + 1, 0, itemDuplicado);
        return { ...prev, [fieldName]: items };
      });
    },
    [setForm, fieldName]
  );

  return {
    handleAgregar,
    handleEliminar,
    handleChange,
    handleMover,
    handleDuplicar,
  };
}

export default useArrayItems;
