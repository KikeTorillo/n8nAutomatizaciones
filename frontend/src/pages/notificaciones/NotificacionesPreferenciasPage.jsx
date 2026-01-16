import { Bell, Settings } from 'lucide-react';
import { BackButton } from '@/components/ui';
import { NotificacionesPreferencias } from '@/components/notificaciones';

/**
 * NotificacionesPreferenciasPage - Pagina de preferencias de notificaciones
 */
function NotificacionesPreferenciasPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <BackButton to="/notificaciones" label="Volver a Notificaciones" className="mb-2" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
              <Settings className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Preferencias de Notificaciones
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configura como quieres recibir tus notificaciones
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <NotificacionesPreferencias />
      </div>
    </div>
  );
}

export default NotificacionesPreferenciasPage;
