import { useMutation, useQueryClient } from '@tanstack/react-query';
import { citasApi } from '@/services/api/endpoints';
import { useToast } from '../../utils/useToast';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { createCRUDErrorHandler, getErrorMessage } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para crear una nueva cita
 */
export function useCrearCita() {
  const queryClient = useQueryClient();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (citaData) => {
      const sanitizedData = {
        ...citaData,
        notas_cliente: citaData.notas_cliente?.trim() || undefined,
        notas_internas: citaData.notas_internas?.trim() || undefined,
        descuento: citaData.descuento || 0,
        sucursal_id: citaData.sucursal_id || getSucursalId() || undefined,
      };

      const response = await citasApi.crear(sanitizedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}

/**
 * Hook para actualizar una cita existente
 */
export function useActualizarCita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...citaData }) => {
      const sanitizedData = {
        ...citaData,
        notas_cliente: citaData.notas_cliente?.trim() || undefined,
        notas_profesional: citaData.notas_profesional?.trim() || undefined,
        notas_internas: citaData.notas_internas?.trim() || undefined,
      };

      const response = await citasApi.actualizar(id, sanitizedData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });
    },
  });
}

/**
 * Hook para cancelar una cita
 */
export function useCancelarCita() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo_cancelacion }) => {
      const response = await citasApi.cancelar(id, { motivo_cancelacion });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });
      success('Cita cancelada exitosamente');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Cita')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

/**
 * Hook para confirmar una cita
 */
export function useConfirmarCita() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id }) => {
      const response = await citasApi.confirmar(id);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });
      success('Cita confirmada exitosamente');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Cita')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

/**
 * Hook para iniciar una cita (cambiar a estado en_curso)
 */
export function useIniciarCita() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id }) => {
      const response = await citasApi.iniciar(id);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });
      success('Cita iniciada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Cita')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

/**
 * Hook para completar una cita
 */
export function useCompletarCita() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const sanitizedData = {
        ...data,
        notas_profesional: data.notas_profesional?.trim() || undefined,
        comentario_profesional: data.comentario_profesional?.trim() || undefined,
      };

      const response = await citasApi.completar(id, sanitizedData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });
      success('Cita completada exitosamente');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Cita')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}

/**
 * Hook para marcar una cita como no show (cliente no llegó)
 */
export function useNoShowCita() {
  const queryClient = useQueryClient();
  const { warning, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo }) => {
      // El backend espera motivo_no_show
      const response = await citasApi.noShow(id, { motivo_no_show: motivo });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas', variables.id] });
      warning('Cita marcada como No Show');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Cita')(error);
      } catch (e) {
        showError(getErrorMessage(e));
      }
    },
  });
}
