import { useQuery, useMutation } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { citasApi } from '@/services/api/endpoints';
import { useToast } from '../../utils/useToast';
import { createCRUDErrorHandler, getErrorMessage } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para enviar recordatorio de cita
 */
export function useEnviarRecordatorio() {
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id }) => {
      const response = await citasApi.enviarRecordatorio(id);
      return response.data;
    },
    onSuccess: () => {
      success('Recordatorio enviado por WhatsApp');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Recordatorio')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

/**
 * Hook para obtener historial de recordatorios de una cita
 * @param {number} citaId - ID de la cita
 */
export function useRecordatorios(citaId) {
  return useQuery({
    queryKey: ['citas', citaId, 'recordatorios'],
    queryFn: async () => {
      const response = await citasApi.obtenerRecordatorios(citaId);
      return response.data;
    },
    enabled: !!citaId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}
