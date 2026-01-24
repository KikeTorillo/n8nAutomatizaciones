import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  TAB_CONTAINER_STYLES,
  TAB_NAV_STYLES,
  getTabButtonStyles,
  getTabIconStyles,
} from '@/lib/uiConstants';

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
export const ViewTabs = memo(function ViewTabs({ tabs, activeTab, onChange, className, ariaLabel = 'Cambiar vista' }) {
  return (
    <div className={cn(TAB_CONTAINER_STYLES, className)}>
      <nav
        className={TAB_NAV_STYLES}
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
});

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
      className={getTabButtonStyles(isActive)}
    >
      {Icon && (
        <Icon
          className={getTabIconStyles(isActive)}
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
