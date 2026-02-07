import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { citasApi } from '@/services/api/endpoints';
import { useToast } from '../../utils/useToast';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { createCRUDErrorHandler, getErrorMessage } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

/**
 * Hook para crear una serie de citas recurrentes
 */
export function useCrearCitaRecurrente() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (citaData) => {
      const sanitizedData = {
        ...citaData,
        notas_cliente: citaData.notas_cliente?.trim() || undefined,
        notas_internas: citaData.notas_internas?.trim() || undefined,
        sucursal_id: citaData.sucursal_id || getSucursalId() || undefined,
      };

      const response = await citasApi.crearRecurrente(sanitizedData);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.citas.all, refetchType: 'active' });
      success(`Serie creada: ${data.citas_creadas?.length || 0} citas`);
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Serie recurrente')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

/**
 * Hook para obtener todas las citas de una serie recurrente
 * @param {string} serieId - UUID de la serie
 * @param {Object} options - { incluir_canceladas: boolean }
 */
export function useSerieCitas(serieId, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.agendamiento.citas.all, 'serie', serieId, options],
    queryFn: async () => {
      const response = await citasApi.obtenerSerie(serieId, options);
      return response.data?.data || response.data;
    },
    enabled: !!serieId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para cancelar todas las citas pendientes de una serie
 */
export function useCancelarSerie() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ serieId, ...opciones }) => {
      const response = await citasApi.cancelarSerie(serieId, opciones);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.citas.all, refetchType: 'active' });
      success(`${data.citas_canceladas || 0} citas canceladas`);
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Serie de citas')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

/**
 * Hook para obtener preview de fechas disponibles para serie recurrente
 */
export function usePreviewRecurrencia() {
  return useMutation({
    mutationFn: async (datos) => {
      const response = await citasApi.previewRecurrencia(datos);
      return response.data?.data || response.data;
    },
  });
}
