/**
 * Hook para ajuste manual de puntos (admin)
 * Extraído de useLealtad.js — Feb 2026
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/services/api/endpoints';
import { queryKeys } from '@/hooks/config';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para ajuste manual de puntos (admin)
 * POST /pos/lealtad/ajustar
 */
export function useAjustarPuntos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, puntos, motivo }) => {
      const response = await posApi.ajustarPuntos({
        cliente_id: clienteId,
        puntos,
        motivo,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.puntos(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.pos.lealtad.historialBase, variables.clienteId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.clientesBase, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Ajuste de puntos'),
  });
}
