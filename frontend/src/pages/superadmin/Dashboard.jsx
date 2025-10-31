/**
 * Dashboard del Super Administrador
 * Vista global con métricas del sistema completo
 */

import useSuperAdmin from '../../hooks/useSuperAdmin';
import MetricCard from '../../components/superadmin/MetricCard';

export default function SuperAdminDashboard() {
    const { useDashboard } = useSuperAdmin();
    const { data, isLoading, error } = useDashboard();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <h3 className="text-red-800 font-bold text-lg mb-2">Error al cargar dashboard</h3>
                <p className="text-red-700">{error.message}</p>
            </div>
        );
    }

    const { metricas, top_organizaciones } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Panel Super Administrador
                </h1>
                <p className="text-gray-600 mt-1">
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
                    value={parseInt(metricas.citas_mes_actual).toLocaleString()}
                    subtitle="Citas agendadas"
                    icon="📅"
                    color="purple"
                />
                <MetricCard
                    title="Revenue Mensual"
                    value={`$${parseFloat(metricas.revenue_mensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    subtitle="MXN"
                    icon="💰"
                    color="yellow"
                />
            </div>

            {/* Alertas */}
            {(metricas.organizaciones_morosas > 0 ||
                metricas.organizaciones_suspendidas > 0 ||
                metricas.organizaciones_trial > 0) && (
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900">Alertas del Sistema</h2>

                    {parseInt(metricas.organizaciones_morosas) > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                            <p className="text-red-800 font-medium">
                                ⚠️ {metricas.organizaciones_morosas} organizaciones en estado moroso
                            </p>
                        </div>
                    )}

                    {parseInt(metricas.organizaciones_suspendidas) > 0 && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-r-lg p-4">
                            <p className="text-orange-800 font-medium">
                                🔒 {metricas.organizaciones_suspendidas} organizaciones suspendidas
                            </p>
                        </div>
                    )}

                    {parseInt(metricas.organizaciones_trial) > 0 && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                            <p className="text-blue-800 font-medium">
                                🆓 {metricas.organizaciones_trial} organizaciones en periodo de prueba
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Top Organizaciones */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900">
                    Top 10 Organizaciones por Uso
                </h2>

                {top_organizaciones && top_organizaciones.length > 0 ? (
                    <div className="space-y-3">
                        {top_organizaciones.map((org, index) => (
                            <div
                                key={org.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                <div className="flex items-center space-x-4 flex-1">
                                    <span className="text-2xl font-bold text-gray-400 w-8">
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">
                                            {org.nombre_comercial}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Plan {org.nombre_plan || org.plan_actual}
                                            {org.estado_subscripcion && (
                                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                                    org.estado_subscripcion === 'activa' ? 'bg-green-100 text-green-800' :
                                                    org.estado_subscripcion === 'trial' ? 'bg-blue-100 text-blue-800' :
                                                    org.estado_subscripcion === 'morosa' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {org.estado_subscripcion}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-gray-900">
                                        {org.uso_citas_mes_actual || 0} citas
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {org.uso_profesionales || 0} profesionales • {org.uso_clientes || 0} clientes
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">
                        No hay organizaciones activas en el sistema
                    </p>
                )}
            </div>
        </div>
    );
}
