/**
 * ====================================================================
 * PUBLISH WORKFLOW MODAL - Modal de confirmación para publicar/despublicar
 * ====================================================================
 */

import { memo, useMemo } from 'react';
import {
  Play,
  Pause,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  Users,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

function PublishWorkflowModal({
  isOpen,
  onClose,
  onConfirm,
  workflow,
  isPublishing = false,
  validationErrors = [],
  warningCount = 0,
  instancesInProgress = 0,
}) {
  const isPublished = workflow?.activo;
  const action = isPublished ? 'despublicar' : 'publicar';

  // Verificar si se puede publicar
  const canPublish = useMemo(() => {
    if (isPublished) return true; // Siempre se puede despublicar
    return validationErrors.length === 0;
  }, [isPublished, validationErrors]);

  const handleConfirm = () => {
    if (canPublish && !isPublishing) {
      onConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={!isPublishing}
      disableClose={isPublishing}
    >
      <div className="text-center">
        {/* Icono */}
        <div
          className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${
            isPublished
              ? 'bg-amber-100 dark:bg-amber-900/30'
              : canPublish
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}
        >
          {isPublished ? (
            <Pause className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          ) : canPublish ? (
            <Play className="h-7 w-7 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
          )}
        </div>

        {/* Título */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {isPublished ? 'Despublicar Workflow' : 'Publicar Workflow'}
        </h3>

        {/* Nombre del workflow */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span className="font-medium">{workflow?.nombre}</span>
          {workflow?.codigo && (
            <span className="text-gray-400 dark:text-gray-500 ml-2">
              ({workflow.codigo})
            </span>
          )}
        </p>

        {/* Errores de validación (solo al publicar) */}
        {!isPublished && validationErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-left">
            <p className="text-sm font-medium text-red-800 dark:text-red-300 flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" />
              No se puede publicar
            </p>
            <ul className="space-y-1">
              {validationErrors.slice(0, 5).map((error, idx) => (
                <li
                  key={idx}
                  className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1"
                >
                  <span className="shrink-0">•</span>
                  <span>{error}</span>
                </li>
              ))}
              {validationErrors.length > 5 && (
                <li className="text-xs text-red-500 dark:text-red-400 italic">
                  y {validationErrors.length - 5} error(es) más...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Warnings (solo al publicar) */}
        {!isPublished && warningCount > 0 && validationErrors.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 text-left">
            <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {warningCount} advertencia{warningCount > 1 ? 's' : ''} (no bloquean
              publicación)
            </p>
          </div>
        )}

        {/* Advertencia de instancias en progreso (al despublicar) */}
        {isPublished && instancesInProgress > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 text-left">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" />
              Instancias activas
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Hay {instancesInProgress} instancia{instancesInProgress > 1 ? 's' : ''}{' '}
              en progreso. Continuarán ejecutándose pero no se crearán nuevas.
            </p>
          </div>
        )}

        {/* Mensaje de confirmación */}
        {canPublish && (
          <div className="mb-6">
            {isPublished ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Al despublicar este workflow:
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    No se crearán nuevas instancias
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    Las instancias activas continuarán
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Al publicar este workflow:
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <Play className="w-3 h-3 text-green-500" />
                    Se activará automáticamente
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Comenzará a procesar {workflow?.entidad_tipo?.replace('_', ' ')}
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isPublishing}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canPublish || isPublishing}
            className={`px-6 ${
              isPublished
                ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500'
                : canPublish
                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isPublished ? 'Despublicando...' : 'Publicando...'}
              </>
            ) : (
              <>
                {isPublished ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isPublished ? 'Despublicar' : 'Publicar'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(PublishWorkflowModal);
