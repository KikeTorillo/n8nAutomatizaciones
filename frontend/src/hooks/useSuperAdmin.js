/**
 * Hook personalizado para operaciones de Super Admin
 * Gestiona métricas globales, organizaciones y planes del sistema
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/client';

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
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'planes'] });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'organizaciones'] });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
        },
        onError: (error) => {
            // Priorizar mensaje del backend si existe
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }

            // Fallback a mensajes genéricos por código de error
            const errorMessages = {
                404: 'Plan no encontrado',
                400: 'Datos inválidos. Revisa los campos',
                500: 'Error del servidor. Intenta nuevamente',
            };

            const statusCode = error.response?.status;
            const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al actualizar plan';

            throw new Error(message);
        }
    });

    /**
     * Sincronizar planes con Mercado Pago
     * Permite sincronizar todos los planes o solo algunos específicos
     */
    const sincronizarPlanes = useMutation({
        mutationFn: async (data = {}) => {
            const { data: response } = await api.post(
                '/superadmin/planes/sync-mercadopago',
                data
            );
            return response.data;
        },
        onSuccess: () => {
            // Invalidar queries relacionadas para refrescar datos
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'planes'] });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
        },
        onError: (error) => {
            // Priorizar mensaje del backend si existe
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }

            // Fallback a mensajes genéricos por código de error
            const errorMessages = {
                400: 'Datos inválidos',
                500: 'Error del servidor al sincronizar planes',
            };

            const statusCode = error.response?.status;
            const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al sincronizar planes';

            throw new Error(message);
        }
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
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'organizaciones'] });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }

            const errorMessages = {
                404: 'Organización no encontrada',
                400: 'Plan inválido',
                500: 'Error del servidor',
            };

            const statusCode = error.response?.status;
            const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al cambiar plan';

            throw new Error(message);
        }
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
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'organizaciones'] });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }

            const errorMessages = {
                404: 'Organización no encontrada',
                400: 'No se puede suspender la organización',
                500: 'Error del servidor',
            };

            const statusCode = error.response?.status;
            const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al suspender organización';

            throw new Error(message);
        }
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
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'organizaciones'] });
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }

            const errorMessages = {
                404: 'Organización no encontrada',
                400: 'No se puede reactivar la organización',
                500: 'Error del servidor',
            };

            const statusCode = error.response?.status;
            const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al reactivar organización';

            throw new Error(message);
        }
    });

    return {
        // Queries
        useDashboard,
        useOrganizaciones,
        usePlanes,

        // Mutations
        actualizarPlan,
        sincronizarPlanes,
        cambiarPlanOrganizacion,
        suspenderOrganizacion,
        reactivarOrganizacion
    };
};

export default useSuperAdmin;
