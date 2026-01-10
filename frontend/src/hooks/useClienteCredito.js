/**
 * ====================================================================
 * HOOKS DE CRÉDITO / FIADO - CLIENTES
 * ====================================================================
 *
 * Hooks para gestión de crédito de clientes:
 * - Estado de crédito
 * - Configuración (habilitar/deshabilitar)
 * - Suspensión y reactivación
 * - Abonos
 * - Movimientos
 * - Listado de clientes con saldo pendiente
 *
 * Ene 2026 - Fase 2 POS
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '@/services/api/endpoints';

/**
 * Hook para obtener estado de crédito de un cliente
 * @param {number} clienteId - ID del cliente
 * @param {Object} options - { enabled }
 * @returns {Object} { data: { cliente, permite_credito, limite_credito, saldo_credito, disponible, ... }, isLoading, error }
 */
export function useEstadoCredito(clienteId, options = {}) {
  return useQuery({
    queryKey: ['cliente-credito', clienteId],
    queryFn: async () => {
      const response = await clientesApi.obtenerEstadoCredito(clienteId);
      return response.data.data;
    },
    enabled: !!clienteId && (options.enabled !== false),
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para actualizar configuración de crédito de un cliente
 * PATCH /clientes/:id/credito
 */
export function useActualizarCredito() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, data }) => {
      const response = await clientesApi.actualizarCredito(clienteId, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['cliente-credito', variables.clienteId]);
      queryClient.invalidateQueries(['cliente', variables.clienteId]);
      queryClient.invalidateQueries(['clientes']);
    },
  });
}

/**
 * Hook para suspender crédito de un cliente
 * POST /clientes/:id/credito/suspender
 */
export function useSuspenderCredito() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, motivo }) => {
      const response = await clientesApi.suspenderCredito(clienteId, { motivo });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['cliente-credito', variables.clienteId]);
      queryClient.invalidateQueries(['cliente', variables.clienteId]);
    },
  });
}

/**
 * Hook para reactivar crédito de un cliente
 * POST /clientes/:id/credito/reactivar
 */
export function useReactivarCredito() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clienteId) => {
      const response = await clientesApi.reactivarCredito(clienteId);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // variables es clienteId directamente
      queryClient.invalidateQueries(['cliente-credito', variables]);
      queryClient.invalidateQueries(['cliente', variables]);
    },
  });
}

/**
 * Hook para registrar abono a cuenta de cliente
 * POST /clientes/:id/credito/abono
 */
export function useRegistrarAbono() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, monto, descripcion }) => {
      const response = await clientesApi.registrarAbono(clienteId, { monto, descripcion });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['cliente-credito', variables.clienteId]);
      queryClient.invalidateQueries(['cliente-credito-movimientos', variables.clienteId]);
      queryClient.invalidateQueries(['clientes-con-saldo']);
    },
  });
}

/**
 * Hook para listar movimientos de crédito de un cliente
 * GET /clientes/:id/credito/movimientos
 * @param {number} clienteId - ID del cliente
 * @param {Object} params - { limit, offset }
 */
export function useMovimientosCredito(clienteId, params = {}) {
  return useQuery({
    queryKey: ['cliente-credito-movimientos', clienteId, params],
    queryFn: async () => {
      const response = await clientesApi.listarMovimientosCredito(clienteId, params);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: 1000 * 30, // 30 segundos
    keepPreviousData: true,
  });
}

/**
 * Hook para listar clientes con saldo pendiente (cobranza)
 * GET /clientes/credito/con-saldo
 * @param {Object} params - { solo_vencidos }
 */
export function useClientesConSaldo(params = {}) {
  return useQuery({
    queryKey: ['clientes-con-saldo', params],
    queryFn: async () => {
      const response = await clientesApi.listarClientesConSaldo(params);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook combinado para verificar si un cliente puede usar crédito en POS
 * Útil para el modal de método de pago
 * @param {number} clienteId - ID del cliente
 * @param {number} montoRequerido - Monto de la venta
 */
export function usePuedeUsarCredito(clienteId, montoRequerido = 0) {
  const { data: estadoCredito, isLoading, error } = useEstadoCredito(clienteId, {
    enabled: !!clienteId,
  });

  if (!clienteId || isLoading || error || !estadoCredito) {
    return {
      puedeUsarCredito: false,
      disponible: 0,
      razon: clienteId ? 'Cargando...' : 'Sin cliente seleccionado',
      isLoading,
    };
  }

  const { permite_credito, credito_suspendido, limite_credito, saldo_credito } = estadoCredito;
  const disponible = limite_credito - saldo_credito;

  if (!permite_credito) {
    return {
      puedeUsarCredito: false,
      disponible: 0,
      razon: 'Cliente no tiene crédito habilitado',
      isLoading: false,
    };
  }

  if (credito_suspendido) {
    return {
      puedeUsarCredito: false,
      disponible: 0,
      razon: 'Crédito suspendido',
      isLoading: false,
    };
  }

  if (montoRequerido > disponible) {
    return {
      puedeUsarCredito: false,
      disponible,
      razon: `Monto excede disponible ($${disponible.toFixed(2)})`,
      isLoading: false,
    };
  }

  return {
    puedeUsarCredito: true,
    disponible,
    razon: null,
    isLoading: false,
    estadoCredito,
  };
}
