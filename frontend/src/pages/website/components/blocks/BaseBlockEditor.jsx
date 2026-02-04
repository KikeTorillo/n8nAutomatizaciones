/**
 * ====================================================================
 * BASE BLOCK EDITOR
 * ====================================================================
 *
 * Componente base para editores de bloques.
 * Proporciona estructura común: formulario, banner AI, preview, botón guardar.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { AISuggestionBanner } from '../AIGenerator';

/**
 * BaseBlockEditor - Wrapper base para editores de bloques
 *
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque
 * @param {string} props.industria - Industria para AI
 * @param {boolean} props.mostrarAIBanner - Mostrar banner de sugerencia AI
 * @param {Function} props.onAIGenerate - Callback para generación AI
 * @param {boolean} props.cambios - Si hay cambios pendientes
 * @param {Function} props.handleSubmit - Función de submit del form (de useBlockEditor)
 * @param {Function} props.onGuardar - Callback de guardar
 * @param {boolean} props.isSaving - Si está guardando
 * @param {React.ReactNode} props.preview - Componente de preview
 * @param {React.ReactNode} props.children - Campos del editor
 * @param {string} props.className - Clases adicionales
 */
function BaseBlockEditor({
  tipo,
  industria = 'default',
  mostrarAIBanner = false,
  onAIGenerate,
  cambios = false,
  handleSubmit,
  onGuardar,
  isSaving = false,
  preview,
  children,
  className = '',
}) {
  return (
    <form onSubmit={handleSubmit(onGuardar)} className={`space-y-4 ${className}`}>
      {/* AI Suggestion Banner */}
      {mostrarAIBanner && onAIGenerate && (
        <AISuggestionBanner
          tipo={tipo}
          industria={industria}
          onGenerate={onAIGenerate}
        />
      )}

      {/* Editor Fields */}
      {children}

      {/* Preview */}
      {preview && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          {preview}
        </div>
      )}

      {/* Save Button */}
      {cambios && (
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  );
}

export default memo(BaseBlockEditor);
