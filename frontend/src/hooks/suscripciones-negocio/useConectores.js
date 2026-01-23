/**
 * ====================================================================
 * HOOKS: CONECTORES DE PAGO
 * ====================================================================
 * Hooks CRUD para gestión de conectores de pago usando factory.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { conectoresApi } from '@/services/api/modules/conectores.api';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories/createCRUDHooks';
import { QUERY_KEYS } from './constants';
import { useToast } from '@/hooks/utils';

// Sanitizador para conectores
const sanitizeConector = createSanitizer([
  'nombre_display',
  'webhook_url',
  'webhook_secret',
  { name: 'gateway', type: 'string' },
  { name: 'entorno', type: 'string' },
  { name: 'es_principal', type: 'boolean' },
  { name: 'activo', type: 'boolean' },
]);

// Hooks CRUD base
const conectoresHooks = createCRUDHooks({
  name: 'conector',
  namePlural: 'conectores',
  api: conectoresApi,
  baseKey: QUERY_KEYS.CONECTORES,
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  sanitize: sanitizeConector,
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true,
  transformList: (data, pagination) => ({
    items: data?.items || data?.conectores || data || [],
    total: pagination?.total || data?.total || 0,
    paginacion: pagination,
  }),
  errorMessages: {
    create: { 409: 'Ya existe un conector de este gateway para este entorno' },
    delete: { 409: 'No se puede eliminar el conector: tiene operaciones pendientes' },
  },
});

// Re-exportar hooks base
export const useConectores = conectoresHooks.useList;
export const useConector = conectoresHooks.useDetail;
export const useCrearConector = conectoresHooks.useCreate;
export const useActualizarConector = conectoresHooks.useUpdate;
export const useEliminarConector = conectoresHooks.useDelete;

/**
 * Hook para listar gateways soportados
 */
export function useGatewaysSoportados() {
  return useQuery({
    queryKey: [QUERY_KEYS.CONECTORES, 'gateways'],
    queryFn: async () => {
      const response = await conectoresApi.listarGateways();
      return response.data?.data?.gateways || [];
    },
    staleTime: STALE_TIMES.STATIC, // Gateways rara vez cambian
  });
}

/**
 * Hook para verificar conectividad de un conector
 * @param {Object} options - Opciones adicionales
 */
export function useVerificarConector(options = {}) {
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await conectoresApi.verificarConectividad(id);
      return response.data?.data;
    },
    onSuccess: (data, id) => {
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONECTORES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONECTOR, id] });

      if (data?.verificado) {
        showSuccess('Conexión verificada correctamente');
      } else {
        showError(data?.mensaje || 'Error al verificar la conexión');
      }

      options.onSuccess?.(data, id);
    },
    onError: (error, id) => {
      showError(error.message || 'Error al verificar la conexión');
      options.onError?.(error, id);
    },
  });
}

export default {
  useConectores,
  useConector,
  useCrearConector,
  useActualizarConector,
  useEliminarConector,
  useGatewaysSoportados,
  useVerificarConector,
};
