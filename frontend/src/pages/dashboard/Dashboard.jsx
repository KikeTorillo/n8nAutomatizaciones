import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import { LogOut, Calendar, Users, Settings } from 'lucide-react';

/**
 * Dashboard Principal
 */
function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container-custom py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                Bienvenido, {user?.nombre_completo || 'Usuario'}
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container-custom py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Citas</h3>
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-600">Citas hoy</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Profesionales</h3>
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-600">Activos</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
              <Settings className="w-8 h-8 text-primary-600" />
            </div>
            <Button className="w-full mt-4">
              Ir a Configuración
            </Button>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información de la Cuenta
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Rol:</span>
              <p className="font-medium text-gray-900 capitalize">{user?.rol}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Organización ID:</span>
              <p className="font-medium text-gray-900">{user?.organizacion_id}</p>
            </div>
          </div>
        </div>

        {/* Estado de Onboarding completado */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            ✓ Onboarding Completado
          </h3>
          <p className="text-sm text-green-700">
            Tu cuenta ha sido configurada exitosamente. Ahora puedes comenzar a gestionar
            tu negocio.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
