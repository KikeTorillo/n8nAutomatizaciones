/**
 * ====================================================================
 * USE ENTITLEMENTS HOOKS
 * ====================================================================
 * Hooks de React Query para gestión de entitlements de plataforma.
 * Solo accesibles por SuperAdmin.
 *
 * @module hooks/superadmin/useEntitlements
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api/client';

const QUERY_KEY = ['superadmin', 'entitlements', 'planes'];

/**
 * Hook para listar planes de Nexo Team con sus entitlements
 * @returns {UseQueryResult} Query result con { planes, modulosDisponibles }
 */
export function usePlanesEntitlements() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            const response = await apiClient.get('/suscripciones-negocio/entitlements/planes');
            return response.data?.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}

/**
 * Hook para actualizar entitlements de un plan
 * @returns {UseMutationResult} Mutation para actualizar
 */
export function useActualizarEntitlements() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await apiClient.put(
                `/suscripciones-negocio/entitlements/planes/${id}`,
                data
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY, refetchType: 'active' });
        },
    });
}
