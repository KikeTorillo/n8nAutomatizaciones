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
            {/* Header */}
            <header className="bg-red-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold">🔴 SUPER ADMIN PANEL</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm">
                                {user?.nombre} ({user?.email})
                            </span>
                            <button
                                onClick={handleLogout}
                                disabled={logoutMutation.isPending}
                                className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar Sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white shadow-md border-b">
                <div className="container mx-auto px-4">
                    <div className="flex space-x-8">
                        <Link
                            to="/superadmin"
                            className="py-4 px-2 border-b-2 border-transparent hover:border-red-600 text-gray-700 hover:text-red-600 font-medium transition-colors"
                        >
                            📊 Dashboard
                        </Link>
                        <Link
                            to="/superadmin/organizaciones"
                            className="py-4 px-2 border-b-2 border-transparent hover:border-red-600 text-gray-700 hover:text-red-600 font-medium transition-colors"
                        >
                            🏢 Organizaciones
                        </Link>
                        <Link
                            to="/superadmin/planes"
                            className="py-4 px-2 border-b-2 border-transparent hover:border-red-600 text-gray-700 hover:text-red-600 font-medium transition-colors"
                        >
                            💳 Planes
                        </Link>
                        <Link
                            to="/superadmin/planes/mercadopago"
                            className="py-4 px-2 border-b-2 border-transparent hover:border-red-600 text-gray-700 hover:text-red-600 font-medium transition-colors"
                        >
                            🔄 Sincronización MP
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}
