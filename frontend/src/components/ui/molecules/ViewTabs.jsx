import { memo, useCallback, useRef, forwardRef } from 'react';
import PropTypes from 'prop-types';
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
  const tabRefs = useRef([]);

  // Handler para navegación con flechas
  const handleKeyDown = useCallback((e, currentIndex) => {
    const tabCount = tabs.length;
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % tabCount;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + tabCount) % tabCount;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = tabCount - 1;
    }

    if (newIndex !== currentIndex) {
      onChange(tabs[newIndex].id);
      tabRefs.current[newIndex]?.focus();
    }
  }, [tabs, onChange]);

  return (
    <div className={cn(TAB_CONTAINER_STYLES, className)}>
      <nav
        className={TAB_NAV_STYLES}
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab, index) => (
          <TabButton
            key={tab.id}
            ref={(el) => { tabRefs.current[index] = el; }}
            tab={tab}
            isActive={activeTab === tab.id}
            onChange={onChange}
            onKeyDown={(e) => handleKeyDown(e, index)}
          />
        ))}
      </nav>
    </div>
  );
});

/**
 * TabButton - Botón de tab memoizado con forwardRef
 */
const TabButton = memo(forwardRef(function TabButton({ tab, isActive, onChange, onKeyDown }, ref) {
  const Icon = tab.icon;

  const handleClick = useCallback(() => {
    onChange(tab.id);
  }, [onChange, tab.id]);

  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={onKeyDown}
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
}));

ViewTabs.displayName = 'ViewTabs';

ViewTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

TabButton.propTypes = {
  tab: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
};

