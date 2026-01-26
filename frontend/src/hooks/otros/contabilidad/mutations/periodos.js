/**
 * Mutations - Períodos Contables
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contabilidadApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils/useToast';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { CONTABILIDAD_KEYS } from '../constants';

/**
 * Hook para cerrar período contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useCerrarPeriodo() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await contabilidadApi.cerrarPeriodo(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.periodos.all(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.dashboard(), refetchType: 'active' });
      success('Periodo cerrado exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('update', 'Periodo');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}
