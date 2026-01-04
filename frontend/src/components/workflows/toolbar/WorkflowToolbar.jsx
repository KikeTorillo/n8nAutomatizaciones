/**
 * ====================================================================
 * WORKFLOW TOOLBAR - Barra de herramientas del designer
 * ====================================================================
 */

import { memo, useState } from 'react';
import {
  Save,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';

function WorkflowToolbar({
  workflow,
  isNew = false,
  isDirty = false,
  isValid = true,
  validationErrors = [],
  warningCount = 0,
  isSaving = false,
  isPublishing = false,
  onSave,
  onValidate,
  onPublish,
  onOpenSettings,
}) {
  const navigate = useNavigate();
  const [showErrors, setShowErrors] = useState(false);

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm('Tienes cambios sin guardar. ¿Deseas salir?')) {
        navigate('/configuracion/workflows');
      }
    } else {
      navigate('/configuracion/workflows');
    }
  };

  return (
    <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between">
      {/* Izquierda: Back + Nombre */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {workflow?.nombre || 'Nuevo Workflow'}
            </h1>
            {workflow?.codigo && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <code>{workflow.codigo}</code>
              </p>
            )}
          </div>

          {/* Estado */}
          {!isNew && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                workflow?.activo
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {workflow?.activo ? 'Publicado' : 'Borrador'}
            </span>
          )}

          {/* Indicador cambios sin guardar */}
          {isDirty && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              Sin guardar
            </span>
          )}
        </div>
      </div>

      {/* Derecha: Acciones */}
      <div className="flex items-center gap-2">
        {/* Validacion */}
        <div className="relative">
          <button
            onClick={() => {
              onValidate?.();
              setShowErrors(!showErrors);
            }}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              !isValid
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                : warningCount > 0
                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
            title={
              !isValid
                ? `${validationErrors.length} errores de validación`
                : warningCount > 0
                ? `${warningCount} advertencias`
                : 'Workflow válido'
            }
          >
            {!isValid ? (
              <AlertCircle className="w-5 h-5" />
            ) : warningCount > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {(validationErrors.length > 0 || warningCount > 0) && (
              <span className="text-xs font-medium">
                {validationErrors.length > 0 ? validationErrors.length : warningCount}
              </span>
            )}
          </button>

          {/* Tooltip de errores/warnings */}
          {showErrors && (validationErrors.length > 0 || warningCount > 0) && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50">
              {validationErrors.length > 0 && (
                <>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.length} Error{validationErrors.length > 1 ? 'es' : ''}
                  </p>
                  <ul className="space-y-1 mb-3">
                    {validationErrors.map((error, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1"
                      >
                        <span className="shrink-0">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {warningCount > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {warningCount} advertencia{warningCount > 1 ? 's' : ''} (no bloquean el guardado)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Configuracion */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Configuracion del workflow"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Guardar */}
        <Button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          variant="secondary"
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar
        </Button>

        {/* Publicar (solo si no es nuevo y esta guardado) */}
        {!isNew && (
          <Button
            onClick={onPublish}
            disabled={isPublishing || isDirty || !isValid}
            className="flex items-center gap-2"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : workflow?.activo ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {workflow?.activo ? 'Despublicar' : 'Publicar'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default memo(WorkflowToolbar);
