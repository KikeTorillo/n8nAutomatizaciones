/**
 * Layout principal para el panel de Super Admin
 */

import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api/endpoints';
import useAuthStore, { selectUser, selectLogout } from '../../store/authStore';
import useOnboardingStore, { selectResetOnboarding } from '../../store/onboardingStore';
import useSucursalStore, { selectClear as selectClearSucursal } from '../../store/sucursalStore';
import usePermisosStore, { selectClear as selectClearPermisos } from '../../store/permisosStore';

export default function SuperAdminLayout() {
    const user = useAuthStore(selectUser);
    const clearAuth = useAuthStore(selectLogout);
    // Ene 2026: Usar selectores para evitar re-renders
    const resetOnboarding = useOnboardingStore(selectResetOnboarding);
    const clearSucursal = useSucursalStore(selectClearSucursal);
    const clearPermisos = usePermisosStore(selectClearPermisos);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Mutation de logout - Ene 2026: Limpieza completa de todos los stores
    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            console.log('✅ Logout exitoso desde SuperAdmin');

            // 🧹 CRÍTICO: Limpiar cache de React Query al cerrar sesión
            queryClient.clear();
            console.log('✅ Cache de React Query limpiado');

            // 🧹 Ene 2026: Limpiar todos los stores
            resetOnboarding();
            clearSucursal();
            clearPermisos();
            console.log('✅ Stores limpiados');

            clearAuth();
            navigate('/login');
        },
        onError: (error) => {
            console.error('❌ Error en logout:', error);

            // Limpiar cache incluso si hay error
            queryClient.clear();
            resetOnboarding();
            clearSucursal();
            clearPermisos();

            clearAuth();
            navigate('/login');
        },
    });

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Header - Mobile First */}
            <header className="bg-primary-600 dark:bg-primary-700 text-white shadow-lg">
                <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
                    {/* Mobile: Stack, Desktop: Row */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-lg sm:text-2xl font-bold">SUPER ADMIN</h1>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                            <span className="text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">
                                {user?.nombre}
                            </span>
                            <button
                                onClick={handleLogout}
                                disabled={logoutMutation.isPending}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-700 dark:bg-primary-800 hover:bg-primary-800 dark:hover:bg-primary-900 rounded text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar Sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation - Scrollable on mobile */}
            <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <div className="container mx-auto px-2 sm:px-4">
                    <div className="flex min-w-max sm:min-w-0">
                        <Link
                            to="/superadmin"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-primary-600 dark:hover:border-primary-500 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">📊 </span>Dashboard
                        </Link>
                        <Link
                            to="/superadmin/organizaciones"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-primary-600 dark:hover:border-primary-500 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">🏢 </span>Orgs
                        </Link>
                        <Link
                            to="/superadmin/planes"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-primary-600 dark:hover:border-primary-500 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">💳 </span>Planes
                        </Link>
                        <Link
                            to="/superadmin/marketplace"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-primary-600 dark:hover:border-primary-500 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">🛍️ </span>Market
                        </Link>
                        <Link
                            to="/superadmin/plantillas-eventos"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-primary-600 dark:hover:border-primary-500 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">🎨 </span>Plantillas
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
                <Outlet />
            </main>
        </div>
    );
}
