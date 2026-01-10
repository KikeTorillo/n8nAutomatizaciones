import { cn } from '@/lib/utils';
import BackButton from '@/components/ui/BackButton';
import ProfesionalesNavTabs from './ProfesionalesNavTabs';

/**
 * ProfesionalesPageLayout - Layout wrapper para todas las páginas del módulo Profesionales
 *
 * Garantiza consistencia visual: Header módulo → NavTabs → Container → Contenido
 * Similar a InventarioPageLayout para mantener UX consistente entre módulos.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono lucide-react para la sección
 * @param {string} props.title - Título de la sección (ej: "Lista de Profesionales")
 * @param {string} [props.subtitle] - Subtítulo o contador (ej: "15 profesionales en total")
 * @param {React.ReactNode} [props.actions] - Botones de acción (Nuevo, Exportar, etc.)
 * @param {React.ReactNode} props.children - Contenido principal (filtros, tabla, etc.)
 * @param {string} [props.className] - Clases adicionales para el container
 */
export default function ProfesionalesPageLayout({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  className,
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header fijo del módulo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profesionales</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona los profesionales de tu negocio
        </p>
      </div>

      {/* NavTabs SIEMPRE después del header */}
      <ProfesionalesNavTabs />

      {/* Container principal */}
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        {/* Header de sección - Mobile First */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              {Icon && (
                <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              )}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
                )}
              </div>
            </div>
            {actions && <div className="flex gap-2 sm:gap-3">{actions}</div>}
          </div>
        </div>

        {/* Contenido principal */}
        {children}
      </div>
    </div>
  );
}
