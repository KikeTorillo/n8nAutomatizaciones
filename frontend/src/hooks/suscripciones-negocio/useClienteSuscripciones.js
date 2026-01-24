/**
 * ====================================================================
 * HOOKS: CUSTOMER BILLING (Suscripciones de Clientes)
 * ====================================================================
 * Hooks para gestión de suscripciones de clientes (Customer Billing).
 *
 * Caso de uso:
 * - Admin crea link de checkout para un cliente
 * - Admin ve tokens pendientes y sus estados
 * - Admin cancela tokens no utilizados
 *
 * @module hooks/useClienteSuscripciones
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { QUERY_KEYS } from './constants';

/**
 * Hook para listar tokens de checkout generados
 *
 * @param {Object} options - Opciones de filtrado
 * @param {number} [options.page=1] - Página actual
 * @param {number} [options.limit=20] - Límite por página
 * @param {string} [options.estado] - Filtrar por estado (pendiente, usado, expirado, cancelado)
 * @param {number} [options.cliente_id] - Filtrar por cliente
 * @returns {Object} Query result con { data: { items, paginacion }, isLoading, error }
 */
export const useCheckoutTokens = (options = {}) => {
  const {
    page = 1,
    limit = 20,
    estado,
    cliente_id,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: [QUERY_KEYS.CHECKOUT_TOKENS, { page, limit, estado, cliente_id }],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.listarCheckoutTokens({
        page,
        limit,
        ...(estado && { estado }),
        ...(cliente_id && { cliente_id }),
      });
      return response.data.data;
    },
    enabled,
    keepPreviousData: true,
  });
};

/**
 * Hook para crear suscripción para un cliente (genera link de checkout)
 *
 * @returns {Object} Mutation con { mutate, mutateAsync, isLoading }
 *
 * @example
 * const { mutateAsync } = useCrearSuscripcionCliente();
 * const result = await mutateAsync({
 *   cliente_id: 123,
 *   plan_id: 1,
 *   periodo: 'mensual',
 *   notificar_cliente: true
 * });
 * console.log(result.checkout_url);
 */
export const useCrearSuscripcionCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await suscripcionesNegocioApi.crearSuscripcionParaCliente(data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar lista de tokens
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHECKOUT_TOKENS] });
      // También invalidar suscripciones por si hay relación
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES] });
    },
  });
};

/**
 * Hook para cancelar token de checkout
 *
 * @returns {Object} Mutation
 */
export const useCancelarCheckoutToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tokenId) => {
      const response = await suscripcionesNegocioApi.cancelarCheckoutToken(tokenId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHECKOUT_TOKENS] });
    },
  });
};

/**
 * Hook para obtener datos de checkout público (sin auth)
 * Usado en la página de checkout para clientes
 *
 * @param {string} token - Token de checkout
 * @returns {Object} Query result con datos del checkout
 */
export const useCheckoutPublico = (token) => {
  return useQuery({
    queryKey: ['checkout_publico', token],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.obtenerCheckoutPublico(token);
      return response.data.data;
    },
    enabled: !!token,
    retry: false, // No reintentar si el token es inválido
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para iniciar pago desde checkout público
 *
 * @returns {Object} Mutation
 */
export const useIniciarPagoPublico = () => {
  return useMutation({
    mutationFn: async (token) => {
      const response = await suscripcionesNegocioApi.iniciarPagoPublico(token);
      return response.data.data;
    },
  });
};
