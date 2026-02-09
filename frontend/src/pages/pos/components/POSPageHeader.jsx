import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Header reutilizable para páginas del módulo POS
 * Incluye navegación, título, subtítulo, acciones y tabs opcionales
 *
 * @param {Object} props
 * @param {string} props.backTo - Ruta de navegación para el botón "Atrás"
 * @param {React.ComponentType} [props.icon] - Icono del título (componente Lucide)
 * @param {string} [props.iconColor] - Color del icono (clase Tailwind, ej: "text-emerald-600")
 * @param {string} props.title - Título principal
 * @param {string} [props.subtitle] - Subtítulo descriptivo
 * @param {React.ReactNode} [props.actions] - Acciones adicionales (botones)
 * @param {Array} [props.tabs] - Array de tabs [{id, label, icon?}]
 * @param {string} [props.activeTab] - ID del tab activo
 * @param {Function} [props.onTabChange] - Callback cuando cambia el tab
 * @param {boolean} [props.sticky] - Si el header debe ser sticky (default: true)
 */
export default function POSPageHeader({
  backTo,
  icon: Icon,
  iconColor = 'text-primary-600 dark:text-primary-400',
  title,
  subtitle,
  actions,
  tabs,
  activeTab,
  onTabChange,
  sticky = true,
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${
      sticky ? 'sticky top-0 z-10' : ''
    }`}>
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Back button */}
          {backTo && (
            <Link
              to={backTo}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}

          {/* Title section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {Icon && (
                <Icon className={`h-6 w-6 flex-shrink-0 ${iconColor}`} />
              )}
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {TabIcon && <TabIcon className="h-4 w-4" />}
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
