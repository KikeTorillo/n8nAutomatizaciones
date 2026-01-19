/**
 * Mutations - Cuentas Contables
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contabilidadApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils/useToast';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { CONTABILIDAD_KEYS } from '../constants';

/**
 * Hook para crear cuenta contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useCrearCuenta() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const sanitizedData = {
        ...data,
        codigo_sat: data.codigo_sat?.trim() || undefined,
        cuenta_padre_id: data.cuenta_padre_id || undefined,
      };

      const response = await contabilidadApi.crearCuenta(sanitizedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.cuentas.all() });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.dashboard() });
      success('Cuenta creada exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('create', 'Cuenta');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}

/**
 * Hook para actualizar cuenta contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useActualizarCuenta() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const sanitizedData = {
        ...data,
        codigo_sat: data.codigo_sat?.trim() || undefined,
      };

      const response = await contabilidadApi.actualizarCuenta(id, sanitizedData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.cuentas.all() });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.cuentas.detail(variables.id) });
      success('Cuenta actualizada exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('update', 'Cuenta');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}

/**
 * Hook para eliminar cuenta contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useEliminarCuenta() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await contabilidadApi.eliminarCuenta(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.cuentas.all() });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.dashboard() });
      success('Cuenta eliminada exitosamente');
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('delete', 'Cuenta');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}

/**
 * Hook para inicializar catálogo SAT
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useInicializarCatalogoSAT() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await contabilidadApi.inicializarCatalogoSAT();
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.cuentas.all() });
      queryClient.invalidateQueries({ queryKey: CONTABILIDAD_KEYS.dashboard() });
      success(`Catalogo SAT inicializado: ${data?.data?.cuentas_creadas || 0} cuentas creadas`);
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('create', 'Catalogo SAT');
      try {
        handler(error);
      } catch (e) {
        showError(e.message);
      }
    },
  });
}
