/**
 * ====================================================================
 * USE EDITOR SHORTCUTS HOOK (GENERICO)
 * ====================================================================
 * Hook genérico para manejar atajos de teclado en editores.
 * No depende de ningún store específico - recibe todo como parámetros.
 *
 * Atajos disponibles:
 * - Ctrl+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z: Redo
 * - Ctrl+S: Guardar
 * - Ctrl+D: Duplicar bloque seleccionado
 * - Delete / Backspace: Eliminar bloque seleccionado
 * - Esc: Deseleccionar / Salir de inline editing
 * - Ctrl+A: Seleccionar todo (prevenido en canvas)
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useEffect, useCallback } from 'react';

/**
 * useEditorShortcuts - Hook genérico para atajos de teclado
 *
 * @param {Object} options - Opciones del hook
 * @param {boolean} options.enabled - Si los shortcuts están habilitados
 * @param {Function} options.onSave - Callback para guardar (Ctrl+S)
 * @param {Function} options.onDuplicate - Callback para duplicar (Ctrl+D) - recibe blockId
 * @param {Function} options.onDelete - Callback para eliminar (Delete/Backspace) - recibe blockId
 * @param {Function} options.onUndo - Callback para deshacer (Ctrl+Z)
 * @param {Function} options.onRedo - Callback para rehacer (Ctrl+Y / Ctrl+Shift+Z)
 * @param {Function} options.onEscape - Callback para Escape
 * @param {string|null} options.selectedBlockId - ID del bloque seleccionado
 * @param {string|null} options.inlineEditingBlockId - ID del bloque en edición inline
 * @param {Function} options.deseleccionarBloque - Función para deseleccionar bloque
 * @param {Function} options.desactivarInlineEditing - Función para desactivar inline editing
 * @returns {Object} - { shortcuts } Información sobre shortcuts para UI
 */
export function useEditorShortcuts({
  enabled = true,
  onSave,
  onDuplicate,
  onDelete,
  onUndo,
  onRedo,
  onEscape,
  selectedBlockId,
  inlineEditingBlockId,
  deseleccionarBloque,
  desactivarInlineEditing,
}) {
  /**
   * Verifica si el evento viene de un elemento editable
   */
  const isEditableTarget = useCallback((event) => {
    const target = event.target;
    const tagName = target.tagName?.toLowerCase();

    // Inputs y textareas normales
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return true;
    }

    // Elementos contenteditable
    if (target.isContentEditable) {
      return true;
    }

    // Verificar ancestros contenteditable
    if (target.closest('[contenteditable="true"]')) {
      return true;
    }

    return false;
  }, []);

  /**
   * Handler principal de teclas
   */
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      const { key, ctrlKey, metaKey, shiftKey } = event;
      const isModifier = ctrlKey || metaKey; // Soporta Cmd en Mac
      const isEditable = isEditableTarget(event);

      // ===== UNDO (Ctrl+Z) =====
      if (isModifier && key === 'z' && !shiftKey) {
        // Solo si no estamos en un input/textarea
        if (!isEditable && onUndo) {
          event.preventDefault();
          onUndo();
        }
        return;
      }

      // ===== REDO (Ctrl+Y o Ctrl+Shift+Z) =====
      if (
        (isModifier && key === 'y') ||
        (isModifier && key === 'z' && shiftKey)
      ) {
        if (!isEditable && onRedo) {
          event.preventDefault();
          onRedo();
        }
        return;
      }

      // ===== GUARDAR (Ctrl+S) =====
      if (isModifier && key === 's') {
        event.preventDefault();
        onSave?.();
        return;
      }

      // ===== DUPLICAR (Ctrl+D) =====
      if (isModifier && key === 'd') {
        if (!isEditable && selectedBlockId && onDuplicate) {
          event.preventDefault();
          onDuplicate(selectedBlockId);
        }
        return;
      }

      // ===== ELIMINAR (Delete/Backspace) =====
      if (key === 'Delete' || key === 'Backspace') {
        // Solo si no estamos editando texto y hay bloque seleccionado
        if (!isEditable && selectedBlockId && !inlineEditingBlockId && onDelete) {
          event.preventDefault();
          onDelete(selectedBlockId);
        }
        return;
      }

      // ===== ESCAPE =====
      if (key === 'Escape') {
        // Callback personalizado
        if (onEscape) {
          event.preventDefault();
          onEscape();
          return;
        }

        // Si estamos en inline editing, salir de él
        if (inlineEditingBlockId && desactivarInlineEditing) {
          event.preventDefault();
          desactivarInlineEditing();
          return;
        }

        // Si hay bloque seleccionado, deseleccionar
        if (selectedBlockId && deseleccionarBloque) {
          event.preventDefault();
          deseleccionarBloque();
          return;
        }
      }

      // ===== PREVENIR CTRL+A EN CANVAS =====
      if (isModifier && key === 'a' && !isEditable) {
        event.preventDefault();
        // Podría seleccionar todos los bloques en el futuro
        return;
      }
    },
    [
      enabled,
      selectedBlockId,
      inlineEditingBlockId,
      isEditableTarget,
      onSave,
      onDuplicate,
      onDelete,
      onUndo,
      onRedo,
      onEscape,
      deseleccionarBloque,
      desactivarInlineEditing,
    ]
  );

  /**
   * Registrar listener de teclas
   */
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    // Información sobre shortcuts para mostrar en UI
    shortcuts: [
      { key: 'Ctrl+Z', action: 'Deshacer' },
      { key: 'Ctrl+Y', action: 'Rehacer' },
      { key: 'Ctrl+S', action: 'Guardar' },
      { key: 'Ctrl+D', action: 'Duplicar' },
      { key: 'Delete', action: 'Eliminar' },
      { key: 'Esc', action: 'Deseleccionar' },
    ],
  };
}

/**
 * Componente para mostrar ayuda de shortcuts (opcional)
 */
export function ShortcutsHelp() {
  const { shortcuts } = useEditorShortcuts({ enabled: false });

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
      <p className="font-medium mb-2">Atajos de teclado:</p>
      {shortcuts.map(({ key, action }) => (
        <div key={key} className="flex justify-between gap-4">
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
            {key}
          </kbd>
          <span>{action}</span>
        </div>
      ))}
    </div>
  );
}

export default useEditorShortcuts;
