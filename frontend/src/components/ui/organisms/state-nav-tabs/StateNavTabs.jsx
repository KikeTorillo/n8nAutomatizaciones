import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TAB_STYLES, COUNT_STYLES } from './constants';
import TabDropdown from './TabDropdown';
import MobileTabSelector from './MobileTabSelector';

/**
 * StateNavTabs - Componente principal de navegación por tabs
 *
 * Fragmentado en Ene 2026 para mejor mantenibilidad.
 * Soporta dos modos:
 * 1. Simple: tabs horizontales + dropdown mobile
 * 2. Agrupado: tabs con dropdowns para grupos + dropdown mobile
 *
 * @component
 * @example
 * <StateNavTabs
 *   tabs={[{ id: 'all', label: 'Todos' }, { id: 'active', label: 'Activos', count: 5 }]}
 *   activeTab="all"
 *   onTabChange={(tabId) => setActiveTab(tabId)}
 * />
 *
 * @param {Object} props
 * @param {Array<{id: string, label: string, icon?: React.ComponentType, count?: number, disabled?: boolean}>} props.tabs - Array de tabs
 * @param {string} props.activeTab - ID del tab activo
 * @param {function} props.onTabChange - Callback al cambiar tab (tabId) => void
 * @param {Array<{icon?: React.ComponentType, label: string, tabIds: string[]}>} [props.groups] - Grupos para desktop
 * @param {Array<{id: string, label: string, icon?: React.ComponentType, items: Array}>} [props.mobileGroups] - Grupos para móvil con subtabs expandidos
 * @param {Object<string, React.ComponentType>} [props.iconMap] - Mapeo de tabId => Icon component
 * @param {boolean} [props.sticky=true] - Si el nav debe ser sticky
 * @param {string} [props.stickyTop='top-0'] - Posición top para sticky
 * @param {string} [props.className] - Clases adicionales
 * @returns {React.ReactElement}
 */
const StateNavTabs = memo(function StateNavTabs({
  tabs,
  activeTab,
  onTabChange,
  groups = [],
  mobileGroups,
  iconMap = {},
  sticky = true,
  stickyTop = 'top-0',
  className,
}) {
  // Helper para obtener icono de un tab
  const getTabIcon = (tabId) => {
    if (iconMap[tabId]) return iconMap[tabId];
    const tab = tabs.find(t => t.id === tabId);
    return tab?.icon;
  };

  // Calcular tabs standalone (no están en ningún grupo)
  const groupedTabIds = useMemo(() => {
    return new Set(groups.flatMap(g => g.tabIds || []));
  }, [groups]);

  const standaloneTabs = useMemo(() => {
    return tabs.filter(tab => !groupedTabIds.has(tab.id) && !tab.disabled);
  }, [tabs, groupedTabIds]);

  // Crear grupos con sus tabs completos
  const groupsWithTabs = useMemo(() => {
    return groups.map(group => ({
      ...group,
      items: (group.tabIds || [])
        .map(id => tabs.find(t => t.id === id))
        .filter(Boolean)
        .filter(tab => !tab.disabled),
    })).filter(group => group.items.length > 0);
  }, [groups, tabs]);

  // Si no hay grupos, renderizar todos los tabs
  const hasGroups = groupsWithTabs.length > 0;

  // Renderizar un tab standalone
  const renderStandaloneTab = (tab) => {
    const Icon = getTabIcon(tab.id);
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={cn(
          TAB_STYLES.base,
          isActive ? TAB_STYLES.active : TAB_STYLES.inactive
        )}
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <span>{tab.label}</span>
        {tab.count !== undefined && tab.count > 0 && (
          <span
            className={cn(
              'ml-1 px-2 py-0.5 text-xs rounded-full font-semibold',
              isActive ? COUNT_STYLES.active : COUNT_STYLES.inactive
            )}
          >
            {tab.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav
      className={cn(
        'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        sticky && 'sticky z-10',
        sticky && stickyTop,
        className
      )}
      aria-label="Tabs"
    >
      {/* Desktop: Tabs horizontales (con o sin grupos) */}
      <div className="hidden md:flex items-center gap-1 px-4 py-2">
        {hasGroups ? (
          // Modo agrupado: mezclar standalone tabs y grupos
          <>
            {standaloneTabs.map(tab => renderStandaloneTab(tab))}
            {groupsWithTabs.map((group, idx) => (
              <TabDropdown
                key={`group-${idx}`}
                icon={group.icon}
                label={group.label}
                items={group.items}
                activeTab={activeTab}
                onTabChange={onTabChange}
                getTabIcon={getTabIcon}
              />
            ))}
          </>
        ) : (
          // Modo simple: todos los tabs horizontales
          tabs.filter(t => !t.disabled).map(tab => renderStandaloneTab(tab))
        )}
      </div>

      {/* Mobile: Dropdown selector */}
      <div className="md:hidden px-4 py-2">
        <MobileTabSelector
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          getTabIcon={getTabIcon}
          mobileGroups={mobileGroups}
        />
      </div>
    </nav>
  );
});

StateNavTabs.displayName = 'StateNavTabs';

export { StateNavTabs };
export default StateNavTabs;
