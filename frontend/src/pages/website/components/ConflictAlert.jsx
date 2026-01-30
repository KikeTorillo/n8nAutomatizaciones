/**
 * ====================================================================
 * CONFLICT ALERT - Rollback Visual para Conflictos 409
 * ====================================================================
 * Muestra alerta persistente cuando hay conflicto de versión en el
 * editor de website. Permite recargar datos del servidor para
 * sincronizar cambios.
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import {
  useWebsiteEditorStore,
  selectConflictoVersion,
  selectClearConflictoVersion,
  selectSetBloques,
  selectPaginaActivaId,
} from '@/store';
import { WEBSITE_KEYS } from '@/hooks/otros/website/constants';

/**
 * ConflictAlert - Componente de alerta para conflictos de versión
 * Observa el store y muestra alerta cuando hay conflicto 409
 */
function ConflictAlert() {
  const queryClient = useQueryClient();

  // Store state
  const conflictoVersion = useWebsiteEditorStore(selectConflictoVersion);
  const clearConflictoVersion = useWebsiteEditorStore(selectClearConflictoVersion);
  const setBloques = useWebsiteEditorStore(selectSetBloques);
  const paginaActivaId = useWebsiteEditorStore(selectPaginaActivaId);

  /**
   * Recarga los datos del servidor invalidando cache y actualizando store
   */
  const handleRecargar = useCallback(async () => {
    if (!paginaActivaId) return;

    try {
      // Invalidar cache de TanStack Query para forzar re-fetch
      await queryClient.invalidateQueries({
        queryKey: WEBSITE_KEYS.bloques(paginaActivaId),
        refetchType: 'active',
      });

      // Obtener datos frescos del cache después del refetch
      const bloquesActualizados = queryClient.getQueryData(WEBSITE_KEYS.bloques(paginaActivaId));

      if (bloquesActualizados) {
        // Actualizar el store con los datos del servidor
        setBloques(bloquesActualizados, paginaActivaId);
      }

      // Limpiar el estado de conflicto
      clearConflictoVersion();
    } catch (error) {
      console.error('[ConflictAlert] Error al recargar datos:', error);
    }
  }, [paginaActivaId, queryClient, setBloques, clearConflictoVersion]);

  /**
   * Descarta el conflicto sin recargar (mantiene cambios locales)
   */
  const handleDescartar = useCallback(() => {
    clearConflictoVersion();
  }, [clearConflictoVersion]);

  // No mostrar si no hay conflicto
  if (!conflictoVersion) {
    return null;
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Conflicto de versión detectado
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
              {conflictoVersion.mensaje || 'Otro usuario modificó este contenido. Tus cambios locales podrían sobrescribir los suyos.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRecargar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Recargar datos del servidor</span>
            <span className="sm:hidden">Recargar</span>
          </button>
          <button
            onClick={handleDescartar}
            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Descartar alerta (mantener cambios locales)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictAlert;
