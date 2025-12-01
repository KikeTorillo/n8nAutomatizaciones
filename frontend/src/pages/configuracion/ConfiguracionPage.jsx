import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  Building2,
  Puzzle,
  ChevronRight,
  Palette,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';

/**
 * Hub de Configuración
 * Muestra cards para acceder a las diferentes secciones de configuración
 */
function ConfiguracionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const esAdmin = ['admin', 'propietario', 'super_admin'].includes(user?.rol);

  // Secciones de configuración
  const secciones = [
    {
      id: 'negocio',
      name: 'Mi Negocio',
      description: 'Logo, nombre, datos de contacto y fiscales',
      icon: Building2,
      path: '/configuracion/negocio',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      enabled: esAdmin,
    },
    {
      id: 'modulos',
      name: 'Módulos',
      description: 'Activa o desactiva funcionalidades',
      icon: Puzzle,
      path: '/configuracion/modulos',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      enabled: esAdmin,
    },
    {
      id: 'apariencia',
      name: 'Apariencia',
      description: 'Colores y personalización visual',
      icon: Palette,
      path: '/configuracion/apariencia',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      enabled: false, // Próximamente
      comingSoon: true,
    },
  ];

  const seccionesVisibles = secciones.filter(s => s.enabled || s.comingSoon);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/home')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Configuración
                </h1>
                <p className="text-sm text-gray-500">
                  Personaliza tu negocio y preferencias
                </p>
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seccionesVisibles.map((seccion) => {
            const Icono = seccion.icon;

            return (
              <button
                key={seccion.id}
                onClick={() => !seccion.comingSoon && navigate(seccion.path)}
                disabled={seccion.comingSoon}
                className={`
                  relative bg-white rounded-xl shadow-sm border border-gray-200 p-6
                  text-left transition-all group
                  ${seccion.comingSoon
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-indigo-300 hover:shadow-md cursor-pointer'
                  }
                `}
              >
                {/* Coming Soon Badge */}
                {seccion.comingSoon && (
                  <span className="absolute top-3 right-3 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    Próximamente
                  </span>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${seccion.bgColor}`}>
                      <Icono className={`w-6 h-6 ${seccion.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {seccion.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {seccion.description}
                      </p>
                    </div>
                  </div>
                  {!seccion.comingSoon && (
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info adicional para no-admins */}
        {!esAdmin && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-sm text-amber-700">
              Solo los administradores pueden modificar la configuración del negocio.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ConfiguracionPage;
