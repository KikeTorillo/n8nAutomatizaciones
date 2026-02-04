/**
 * ====================================================================
 * USE INVITACION BLOCK EDITOR HOOK
 * ====================================================================
 * Wrapper de compatibilidad para el hook genérico useBlockEditor del framework.
 * Mantiene la misma API que el hook original para evitar romper editores existentes.
 *
 * @version 2.0.0 - Ahora usa useBlockEditor del framework internamente
 * @since 2026-02-04
 */

import { useBlockEditor } from '@/components/editor-framework';

/**
 * useInvitacionBlockEditor - Hook para editores con guardado automático
 *
 * @param {Object} contenido - Contenido actual del bloque
 * @param {Object} estilos - Estilos del bloque
 * @param {Object} defaultValues - Valores por defecto
 * @param {Function} onChange - Callback que se llama en cada cambio
 * @returns {Object} - { form, setForm, handleFieldChange, updateMultipleFields, array helpers... }
 */
export function useInvitacionBlockEditor(contenido, estilos, defaultValues, onChange) {
  // Usar el hook genérico del framework con los parámetros adaptados
  return useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange,
    bloqueIdKey: '_bloqueId',
  });
}

export default useInvitacionBlockEditor;
