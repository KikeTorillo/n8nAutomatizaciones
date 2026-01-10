import { cn } from '@/lib/utils';
import BackButton from '@/components/ui/BackButton';
import ClientesNavTabs from './ClientesNavTabs';

/**
 * ClientesPageLayout - Layout wrapper para todas las paginas del modulo Clientes
 *
 * Garantiza consistencia visual: Header modulo -> NavTabs -> Container -> Contenido
 * Reduce codigo repetitivo por pagina.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono lucide-react para la seccion
 * @param {string} props.title - Titulo de la seccion (ej: "Lista de Clientes")
 * @param {string} [props.subtitle] - Subtitulo o contador (ej: "150 clientes en total")
 * @param {React.ReactNode} [props.actions] - Botones de accion (Nuevo, Exportar, etc.)
 * @param {React.ReactNode} props.children - Contenido principal (filtros, tabla, etc.)
 * @param {string} [props.className] - Clases adicionales para el container
 */
export default function ClientesPageLayout({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  className,
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header fijo del modulo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona tu base de clientes y relaciones comerciales
        </p>
      </div>

      {/* NavTabs SIEMPRE despues del header */}
      <ClientesNavTabs />

      {/* Container principal */}
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        {/* Header de seccion - Mobile First */}
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
