/**
 * Hook personalizado para operaciones de Super Admin
 * Gestiona métricas globales, organizaciones y planes del sistema
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { api } from '@/services/api/client';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

export const useSuperAdmin = () => {
    const queryClient = useQueryClient();

    /**
     * ====================================================================
     * DASHBOARD GLOBAL
     * ====================================================================
     * Obtiene métricas globales del sistema:
     * - Organizaciones activas/totales
     * - Usuarios totales
     * - Citas del mes
     * - Revenue mensual
     * - Top 10 organizaciones
     */
    const useDashboard = () => {
        return useQuery({
            queryKey: ['superadmin', 'dashboard'],
            queryFn: async () => {
                const { data } = await api.get('/superadmin/dashboard');
                return data.data;
            },
            refetchInterval: 30000, // Refetch cada 30 segundos
            staleTime: 10000 // Considerar datos stale después de 10s
        });
    };

    /**
     * ====================================================================
     * MÉTRICAS SAAS (Nexo Team - Dogfooding)
     * ====================================================================
     * Obtiene métricas SaaS reales del módulo suscripciones-negocio:
     * - MRR, ARR, Churn Rate, Suscriptores activos
     * - Distribución por estado
     * - Top planes
     */
    const useMetricasSaaS = () => {
        return useQuery({
            queryKey: ['superadmin', 'metricas-saas'],
            queryFn: async () => {
                const { data } = await api.get('/superadmin/metricas-saas');
                return data.data;
            },
            refetchInterval: 60000, // Refetch cada minuto
            staleTime: 30000 // Considerar datos stale después de 30s
        });
    };

    /**
     * ====================================================================
     * ORGANIZACIONES
     * ====================================================================
     */

    /**
     * Listar organizaciones con filtros
     * @param {Object} filtros - Filtros de búsqueda
     * @param {number} filtros.page - Número de página
     * @param {number} filtros.limit - Registros por página
     * @param {string} filtros.busqueda - Búsqueda por nombre o email
     * @param {string} filtros.plan - Filtrar por plan
     * @param {string} filtros.estado - Filtrar por estado
     * @param {string} filtros.orden - Campo para ordenar
     * @param {string} filtros.direccion - ASC o DESC
     */
    const useOrganizaciones = (filtros = {}) => {
        return useQuery({
            queryKey: ['superadmin', 'organizaciones', filtros],
            queryFn: async () => {
                const { data } = await api.get('/superadmin/organizaciones', {
                    params: filtros
                });
                return data;
            },
            keepPreviousData: true, // Mantener datos anteriores durante cambio de página
            staleTime: 30000
        });
    };

    /**
     * ====================================================================
     * PLANES
     * ====================================================================
     */

    /**
     * Listar todos los planes con contador de organizaciones
     */
    const usePlanes = () => {
        return useQuery({
            queryKey: ['superadmin', 'planes'],
            queryFn: async () => {
                const { data } = await api.get('/superadmin/planes');
                return data.data;
            },
            staleTime: 60000 // Los planes cambian raramente
        });
    };

    /**
     * Actualizar configuración de un plan
     */
    const actualizarPlan = useMutation({
        mutationFn: async ({ id, ...planData }) => {
            const { data } = await api.put(`/superadmin/planes/${id}`, planData);
            return data.data;
        },
        onSuccess: () => {
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'planes'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'organizaciones'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'], refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'Plan'),
    });

    /**
     * ====================================================================
     * GESTIÓN DE ORGANIZACIONES
     * ====================================================================
     */

    /**
     * Cambiar plan de una organización
     * Usa endpoint existente: PUT /organizaciones/:id/plan
     */
    const cambiarPlanOrganizacion = useMutation({
        mutationFn: async ({ organizacionId, codigo_plan }) => {
            const { data } = await api.put(
                `/organizaciones/${organizacionId}/plan`,
                { codigo_plan }
            );
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'organizaciones'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'], refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'Organizacion', {
            400: 'Plan inválido',
        }),
    });

    /**
     * Suspender una organización
     * Usa endpoint existente: PUT /organizaciones/:id/suspender
     */
    const suspenderOrganizacion = useMutation({
        mutationFn: async ({ organizacionId, motivo }) => {
            const { data } = await api.put(
                `/organizaciones/${organizacionId}/suspender`,
                { motivo }
            );
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'organizaciones'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'], refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'Organizacion', {
            400: 'No se puede suspender la organizacion',
        }),
    });

    /**
     * Reactivar una organización
     * Usa endpoint existente: PUT /organizaciones/:id/reactivar
     */
    const reactivarOrganizacion = useMutation({
        mutationFn: async (organizacionId) => {
            const { data } = await api.put(
                `/organizaciones/${organizacionId}/reactivar`
            );
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'organizaciones'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'], refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'Organizacion', {
            400: 'No se puede reactivar la organizacion',
        }),
    });

    return {
        // Queries
        useDashboard,
        useMetricasSaaS,
        useOrganizaciones,
        usePlanes,

        // Mutations
        actualizarPlan,
        cambiarPlanOrganizacion,
        suspenderOrganizacion,
        reactivarOrganizacion
    };
};

export default useSuperAdmin;
