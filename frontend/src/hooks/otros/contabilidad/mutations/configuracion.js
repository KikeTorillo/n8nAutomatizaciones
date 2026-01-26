/**
 * Mutations - Configuración Contable
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contabilidadApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils/useToast';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { CONTABILIDAD_KEYS } from '../constants';

/**
 * Hook para actualizar configuración contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useActualizarConfiguracion() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await contabilidadApi.actualizarConfiguracion(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.configuracion(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.dashboard(), refetchType: 'active' });
      success('Configuracion actualizada exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('update', 'Configuracion');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}
