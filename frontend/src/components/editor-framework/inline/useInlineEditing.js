/**
 * ====================================================================
 * USE INLINE EDITING HOOK
 * ====================================================================
 * Hook centralizado para manejar edición inline en editores de bloques.
 * Abstrae la conexión con el store y proporciona utilidades.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useCallback, useMemo } from 'react';

/**
 * Hook para manejar edición inline de bloques
 *
 * @param {Object} options
 * @param {Function} options.useStore - Hook del store de Zustand
 * @returns {Object} Utilidades de edición inline
 *
 * @example
 * const { bloqueEditandoInline, activarEdicion, isEditando } = useInlineEditing({
 *   useStore: useInvitacionEditorStore,
 * });
 *
 * // En el canvas
 * isEditing={isEditando(bloque.id)}
 * onDoubleClick={() => activarEdicion(bloque.id)}
 */
export function useInlineEditing({ useStore }) {
  // Selectores del store - soporta ambas APIs (Website y Invitaciones)
  const bloqueEditandoInline = useStore((s) => s.bloqueEditandoInline);

  // Función para activar edición (compatibilidad con ambos stores)
  const activarEdicionFromStore = useStore((s) =>
    s.activarInlineEditing || s.activarEdicionInline
  );

  // Función para desactivar edición (compatibilidad con ambos stores)
  const desactivarEdicionFromStore = useStore((s) =>
    s.desactivarInlineEditing || s.desactivarEdicionInline
  );

  /**
   * Activa la edición inline para un bloque
   */
  const activarEdicion = useCallback(
    (bloqueId) => {
      activarEdicionFromStore?.(bloqueId);
    },
    [activarEdicionFromStore]
  );

  /**
   * Desactiva la edición inline
   */
  const desactivarEdicion = useCallback(() => {
    desactivarEdicionFromStore?.();
  }, [desactivarEdicionFromStore]);

  /**
   * Verifica si un bloque específico está en modo edición
   */
  const isEditando = useCallback(
    (bloqueId) => bloqueEditandoInline === bloqueId,
    [bloqueEditandoInline]
  );

  return useMemo(
    () => ({
      bloqueEditandoInline,
      activarEdicion,
      desactivarEdicion,
      isEditando,
    }),
    [bloqueEditandoInline, activarEdicion, desactivarEdicion, isEditando]
  );
}

export default useInlineEditing;
