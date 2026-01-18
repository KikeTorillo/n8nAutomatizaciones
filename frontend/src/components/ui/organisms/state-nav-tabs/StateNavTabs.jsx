import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TAB_STYLES, COUNT_STYLES } from './constants';
import TabDropdown from './TabDropdown';
import MobileTabSelector from './MobileTabSelector';

/**
 * StateNavTabs - Componente principal de navegación por tabs
 * Fragmentado en Ene 2026 para mejor mantenibilidad
 *
 * Soporta dos modos:
 * 1. Simple: tabs horizontales + dropdown mobile
 * 2. Agrupado: tabs con dropdowns para grupos + dropdown mobile
 *
 * @param {Object} props
 * @param {Array} props.tabs - Array de tabs { id, label, icon?, count?, disabled? }
 * @param {string} props.activeTab - ID del tab activo
 * @param {Function} props.onTabChange - Callback al cambiar tab (tabId) => void
 * @param {Array} [props.groups] - Grupos opcionales para desktop { icon, label, tabIds: string[] }
 * @param {Object} [props.iconMap] - Mapeo de tabId => Icon component (alternativa a icon en tabs)
 * @param {boolean} [props.sticky] - Si el nav debe ser sticky (default: true)
 * @param {string} [props.stickyTop] - Posición top para sticky (default: 'top-0')
 * @param {string} [props.className] - Clases adicionales
 */
function StateNavTabs({
  tabs,
  activeTab,
  onTabChange,
  groups = [],
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
    <div
      className={cn(
        'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        sticky && 'sticky z-10',
        sticky && stickyTop,
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: Tabs horizontales (con o sin grupos) */}
        <nav className="hidden md:flex items-center -mb-px" aria-label="Tabs">
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
        </nav>

        {/* Mobile: Dropdown selector */}
        <div className="md:hidden py-2">
          <MobileTabSelector
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            getTabIcon={getTabIcon}
          />
        </div>
      </div>
    </div>
  );
}

export default StateNavTabs;
