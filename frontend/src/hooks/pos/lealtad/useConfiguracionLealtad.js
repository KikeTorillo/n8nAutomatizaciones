/**
 * Hooks para configuración del programa de lealtad
 * Extraído de useLealtad.js — Feb 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { queryKeys } from '@/hooks/config';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para obtener configuración del programa de lealtad
 * GET /pos/lealtad/configuracion
 */
export function useConfiguracionLealtad() {
  return useQuery({
    queryKey: queryKeys.pos.lealtad.configuracion,
    queryFn: async () => {
      const response = await posApi.obtenerConfiguracionLealtad();
      return response.data.data;
    },
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos
  });
}

/**
 * Hook para guardar configuración del programa de lealtad
 * PUT /pos/lealtad/configuracion
 */
export function useGuardarConfiguracionLealtad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await posApi.guardarConfiguracionLealtad(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.configuracion, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.nivelesBase, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Configuración de lealtad'),
  });
}
