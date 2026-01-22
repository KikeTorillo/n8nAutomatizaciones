/**
 * Dashboard del Super Administrador
 * Vista global con métricas del sistema completo
 */

import { useSuperAdmin } from '@/hooks/sistema';
import MetricCard from '../../components/superadmin/MetricCard';

export default function SuperAdminDashboard() {
    const { useDashboard } = useSuperAdmin();
    const { data, isLoading, error } = useDashboard();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 dark:border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-red-800 dark:text-red-300 font-bold text-lg mb-2">Error al cargar dashboard</h3>
                <p className="text-red-700 dark:text-red-400">{error.message}</p>
            </div>
        );
    }

    const { metricas, top_organizaciones } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Panel Super Administrador
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Vista global del sistema - Actualizado en tiempo real
                </p>
            </div>

            {/* Métricas Globales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Organizaciones Activas"
                    value={metricas.organizaciones_activas}
                    subtitle={`${metricas.organizaciones_total} totales`}
                    icon="🏢"
                    color="blue"
                />
                <MetricCard
                    title="Usuarios Totales"
                    value={metricas.usuarios_totales}
                    subtitle="Usuarios activos en el sistema"
                    icon="👥"
                    color="green"
                />
                <MetricCard
                    title="Citas Este Mes"
                    value={parseInt(metricas.citas_mes_actual || 0).toLocaleString()}
                    subtitle="Citas agendadas"
                    icon="📅"
                    color="purple"
                />
                <MetricCard
                    title="Clientes Totales"
                    value={parseInt(metricas.clientes_totales || 0).toLocaleString()}
                    subtitle={`${metricas.profesionales_totales || 0} profesionales`}
                    icon="👤"
                    color="yellow"
                />
            </div>

            {/* Alertas */}
            {parseInt(metricas.organizaciones_suspendidas || 0) > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Alertas del Sistema</h2>

                    <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 rounded-r-lg p-4">
                        <p className="text-orange-800 dark:text-orange-300 font-medium">
                            🔒 {metricas.organizaciones_suspendidas} organizaciones suspendidas
                        </p>
                    </div>
                </div>
            )}

            {/* Top Organizaciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                    Top 10 Organizaciones por Uso
                </h2>

                {top_organizaciones && top_organizaciones.length > 0 ? (
                    <div className="space-y-3">
                        {top_organizaciones.map((org, index) => (
                            <div
                                key={org.id}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                            >
                                <div className="flex items-center space-x-4 flex-1">
                                    <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 w-8">
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {org.nombre_comercial}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Plan {org.plan_actual || 'pro'}
                                            {org.suspendido && (
                                                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                                                    suspendida
                                                </span>
                                            )}
                                            {!org.activo && !org.suspendido && (
                                                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                                    inactiva
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {org.citas_mes || 0} citas
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {org.total_profesionales || 0} profesionales • {org.total_clientes || 0} clientes
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No hay organizaciones activas en el sistema
                    </p>
                )}
            </div>
        </div>
    );
}
