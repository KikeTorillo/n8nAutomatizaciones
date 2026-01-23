/**
 * Dashboard del Super Administrador
 * Vista consolidada con métricas globales + listado de organizaciones
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Users, Calendar, UserCircle, Eye, Ban, CheckCircle, DollarSign, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { useSuperAdmin } from '@/hooks/sistema';
import {
    StatCardGrid,
    Badge,
    DataTable,
    SearchInput,
    Select,
    ConfirmDialog,
    DropdownMenu,
    Input,
} from '@/components/ui';
import { useToast } from '@/hooks/utils/useToast';
import OrganizacionDrawer from '@/components/superadmin/OrganizacionDrawer';

// Helper para formatear moneda MXN
const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Opciones de filtro de estado
const OPCIONES_ESTADO = [
    { value: 'activo', label: 'Activas' },
    { value: 'inactivo', label: 'Inactivas' },
    { value: 'suspendido', label: 'Suspendidas' },
];

export default function SuperAdminDashboard() {
    const toast = useToast();
    const { useDashboard, useOrganizaciones, usePlanes, useMetricasSaaS, suspenderOrganizacion, reactivarOrganizacion } = useSuperAdmin();

    // Query del dashboard (métricas operativas)
    const { data: dashboardData, isLoading: isLoadingDashboard, error: errorDashboard } = useDashboard();

    // Query de métricas SaaS (Nexo Team)
    const { data: metricasSaaS, isLoading: isLoadingMetricas } = useMetricasSaaS();

    // Estado de filtros para organizaciones (paginación servidor)
    const [filtros, setFiltros] = useState({
        page: 1,
        limit: 15,
        busqueda: '',
        estado: undefined,
        plan: undefined,
    });

    // Input de búsqueda
    const [busquedaInput, setBusquedaInput] = useState('');

    // Handler para búsqueda con debounce (SearchInput ya tiene debounce interno)
    const handleBusquedaChange = useCallback((e) => {
        setBusquedaInput(e.target.value);
    }, []);

    // Callback cuando se ejecuta el debounce del SearchInput
    const handleBusquedaDebounced = useCallback((value) => {
        setFiltros((prev) => ({ ...prev, busqueda: value, page: 1 }));
    }, []);

    // Query de organizaciones
    const { data: orgsData, isLoading: isLoadingOrgs } = useOrganizaciones(filtros);

    // Query de planes para el filtro
    const { data: planes } = usePlanes();

    // Opciones de planes para el select
    const opcionesPlanes = useMemo(() => {
        if (!planes) return [];
        return planes.map((plan) => ({
            value: plan.id.toString(),
            label: plan.nombre_plan,
        }));
    }, [planes]);

    // Estados para modales
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [orgSeleccionada, setOrgSeleccionada] = useState(null);
    const [confirmSuspender, setConfirmSuspender] = useState({ open: false, org: null });
    const [confirmReactivar, setConfirmReactivar] = useState({ open: false, org: null });
    const [motivoSuspension, setMotivoSuspension] = useState('');

    // Handlers
    const handleVerDetalle = useCallback((org) => {
        setOrgSeleccionada(org);
        setDrawerOpen(true);
    }, []);

    const handleSuspender = useCallback((org) => {
        setMotivoSuspension('');
        setConfirmSuspender({ open: true, org });
    }, []);

    const handleReactivar = useCallback((org) => {
        setConfirmReactivar({ open: true, org });
    }, []);

    const handleEstadoChange = useCallback((e) => {
        const valor = e.target.value || undefined;
        setFiltros((prev) => ({ ...prev, estado: valor, page: 1 }));
    }, []);

    const handlePlanChange = useCallback((e) => {
        const valor = e.target.value || undefined;
        setFiltros((prev) => ({ ...prev, plan: valor, page: 1 }));
    }, []);

    const handlePageChange = useCallback((page) => {
        setFiltros((prev) => ({ ...prev, page }));
    }, []);

    const handleLimpiarFiltros = useCallback(() => {
        setBusquedaInput('');
        setFiltros({ page: 1, limit: 15, busqueda: '', estado: undefined, plan: undefined });
    }, []);

    // Columnas para DataTable (dentro del componente para acceso a handlers)
    const columns = useMemo(() => [
        {
            key: 'nombre_comercial',
            header: 'Organización',
            width: 'lg',
            render: (row) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                        {row.nombre_comercial}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {row.email_admin}
                    </div>
                </div>
            ),
        },
        {
            key: 'nombre_plan',
            header: 'Plan',
            hideOnMobile: true,
            render: (row) => (
                <span className="text-sm text-gray-900 dark:text-gray-100">
                    {row.nombre_plan || row.plan_actual || '-'}
                </span>
            ),
        },
        {
            key: 'activo',
            header: 'Estado',
            render: (row) => {
                if (row.suspendido) {
                    return <Badge variant="error" size="sm">Suspendida</Badge>;
                }
                return row.activo
                    ? <Badge variant="success" size="sm">Activa</Badge>
                    : <Badge variant="default" size="sm">Inactiva</Badge>;
            },
        },
        {
            key: 'uso_citas_mes_actual',
            header: 'Uso',
            align: 'right',
            hideOnMobile: true,
            render: (row) => (
                <span className="text-sm text-gray-900 dark:text-gray-100">
                    {row.uso_citas_mes_actual || row.citas_mes || 0} citas
                </span>
            ),
        },
        {
            key: 'acciones',
            header: '',
            width: 'sm',
            render: (row) => (
                <DropdownMenu
                    items={[
                        { label: 'Ver detalle', icon: Eye, onClick: () => handleVerDetalle(row) },
                        { divider: true },
                        row.suspendido
                            ? { label: 'Reactivar', icon: CheckCircle, onClick: () => handleReactivar(row) }
                            : { label: 'Suspender', icon: Ban, onClick: () => handleSuspender(row), variant: 'danger' },
                    ]}
                />
            ),
        },
    ], [handleVerDetalle, handleSuspender, handleReactivar]);

    // Confirmar suspensión
    const confirmarSuspension = useCallback(() => {
        if (!confirmSuspender.org || !motivoSuspension || motivoSuspension.length < 10) {
            toast.error('El motivo debe tener al menos 10 caracteres');
            return;
        }
        suspenderOrganizacion.mutate(
            { organizacionId: confirmSuspender.org.id, motivo: motivoSuspension },
            {
                onSuccess: () => {
                    toast.success('Organización suspendida correctamente');
                    setConfirmSuspender({ open: false, org: null });
                    setDrawerOpen(false);
                },
            }
        );
    }, [confirmSuspender.org, motivoSuspension, suspenderOrganizacion, toast]);

    // Confirmar reactivación
    const confirmarReactivacion = useCallback(() => {
        if (!confirmReactivar.org) return;
        reactivarOrganizacion.mutate(confirmReactivar.org.id, {
            onSuccess: () => {
                toast.success('Organización reactivada correctamente');
                setConfirmReactivar({ open: false, org: null });
                setDrawerOpen(false);
            },
        });
    }, [confirmReactivar.org, reactivarOrganizacion, toast]);

    // Loading del dashboard
    if (isLoadingDashboard || isLoadingMetricas) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 dark:border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    // Error del dashboard
    if (errorDashboard) {
        return (
            <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-red-800 dark:text-red-300 font-bold text-lg mb-2">Error al cargar dashboard</h3>
                <p className="text-red-700 dark:text-red-400">{errorDashboard.message}</p>
            </div>
        );
    }

    const { metricas } = dashboardData;
    const hayFiltrosActivos = busquedaInput || filtros.estado || filtros.plan;

    // Calcular suscriptores en trial desde distribución
    const enTrial = metricasSaaS?.distribucion_por_estado?.find(d => d.estado === 'trial')?.cantidad || 0;

    // Configuración para StatCardGrid con métricas SaaS
    const stats = [
        {
            icon: DollarSign,
            label: 'MRR',
            value: formatCurrency(metricasSaaS?.mrr || 0),
            subtext: `ARR: ${formatCurrency(metricasSaaS?.arr || 0)}`,
            color: 'green',
        },
        {
            icon: Building2,
            label: 'Suscriptores',
            value: metricasSaaS?.suscriptores_activos || 0,
            subtext: `${metricasSaaS?.organizaciones?.orgs_activas || metricas?.organizaciones_activas || 0} orgs activas`,
            color: 'primary',
        },
        {
            icon: Clock,
            label: 'En Trial',
            value: enTrial,
            subtext: 'por convertir',
            color: 'yellow',
        },
        {
            icon: (metricasSaaS?.churn_rate || 0) > 5 ? TrendingDown : TrendingUp,
            label: 'Churn Rate',
            value: `${metricasSaaS?.churn_rate || 0}%`,
            subtext: 'este mes',
            color: (metricasSaaS?.churn_rate || 0) > 5 ? 'red' : 'green',
        },
    ];

    // Datos de paginación del servidor
    const organizaciones = orgsData?.data || [];
    const paginacion = orgsData?.pagination;

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

            {/* Métricas Globales con StatCardGrid */}
            <StatCardGrid stats={stats} columns={4} />

            {/* Alertas */}
            {parseInt(metricas.organizaciones_suspendidas || 0) > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 rounded-r-lg p-4">
                    <p className="text-orange-800 dark:text-orange-300 font-medium">
                        {metricas.organizaciones_suspendidas} organizaciones suspendidas
                    </p>
                </div>
            )}

            {/* Card de Organizaciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                {/* Header del card */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Todas las Organizaciones
                    </h2>

                    {/* Filtros */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <SearchInput
                                value={busquedaInput}
                                onChange={handleBusquedaChange}
                                onSearch={handleBusquedaDebounced}
                                placeholder="Buscar por nombre o email..."
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Select
                                value={filtros.estado || ''}
                                onChange={handleEstadoChange}
                                options={OPCIONES_ESTADO}
                                placeholder="Todos los estados"
                                className="w-full sm:w-44"
                            />
                            <Select
                                value={filtros.plan || ''}
                                onChange={handlePlanChange}
                                options={opcionesPlanes}
                                placeholder="Todos los planes"
                                className="w-full sm:w-44"
                            />
                            {hayFiltrosActivos && (
                                <button
                                    onClick={handleLimpiarFiltros}
                                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors whitespace-nowrap"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* DataTable */}
                <DataTable
                    columns={columns}
                    data={organizaciones}
                    isLoading={isLoadingOrgs}
                    pagination={paginacion}
                    onPageChange={handlePageChange}
                    onRowClick={handleVerDetalle}
                    emptyState={{
                        icon: Building2,
                        title: hayFiltrosActivos ? 'Sin resultados' : 'No hay organizaciones',
                        description: hayFiltrosActivos
                            ? 'No se encontraron organizaciones con los filtros aplicados'
                            : 'No hay organizaciones registradas en el sistema',
                    }}
                    hoverable
                />
            </div>

            {/* Drawer de detalle */}
            <OrganizacionDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                organizacion={orgSeleccionada}
                onSuspender={handleSuspender}
                onReactivar={handleReactivar}
                isLoadingAction={suspenderOrganizacion.isPending || reactivarOrganizacion.isPending}
            />

            {/* ConfirmDialog para suspender */}
            <ConfirmDialog
                isOpen={confirmSuspender.open}
                onClose={() => setConfirmSuspender({ open: false, org: null })}
                onConfirm={confirmarSuspension}
                title="Suspender Organización"
                message={
                    <div className="space-y-4">
                        <p>
                            ¿Estás seguro que deseas suspender a{' '}
                            <strong>{confirmSuspender.org?.nombre_comercial}</strong>?
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Los usuarios de esta organización no podrán acceder al sistema.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Motivo de suspensión (requerido)
                            </label>
                            <Input
                                value={motivoSuspension}
                                onChange={(e) => setMotivoSuspension(e.target.value)}
                                placeholder="Ingrese el motivo de la suspensión (mínimo 10 caracteres)"
                            />
                        </div>
                    </div>
                }
                confirmText="Suspender"
                cancelText="Cancelar"
                variant="danger"
                isLoading={suspenderOrganizacion.isPending}
            />

            {/* ConfirmDialog para reactivar */}
            <ConfirmDialog
                isOpen={confirmReactivar.open}
                onClose={() => setConfirmReactivar({ open: false, org: null })}
                onConfirm={confirmarReactivacion}
                title="Reactivar Organización"
                message={
                    <>
                        ¿Estás seguro que deseas reactivar a{' '}
                        <strong>{confirmReactivar.org?.nombre_comercial}</strong>?
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Los usuarios de esta organización podrán acceder nuevamente al sistema.
                        </p>
                    </>
                }
                confirmText="Reactivar"
                cancelText="Cancelar"
                variant="success"
                isLoading={reactivarOrganizacion.isPending}
            />
        </div>
    );
}
