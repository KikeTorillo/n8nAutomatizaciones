/**
 * Layout principal para el panel de Super Admin
 */

import { Outlet, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function SuperAdminLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                                className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded text-sm font-medium transition-colors"
                            >
                                Cerrar Sesión
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
