/**
 * Factory para hooks de mutaciones de estado (cancelar, confirmar, iniciar, etc.)
 *
 * Elimina duplicacion en hooks como useMutacionesCitas donde 5+ hooks
 * siguen el mismo patron: mutationFn → invalidate queries → toast → error handler.
 *
 * Feb 2026 - Auditoria Frontend Fase 1
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/utils/useToast';
import { createCRUDErrorHandler, getErrorMessage } from '@/hooks/config/errorHandlerFactory';

type ToastType = 'success' | 'warning' | 'info';
type ErrorType = 'create' | 'update' | 'delete';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface StatusMutationConfig<TVariables = { id: string | number }, TData = any> {
  /** Funcion que ejecuta la llamada API */
  mutationFn: (variables: TVariables) => Promise<{ data: TData }>;

  /** Query key principal a invalidar */
  queryKey: string;

  /** Query keys adicionales a invalidar */
  relatedKeys?: string[];

  /** Extraer el ID de la entidad para invalidar query de detalle */
  getEntityId?: (variables: TVariables) => string | number;

  /** Mensaje de exito en el toast */
  successMessage?: string;

  /** Tipo de toast en exito (default: 'success') */
  successType?: ToastType;

  /** Tipo de error para el error handler (default: 'update') */
  errorType?: ErrorType;

  /** Nombre de la entidad para mensajes de error (default: 'Elemento') */
  entityName?: string;

  /** Sanitizacion opcional de variables antes de la mutacion */
  sanitize?: (variables: TVariables) => TVariables;
}

/**
 * Crea un hook de mutacion de estado reutilizable
 *
 * @example
 * export const useCancelarCita = createStatusMutationHook({
 *   mutationFn: ({ id, motivo_cancelacion }) =>
 *     citasApi.cancelar(id, { motivo_cancelacion }),
 *   queryKey: 'citas',
 *   getEntityId: (v) => v.id,
 *   successMessage: 'Cita cancelada exitosamente',
 *   errorType: 'delete',
 *   entityName: 'Cita',
 * });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createStatusMutationHook<TVariables = { id: string | number }, TData = any>(
  config: StatusMutationConfig<TVariables, TData>,
) {
  const {
    mutationFn,
    queryKey,
    relatedKeys = [],
    getEntityId,
    successMessage,
    successType = 'success',
    errorType = 'update',
    entityName = 'Elemento',
    sanitize,
  } = config;

  return function useStatusMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
      mutationFn: async (variables: TVariables) => {
        const sanitized = sanitize ? sanitize(variables) : variables;
        const response = await mutationFn(sanitized);
        return response.data;
      },
      onSuccess: (_data: unknown, variables: TVariables) => {
        // Invalidar query principal
        queryClient.invalidateQueries({ queryKey: [queryKey], refetchType: 'active' });

        // Invalidar query de detalle si hay getEntityId
        if (getEntityId) {
          const entityId = getEntityId(variables);
          queryClient.invalidateQueries({ queryKey: [queryKey, entityId], refetchType: 'active' });
        }

        // Invalidar keys relacionadas
        relatedKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
        });

        // Toast de exito
        if (successMessage) {
          toast[successType](successMessage);
        }
      },
      onError: (error: unknown) => {
        try {
          createCRUDErrorHandler(errorType, entityName)(error);
        } catch (e) {
          toast.error(getErrorMessage(e instanceof Error ? e : new Error(String(e))));
        }
      },
    });
  };
}

export default createStatusMutationHook;
