import { useQuery, useMutation } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { citasApi } from '@/services/api/endpoints';
import { useToast } from '../../utils/useToast';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

/**
 * Hook para enviar recordatorio de cita
 */
export function useEnviarRecordatorio() {
  const { success } = useToast();

  return useMutation({
    mutationFn: async ({ id }) => {
      const response = await citasApi.enviarRecordatorio(id);
      return response.data;
    },
    onSuccess: () => {
      success('Recordatorio enviado por WhatsApp');
    },
    onError: createCRUDErrorHandler('create', 'Recordatorio'),
  });
}

/**
 * Hook para obtener historial de recordatorios de una cita
 * @param {number} citaId - ID de la cita
 */
export function useRecordatorios(citaId) {
  return useQuery({
    queryKey: [...queryKeys.agendamiento.citas.all, citaId, 'recordatorios'],
    queryFn: async () => {
      const response = await citasApi.obtenerRecordatorios(citaId);
      return response.data;
    },
    enabled: !!citaId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}
