/**
 * ====================================================================
 * BASE AUTO SAVE EDITOR
 * ====================================================================
 * Componente wrapper para editores de bloques con guardado automático.
 * Similar a BaseBlockEditor pero SIN botón de guardar.
 *
 * Uso: Editores que propagan cambios inmediatamente (invitaciones, etc.)
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';

/**
 * BaseAutoSaveEditor - Wrapper para editores con autosave
 *
 * @param {Object} props
 * @param {React.ReactNode} props.preview - Componente de preview opcional
 * @param {React.ReactNode} props.children - Campos del editor
 * @param {string} props.previewLabel - Etiqueta del preview (default: 'Vista previa')
 * @param {string} props.className - Clases adicionales
 */
function BaseAutoSaveEditor({
  preview,
  children,
  previewLabel = 'Vista previa',
  className = '',
}) {
  return (
    <div className={`p-4 space-y-4 ${className}`}>
      {/* Editor Fields */}
      {children}

      {/* Preview */}
      {preview && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {previewLabel}
            </span>
          </div>
          {preview}
        </div>
      )}
    </div>
  );
}

export default memo(BaseAutoSaveEditor);
