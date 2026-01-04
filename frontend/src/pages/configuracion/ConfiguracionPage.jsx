import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Building2,
  Puzzle,
  ChevronRight,
  Palette,
  Building,
  Briefcase,
  Tags,
  Network,
  Shield,
  Coins,
  Users,
  GitBranch,
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import useAuthStore from '@/store/authStore';

/**
 * Hub de Configuración
 * Muestra cards para acceder a las diferentes secciones de configuración
 */
function ConfiguracionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const esAdmin = ['admin', 'propietario', 'super_admin'].includes(user?.rol);

  // Secciones de configuración - Dic 2025: Nuevo orden con Usuarios después de Mi Negocio
  const secciones = [
    {
      id: 'negocio',
      name: 'Mi Negocio',
      description: 'Logo, nombre, datos de contacto y fiscales',
      icon: Building2,
      path: '/configuracion/negocio',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'usuarios',
      name: 'Usuarios',
      description: 'Gestiona el acceso al sistema',
      icon: Users,
      path: '/configuracion/usuarios',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'permisos',
      name: 'Permisos',
      description: 'Gestiona los permisos por rol y usuario',
      icon: Shield,
      path: '/configuracion/permisos',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'modulos',
      name: 'Módulos',
      description: 'Activa o desactiva funcionalidades',
      icon: Puzzle,
      path: '/configuracion/modulos',
      color: 'text-primary-700 dark:text-primary-300',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'departamentos',
      name: 'Departamentos',
      description: 'Estructura organizacional de la empresa',
      icon: Building,
      path: '/configuracion/departamentos',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'puestos',
      name: 'Puestos',
      description: 'Catálogo de puestos de trabajo',
      icon: Briefcase,
      path: '/configuracion/puestos',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'categorias',
      name: 'Categorías de Profesional',
      description: 'Especialidades, niveles y certificaciones',
      icon: Tags,
      path: '/configuracion/categorias',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'organigrama',
      name: 'Organigrama',
      description: 'Visualiza la estructura jerárquica del equipo',
      icon: Network,
      path: '/configuracion/organigrama',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'monedas',
      name: 'Monedas',
      description: 'Tasas de cambio y monedas disponibles',
      icon: Coins,
      path: '/configuracion/monedas',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'workflows',
      name: 'Workflows',
      description: 'Configura flujos de aprobacion',
      icon: GitBranch,
      path: '/configuracion/workflows',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
      enabled: esAdmin,
    },
    {
      id: 'apariencia',
      name: 'Apariencia',
      description: 'Colores y personalización visual',
      icon: Palette,
      path: '/configuracion/apariencia',
      color: 'text-primary-500 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-900/30',
      enabled: false, // Próximamente
      comingSoon: true,
    },
  ];

  const seccionesVisibles = secciones.filter(s => s.enabled || s.comingSoon);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/home" label="Inicio" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Configuración
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Personaliza tu negocio y preferencias
                </p>
              </div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
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
                  relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6
                  text-left transition-all group
                  ${seccion.comingSoon
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md cursor-pointer'
                  }
                `}
              >
                {/* Coming Soon Badge */}
                {seccion.comingSoon && (
                  <span className="absolute top-3 right-3 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">
                    Próximamente
                  </span>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${seccion.bgColor}`}>
                      <Icono className={`w-6 h-6 ${seccion.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {seccion.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {seccion.description}
                      </p>
                    </div>
                  </div>
                  {!seccion.comingSoon && (
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info adicional para no-admins */}
        {!esAdmin && (
          <div className="mt-8 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Solo los administradores pueden modificar la configuración del negocio.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ConfiguracionPage;
