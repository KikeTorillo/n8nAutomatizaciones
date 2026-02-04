/**
 * ====================================================================
 * USE COMMON BLOCK EDITOR HOOK
 * ====================================================================
 * Hook unificado para bloques comunes compartidos entre editores.
 * Detecta automáticamente el modo (autoSave vs manualSave) por parámetros.
 *
 * Modo autoSave: Si se proporciona `onChange`, los cambios se propagan automáticamente.
 * Modo manualSave: Si se proporciona `onGuardar`, requiere submit manual.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useBlockEditor } from '../../hooks';

/**
 * useCommonBlockEditor - Hook unificado para bloques comunes
 *
 * @param {Object} contenido - Contenido actual del bloque
 * @param {Object} config - Configuración del hook
 * @param {Object} config.defaultValues - Valores por defecto
 * @param {Object} config.estilos - Estilos del bloque (solo autoSave mode)
 * @param {Function} config.onChange - Callback para autoSave mode
 * @param {Function} config.onGuardar - Callback para manualSave mode
 * @param {string} config.bloqueIdKey - Clave para detectar cambio de bloque (default: '_bloqueId')
 * @returns {Object} - { form, setForm, handleFieldChange, handleSubmit, cambios, resetForm, array helpers... }
 */
export function useCommonBlockEditor(contenido, config = {}) {
  const {
    defaultValues = {},
    estilos,
    onChange,
    onGuardar,
    bloqueIdKey = '_bloqueId',
  } = config;

  // Detectar modo por parámetros
  const isAutoSaveMode = Boolean(onChange);

  // Usar el hook base del framework
  const editor = useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange: isAutoSaveMode ? onChange : undefined,
    bloqueIdKey,
  });

  // Si es modo manual, envolver handleSubmit con el callback correcto
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onGuardar) {
      onGuardar(editor.form);
      editor.resetForm();
    }
  };

  return {
    // Estado
    form: editor.form,
    setForm: editor.setForm,
    cambios: editor.cambios,

    // Handlers básicos
    handleFieldChange: editor.handleFieldChange,
    updateMultipleFields: editor.updateMultipleFields,
    resetForm: editor.resetForm,

    // Submit (solo modo manual)
    handleSubmit,

    // Array helpers (ambos modos)
    handleArrayItemAdd: editor.handleArrayItemAdd,
    handleArrayItemRemove: editor.handleArrayItemRemove,
    handleArrayItemChange: editor.handleArrayItemChange,
    handleArrayItemReorder: editor.handleArrayItemReorder,

    // Info del modo
    isAutoSaveMode,
  };
}

export default useCommonBlockEditor;
