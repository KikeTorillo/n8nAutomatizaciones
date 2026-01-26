import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { citasApi } from '@/services/api/endpoints';
import { useToast } from '../../utils/useToast';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { createCRUDErrorHandler, getErrorMessage } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para crear una cita walk-in (cliente sin cita previa)
 */
export function useCrearCitaWalkIn() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (citaData) => {
      const dataConSucursal = {
        ...citaData,
        sucursal_id: citaData.sucursal_id || getSucursalId() || undefined,
      };
      const response = await citasApi.crearWalkIn(dataConSucursal);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'], refetchType: 'active' });
      success('Cita walk-in creada exitosamente');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Cita walk-in')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

/**
 * Hook para consultar disponibilidad inmediata para walk-in
 * @param {Object} params - { servicio_id, profesional_id }
 */
export function useDisponibilidadInmediata(params) {
  return useQuery({
    queryKey: ['disponibilidad-inmediata', params],
    queryFn: async () => {
      const response = await citasApi.disponibilidadInmediata(params);
      return response.data;
    },
    enabled: !!(params?.servicio_id && params?.profesional_id),
    staleTime: STALE_TIMES.REAL_TIME,
  });
}
