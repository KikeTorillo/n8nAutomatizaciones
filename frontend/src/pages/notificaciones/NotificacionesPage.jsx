import { useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackButton, Button } from '@/components/ui';
import { NotificacionesLista } from '@/components/notificaciones';

/**
 * NotificacionesPage - Pagina principal del centro de notificaciones
 */
function NotificacionesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <BackButton to="/home" label="Volver al Inicio" className="mb-2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                <Bell className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Centro de Notificaciones
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Todas tus notificaciones en un solo lugar
                </p>
              </div>
            </div>
            <Link to="/notificaciones/preferencias">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Preferencias
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <NotificacionesLista />
      </div>
    </div>
  );
}

export default NotificacionesPage;
