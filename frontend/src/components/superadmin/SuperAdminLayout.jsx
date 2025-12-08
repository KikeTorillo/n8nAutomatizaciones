/**
 * Layout principal para el panel de Super Admin
 */

import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api/endpoints';
import useAuthStore from '../../store/authStore';
import useOnboardingStore from '../../store/onboardingStore';

export default function SuperAdminLayout() {
    const { user, logout: clearAuth } = useAuthStore();
    const { resetOnboarding } = useOnboardingStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Mutation de logout (igual que Dashboard normal)
    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            console.log('✅ Logout exitoso desde SuperAdmin');

            // 🧹 CRÍTICO: Limpiar cache de React Query al cerrar sesión
            queryClient.clear();
            console.log('✅ Cache de React Query limpiado');

            // 🧹 CRÍTICO: Limpiar onboarding storage
            resetOnboarding();
            console.log('✅ Onboarding storage limpiado');

            clearAuth();
            navigate('/login');
        },
        onError: (error) => {
            console.error('❌ Error en logout:', error);

            // Limpiar cache incluso si hay error
            queryClient.clear();
            resetOnboarding();

            clearAuth();
            navigate('/login');
        },
    });

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header - Mobile First */}
            <header className="bg-red-600 text-white shadow-lg">
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
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-700 hover:bg-red-800 rounded text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar Sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation - Scrollable on mobile */}
            <nav className="bg-white shadow-md border-b overflow-x-auto">
                <div className="container mx-auto px-2 sm:px-4">
                    <div className="flex min-w-max sm:min-w-0">
                        <Link
                            to="/superadmin"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-red-600 text-gray-700 hover:text-red-600 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">📊 </span>Dashboard
                        </Link>
                        <Link
                            to="/superadmin/organizaciones"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-red-600 text-gray-700 hover:text-red-600 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">🏢 </span>Orgs
                        </Link>
                        <Link
                            to="/superadmin/planes"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-red-600 text-gray-700 hover:text-red-600 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">💳 </span>Planes
                        </Link>
                        <Link
                            to="/superadmin/marketplace"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-red-600 text-gray-700 hover:text-red-600 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">🛍️ </span>Market
                        </Link>
                        <Link
                            to="/superadmin/plantillas-eventos"
                            className="py-3 px-3 sm:py-4 sm:px-4 border-b-2 border-transparent hover:border-red-600 text-gray-700 hover:text-red-600 text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
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
