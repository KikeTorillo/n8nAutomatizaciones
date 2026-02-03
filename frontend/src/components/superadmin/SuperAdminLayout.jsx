/**
 * Layout principal para el panel de Super Admin
 * Alineado con los patrones UI del Home
 */

import { Outlet, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Shield, Home } from 'lucide-react';
import { authApi } from '@/services/api/endpoints';
import { Button, ThemeToggle, ConfirmDialog } from '@/components/ui';
import { useModalManager } from '@/hooks/utils';
import useAuthStore, { selectUser, selectLogout } from '../../store/authStore';
import useOnboardingStore, { selectResetOnboarding } from '../../store/onboardingStore';
import useSucursalStore, { selectClear as selectClearSucursal } from '../../store/sucursalStore';
import usePermisosStore, { selectClear as selectClearPermisos } from '../../store/permisosStore';
import SuperAdminNavTabs from './SuperAdminNavTabs';

export default function SuperAdminLayout() {
    const user = useAuthStore(selectUser);
    const clearAuth = useAuthStore(selectLogout);
    const resetOnboarding = useOnboardingStore(selectResetOnboarding);
    const clearSucursal = useSucursalStore(selectClearSucursal);
    const clearPermisos = usePermisosStore(selectClearPermisos);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Modales centralizados
    const { openModal, closeModal, isOpen } = useModalManager({
        logout: { isOpen: false },
    });

    // Mutation de logout
    // Feb 2026: Invalidar queries específicas en lugar de clear() para mejor UX
    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuario'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['organizacion'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['modulos'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['sucursales'], refetchType: 'active' });
            resetOnboarding();
            clearSucursal();
            clearPermisos();
            clearAuth();
            navigate('/login');
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ['usuario'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['organizacion'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['modulos'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['sucursales'], refetchType: 'active' });
            resetOnboarding();
            clearSucursal();
            clearPermisos();
            clearAuth();
            navigate('/login');
        },
    });

    const handleLogout = () => openModal('logout');
    const confirmLogout = () => {
        closeModal('logout');
        logoutMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header - Mismo estilo que Home */}
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo y título */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Super Admin
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Panel de administración
                                </p>
                            </div>
                        </div>

                        {/* Acciones del header */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Ir a Mi Organización */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/home')}
                                className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Mi Org</span>
                            </Button>

                            {/* Toggle de tema */}
                            <ThemeToggle />

                            {/* Nombre de usuario (solo desktop) */}
                            <span className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
                                {user?.nombre}
                            </span>

                            {/* Botón Salir */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                isLoading={logoutMutation.isPending}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Salir
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Navigation Tabs */}
            <SuperAdminNavTabs />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>

            {/* Modal de confirmación de logout */}
            <ConfirmDialog
                isOpen={isOpen('logout')}
                onClose={() => closeModal('logout')}
                onConfirm={confirmLogout}
                title="Cerrar Sesión"
                message="¿Estás seguro que deseas cerrar sesión?"
                confirmText="Cerrar Sesión"
                cancelText="Cancelar"
                variant="warning"
                isLoading={logoutMutation.isPending}
            />
        </div>
    );
}
