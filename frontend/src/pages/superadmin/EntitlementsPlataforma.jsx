/**
 * ====================================================================
 * ENTITLEMENTS PLATAFORMA PAGE
 * ====================================================================
 * Página exclusiva para SuperAdmin que permite gestionar los entitlements
 * (límites y módulos) de los planes de Nexo Team.
 *
 * Muestra una tabla con todos los planes y permite editar sus límites
 * y módulos activos mediante un drawer.
 *
 * @module pages/superadmin/EntitlementsPlataforma
 */

import { useState } from 'react';
import { Settings, Package, Layers } from 'lucide-react';
import { DataTable, Button, Badge, PageHeader } from '@/components/ui';
import { usePlanesEntitlements } from '@/hooks/superadmin/useEntitlements';
import EntitlementsFormDrawer from '@/components/superadmin/EntitlementsFormDrawer';

/**
 * Página de gestión de Entitlements de Plataforma
 */
function EntitlementsPlataforma() {
    const { data, isLoading } = usePlanesEntitlements();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [planSeleccionado, setPlanSeleccionado] = useState(null);

    const planes = data?.planes || [];
    const modulosDisponibles = data?.modulosDisponibles || [];

    /**
     * Abrir drawer de edición
     */
    const handleEditar = (plan) => {
        setPlanSeleccionado(plan);
        setDrawerOpen(true);
    };

    /**
     * Cerrar drawer
     */
    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setPlanSeleccionado(null);
    };

    /**
     * Formatear texto de usuarios para la tabla
     */
    const formatUsuarios = (plan) => {
        const base = plan.usuarios_incluidos || 0;
        const max = plan.max_usuarios_hard;
        const extra = plan.precio_usuario_adicional;

        if (max) {
            return `${base} (máx ${max})`;
        }
        if (extra) {
            return `${base} (+$${extra}/extra)`;
        }
        return `${base}`;
    };

    /**
     * Definición de columnas para DataTable
     */
    const columns = [
        {
            key: 'nombre',
            header: 'Plan',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-500" />
                    <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {row.nombre}
                        </span>
                        {row.codigo && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                ({row.codigo})
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'precio',
            header: 'Precio',
            render: (row) => (
                <span className="text-gray-700 dark:text-gray-300">
                    ${parseFloat(row.precio_mensual || 0).toFixed(2)}/mes
                </span>
            )
        },
        {
            key: 'usuarios',
            header: 'Usuarios',
            render: (row) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {formatUsuarios(row)}
                </span>
            )
        },
        {
            key: 'modulos',
            header: 'Módulos',
            render: (row) => {
                const count = (row.modulos_habilitados || []).length;
                return (
                    <Badge variant={count > 0 ? 'default' : 'secondary'}>
                        {count} módulo{count !== 1 ? 's' : ''}
                    </Badge>
                );
            }
        },
        {
            key: 'activo',
            header: 'Estado',
            render: (row) => (
                <Badge variant={row.activo ? 'success' : 'secondary'}>
                    {row.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            )
        },
        {
            key: 'acciones',
            header: '',
            width: 'sm',
            render: (row) => (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditar(row)}
                >
                    Editar
                </Button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                backTo="/"
                backLabel="Inicio"
                icon={Settings}
                iconColor="primary"
                title="Entitlements de Plataforma"
                subtitle="Configura los límites y módulos que aplican a las organizaciones según su plan"
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <DataTable
                    columns={columns}
                    data={planes}
                    isLoading={isLoading}
                    emptyState={{
                        icon: Package,
                        title: 'No hay planes',
                        description: 'Crea planes en Suscripciones para configurar sus entitlements'
                    }}
                />
            </div>

            <EntitlementsFormDrawer
                isOpen={drawerOpen}
                onClose={handleCloseDrawer}
                plan={planSeleccionado}
                modulosDisponibles={modulosDisponibles}
            />
        </div>
    );
}

export default EntitlementsPlataforma;
