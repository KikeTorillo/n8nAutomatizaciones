/**
 * Mutations - Asientos Contables
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contabilidadApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils/useToast';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { CONTABILIDAD_KEYS } from '../constants';

/**
 * Hook para crear asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useCrearAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const sanitizedData = {
        ...data,
        notas: data.notas?.trim() || undefined,
        referencia_tipo: data.referencia_tipo?.trim() || undefined,
        referencia_id: data.referencia_id || undefined,
        periodo_id: data.periodo_id || undefined,
        movimientos: data.movimientos.map((m) => ({
          ...m,
          concepto: m.concepto?.trim() || undefined,
          tercero_tipo: m.tercero_tipo || undefined,
          tercero_id: m.tercero_id || undefined,
        })),
      };

      const response = await contabilidadApi.crearAsiento(sanitizedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.asientos.all() });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.dashboard() });
      success('Asiento creado exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('create', 'Asiento');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}

/**
 * Hook para actualizar asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useActualizarAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, fecha, ...data }) => {
      const sanitizedData = {
        ...data,
        notas: data.notas?.trim() || undefined,
        movimientos: data.movimientos?.map((m) => ({
          ...m,
          concepto: m.concepto?.trim() || undefined,
          tercero_tipo: m.tercero_tipo || undefined,
          tercero_id: m.tercero_id || undefined,
        })),
      };

      const response = await contabilidadApi.actualizarAsiento(id, fecha, sanitizedData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.asientos.all() });
      queryClient.invalidateQueries({
        queryKey: CONTABILIDAD_KEYS.asientos.detail(variables.id, variables.fecha),
      });
      success('Asiento actualizado exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('update', 'Asiento');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}

/**
 * Hook para publicar asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function usePublicarAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, fecha }) => {
      const response = await contabilidadApi.publicarAsiento(id, fecha);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.asientos.all() });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.dashboard() });
      success('Asiento publicado exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('update', 'Asiento');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}

/**
 * Hook para anular asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useAnularAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, fecha, motivo }) => {
      const response = await contabilidadApi.anularAsiento(id, fecha, { motivo });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.asientos.all() });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.dashboard() });
      success('Asiento anulado exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('update', 'Asiento');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}

/**
 * Hook para eliminar asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useEliminarAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, fecha }) => {
      const response = await contabilidadApi.eliminarAsiento(id, fecha);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.asientos.all() });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.dashboard() });
      success('Asiento eliminado exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('delete', 'Asiento');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}
