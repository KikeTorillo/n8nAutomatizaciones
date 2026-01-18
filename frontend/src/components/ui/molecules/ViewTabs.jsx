import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * ViewTabs - Tabs para cambiar entre vistas (Lista, Calendario, etc.)
 *
 * @param {Object} props
 * @param {Array<Object>} props.tabs - Configuración de tabs
 * @param {string} props.tabs[].id - ID único del tab
 * @param {string} props.tabs[].label - Texto del tab
 * @param {React.ComponentType} [props.tabs[].icon] - Icono de lucide-react (opcional)
 * @param {string} props.activeTab - ID del tab activo
 * @param {Function} props.onChange - Callback cuando cambia el tab
 * @param {string} [props.className] - Clases adicionales
 * @param {string} [props.ariaLabel] - Etiqueta ARIA para el tablist
 */
export function ViewTabs({ tabs, activeTab, onChange, className, ariaLabel = 'Cambiar vista' }) {
  return (
    <div
      className={cn(
        'border-b border-gray-200 dark:border-gray-700 mb-4',
        className
      )}
    >
      <nav
        className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onChange={onChange}
          />
        ))}
      </nav>
    </div>
  );
}

/**
 * TabButton - Botón de tab memoizado
 */
const TabButton = memo(function TabButton({ tab, isActive, onChange }) {
  const Icon = tab.icon;

  const handleClick = useCallback(() => {
    onChange(tab.id);
  }, [onChange, tab.id]);

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 px-1 py-3 text-sm font-medium',
        'border-b-2 transition-colors duration-200 whitespace-nowrap',
        isActive
          ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'w-4 h-4 sm:w-5 sm:h-5',
            isActive
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-400 dark:text-gray-500'
          )}
          aria-hidden="true"
        />
      )}
      <span className="hidden sm:inline">{tab.label}</span>
      {/* Mostrar solo icono en móvil si hay icono */}
      {Icon && <span className="sm:hidden">{tab.label}</span>}
      {/* Si no hay icono, mostrar siempre el label */}
      {!Icon && <span className="sm:hidden">{tab.label}</span>}
    </button>
  );
});

ViewTabs.displayName = 'ViewTabs';

export default ViewTabs;
