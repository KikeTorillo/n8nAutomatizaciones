import {
  User,
  Mail,
  Shield,
  Calendar,
  Building2,
} from 'lucide-react';
import { useAuthStore, selectUser } from '@/features/auth';
import { BackButton, Card } from '@/components/ui';
import CambiarPasswordForm from './components/CambiarPasswordForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * MiCuentaPage - Página de gestión de cuenta del usuario
 * Accesible para TODOS los usuarios autenticados (no requiere profesional_id)
 * Muestra información de la cuenta y permite cambiar contraseña
 */
function MiCuentaPage() {
  const user = useAuthStore(selectUser);

  // Formatear fecha de creación si existe
  const fechaCreacion = user?.creado_en
    ? format(new Date(user.creado_en), "d 'de' MMMM, yyyy", { locale: es })
    : null;

  // Obtener iniciales para avatar
  const getInitials = (nombre) => {
    if (!nombre) return '?';
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <BackButton to="/home" label="Inicio" />
          </div>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xl font-bold text-primary-600 dark:text-primary-400 border-4 border-primary-50 dark:border-primary-800">
              {getInitials(user?.nombre)}
            </div>

            {/* Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Mi Cuenta
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestiona tu información de acceso
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Información de cuenta */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  Información de cuenta
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nombre</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {user?.nombre || '-'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Correo electrónico</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {user?.email || '-'}
                  </p>
                </div>
              </div>

              {/* Rol */}
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rol</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {user?.rol_nombre || user?.rol_codigo || '-'}
                  </p>
                </div>
              </div>

              {/* Organización */}
              {user?.nombre_comercial && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Organización</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.nombre_comercial}
                    </p>
                  </div>
                </div>
              )}

              {/* Fecha de registro */}
              {fechaCreacion && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Miembro desde</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {fechaCreacion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Card: Seguridad */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    Seguridad
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cambia tu contraseña
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <CambiarPasswordForm />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MiCuentaPage;
