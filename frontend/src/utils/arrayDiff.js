/**
 * Obtiene la diferencia entre dos arrays
 * Útil para comparar estados actuales vs actualizados (ej: profesionales asignados a un servicio)
 *
 * @param {Array} current - Array actual
 * @param {Array} updated - Array actualizado
 * @returns {Object} { toAdd, toRemove, hasChanges }
 *
 * @example
 * const current = [1, 2, 3];
 * const updated = [2, 3, 4, 5];
 * const { toAdd, toRemove, hasChanges } = getArrayDiff(current, updated);
 * // toAdd: [4, 5]
 * // toRemove: [1]
 * // hasChanges: true
 */
export const getArrayDiff = (current, updated) => {
  const toAdd = updated.filter(id => !current.includes(id));
  const toRemove = current.filter(id => !updated.includes(id));

  return {
    toAdd,
    toRemove,
    hasChanges: toAdd.length > 0 || toRemove.length > 0
  };
};
