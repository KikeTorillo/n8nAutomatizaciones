/**
 * ====================================================================
 * USE ARRAY ITEM HANDLERS
 * ====================================================================
 * Hook que wrappea los métodos de array de useBlockEditor para
 * un campo específico. Elimina el boilerplate de crear 3 useCallbacks
 * idénticos en cada editor que maneja arrays.
 *
 * Uso:
 *   const { handleAgregar, handleEliminar, handleChange } =
 *     useArrayItemHandlers({ handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange }, 'items', defaultItem);
 */

import { useCallback } from 'react';

/**
 * @param {Object} arrayMethods - { handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange } de useBlockEditor
 * @param {string} fieldName - Nombre del campo array (ej: 'items')
 * @param {Object} defaultItem - Objeto por defecto para nuevos items
 * @returns {{ handleAgregar: Function, handleEliminar: Function, handleChange: Function }}
 */
export function useArrayItemHandlers(arrayMethods, fieldName, defaultItem) {
  const { handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange } = arrayMethods;

  const handleAgregar = useCallback(() => {
    handleArrayItemAdd(fieldName, defaultItem);
  }, [handleArrayItemAdd, fieldName, defaultItem]);

  const handleEliminar = useCallback((index) => {
    handleArrayItemRemove(fieldName, index);
  }, [handleArrayItemRemove, fieldName]);

  const handleChange = useCallback((index, campo, valor) => {
    handleArrayItemChange(fieldName, index, campo, valor);
  }, [handleArrayItemChange, fieldName]);

  return { handleAgregar, handleEliminar, handleChange };
}
