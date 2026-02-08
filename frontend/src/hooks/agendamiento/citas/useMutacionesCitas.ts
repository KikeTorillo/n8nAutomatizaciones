import { useMutation, useQueryClient } from '@tanstack/react-query';
import { citasApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { createStatusMutationHook } from '@/hooks/factories/createStatusMutationHook';
import { queryKeys } from '@/hooks/config';
import type {
  Cita,
  CrearCitaData,
  ActualizarCitaData,
  CancelarCitaVariables,
  ConfirmarCitaVariables,
  IniciarCitaVariables,
  CompletarCitaVariables,
  NoShowCitaVariables,
} from '@/types/entities/cita';

/**
 * Hook para crear una nueva cita
 * (manual — usa useSucursalStore para fallback de sucursal_id)
 */
export function useCrearCita() {
  const queryClient = useQueryClient();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (citaData: CrearCitaData): Promise<Cita> => {
      const sanitizedData = {
        ...citaData,
        notas_cliente: citaData.notas_cliente?.trim() || undefined,
        notas_internas: citaData.notas_internas?.trim() || undefined,
        descuento: citaData.descuento || 0,
        sucursal_id: citaData.sucursal_id || getSucursalId() || undefined,
      };

      const response = await citasApi.crear(sanitizedData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.citas.all, refetchType: 'active' });
    },
  });
}

/**
 * Hook para actualizar una cita existente
 * (manual — sanitizacion custom de notas)
 */
export function useActualizarCita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...citaData }: ActualizarCitaData & { id: number }): Promise<Cita> => {
      const sanitizedData = {
        ...citaData,
        notas_cliente: citaData.notas_cliente?.trim() || undefined,
        notas_profesional: citaData.notas_profesional?.trim() || undefined,
        notas_internas: citaData.notas_internas?.trim() || undefined,
      };

      const response = await citasApi.actualizar(id, sanitizedData);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.citas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.agendamiento.citas.detail(variables.id), refetchType: 'active' });
    },
  });
}

// --- Hooks de cambio de estado generados con factory ---

export const useCancelarCita = createStatusMutationHook<CancelarCitaVariables, Cita>({
  mutationFn: ({ id, motivo_cancelacion }) =>
    citasApi.cancelar(id, { motivo_cancelacion }),
  queryKey: 'citas',
  getEntityId: (v) => v.id,
  successMessage: 'Cita cancelada exitosamente',
  errorType: 'delete',
  entityName: 'Cita',
});

export const useConfirmarCita = createStatusMutationHook<ConfirmarCitaVariables, Cita>({
  mutationFn: ({ id }) => citasApi.confirmar(id),
  queryKey: 'citas',
  getEntityId: (v) => v.id,
  successMessage: 'Cita confirmada exitosamente',
  entityName: 'Cita',
});

export const useIniciarCita = createStatusMutationHook<IniciarCitaVariables, Cita>({
  mutationFn: ({ id }) => citasApi.iniciar(id),
  queryKey: 'citas',
  getEntityId: (v) => v.id,
  successMessage: 'Cita iniciada',
  entityName: 'Cita',
});

export const useCompletarCita = createStatusMutationHook<CompletarCitaVariables, Cita>({
  mutationFn: ({ id, ...data }) =>
    citasApi.completar(id, {
      ...data,
      notas_profesional: data.notas_profesional?.trim() || undefined,
      comentario_profesional: data.comentario_profesional?.trim() || undefined,
    }),
  queryKey: 'citas',
  getEntityId: (v) => v.id,
  successMessage: 'Cita completada exitosamente',
  entityName: 'Cita',
});

export const useNoShowCita = createStatusMutationHook<NoShowCitaVariables, Cita>({
  mutationFn: ({ id, motivo }) =>
    citasApi.noShow(id, { motivo_no_show: motivo }),
  queryKey: 'citas',
  getEntityId: (v) => v.id,
  successMessage: 'Cita marcada como No Show',
  successType: 'warning',
  entityName: 'Cita',
});
