/**
 * ====================================================================
 * USE BLOCK SELECTION
 * ====================================================================
 * Hook para manejar la selección de bloques y apertura de propiedades.
 * Centraliza la lógica que ambos editores (Website e Invitaciones) comparten.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useCallback } from 'react';

/**
 * Hook para manejar la selección de bloques y apertura de propiedades.
 *
 * Soluciona el bug donde:
 * 1. Seleccionas un bloque → Panel de propiedades aparece ✅
 * 2. Cierras el panel (X)
 * 3. Click en el **mismo** bloque → Panel **NO** se abre ❌
 *
 * Al combinar selección + apertura en un solo handler, garantizamos
 * que el panel siempre se abra al hacer click en cualquier bloque.
 *
 * @param {Object} options
 * @param {Function} options.seleccionarBloque - Función del store para seleccionar bloque
 * @param {Function} options.abrirPropiedades - Función para abrir panel de propiedades (opcional)
 * @returns {Object} - { handleBloqueClick }
 *
 * @example
 * const { handleBloqueClick } = useBlockSelection({
 *   seleccionarBloque,
 *   abrirPropiedades,
 * });
 *
 * // En el JSX:
 * <Block onClick={() => handleBloqueClick(bloque.id)} />
 */
export function useBlockSelection({ seleccionarBloque, abrirPropiedades }) {
  const handleBloqueClick = useCallback(
    (id) => {
      seleccionarBloque(id);
      abrirPropiedades?.();
    },
    [seleccionarBloque, abrirPropiedades]
  );

  return { handleBloqueClick };
}

export default useBlockSelection;
