/**
 * ====================================================================
 * USE EDITOR SHORTCUTS HOOK
 * ====================================================================
 * Maneja los atajos de teclado del editor de website.
 */

import { useEffect, useCallback } from 'react';
import { useWebsiteEditorStore, useTemporalStore } from '@/store';

/**
 * Atajos disponibles:
 * - Ctrl+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z: Redo
 * - Ctrl+S: Guardar
 * - Ctrl+D: Duplicar bloque seleccionado
 * - Delete / Backspace: Eliminar bloque seleccionado
 * - Esc: Deseleccionar / Salir de inline editing
 * - Ctrl+A: Seleccionar todo (prevenido en canvas)
 */

/**
 * Hook para atajos de teclado del editor
 * @param {Object} options - Opciones
 * @param {Function} options.onSave - Callback para guardar
 * @param {Function} options.onDuplicate - Callback para duplicar
 * @param {Function} options.onDelete - Callback para eliminar
 * @param {boolean} options.enabled - Si los shortcuts están habilitados
 */
export function useEditorShortcuts({
  onSave,
  onDuplicate,
  onDelete,
  enabled = true,
}) {
  // Acceso al store
  const bloqueSeleccionado = useWebsiteEditorStore(
    (state) => state.bloqueSeleccionado
  );
  const bloqueEditandoInline = useWebsiteEditorStore(
    (state) => state.bloqueEditandoInline
  );
  const deseleccionarBloque = useWebsiteEditorStore(
    (state) => state.deseleccionarBloque
  );
  const desactivarInlineEditing = useWebsiteEditorStore(
    (state) => state.desactivarInlineEditing
  );

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
        if (!isEditable) {
          event.preventDefault();
          const temporal = useTemporalStore();
          if (temporal.pastStates?.length > 0) {
            temporal.undo();
          }
        }
        return;
      }

      // ===== REDO (Ctrl+Y o Ctrl+Shift+Z) =====
      if (
        (isModifier && key === 'y') ||
        (isModifier && key === 'z' && shiftKey)
      ) {
        if (!isEditable) {
          event.preventDefault();
          const temporal = useTemporalStore();
          if (temporal.futureStates?.length > 0) {
            temporal.redo();
          }
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
        if (!isEditable && bloqueSeleccionado) {
          event.preventDefault();
          onDuplicate?.(bloqueSeleccionado);
        }
        return;
      }

      // ===== ELIMINAR (Delete/Backspace) =====
      if (key === 'Delete' || key === 'Backspace') {
        // Solo si no estamos editando texto y hay bloque seleccionado
        if (!isEditable && bloqueSeleccionado && !bloqueEditandoInline) {
          event.preventDefault();
          onDelete?.(bloqueSeleccionado);
        }
        return;
      }

      // ===== ESCAPE =====
      if (key === 'Escape') {
        // Si estamos en inline editing, salir de él
        if (bloqueEditandoInline) {
          event.preventDefault();
          desactivarInlineEditing();
          return;
        }

        // Si hay bloque seleccionado, deseleccionar
        if (bloqueSeleccionado) {
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
      bloqueSeleccionado,
      bloqueEditandoInline,
      isEditableTarget,
      onSave,
      onDuplicate,
      onDelete,
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
