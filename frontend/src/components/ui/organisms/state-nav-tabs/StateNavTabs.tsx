import { memo, useMemo, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { TAB_STYLES, COUNT_STYLES } from './constants';
import TabDropdown from './TabDropdown';
import MobileTabSelector, { type TabItem, type MobileGroup } from './MobileTabSelector';

/**
 * Grupo de tabs para desktop
 */
export interface TabGroup {
  /** Icono del grupo */
  icon?: ComponentType<{ className?: string }>;
  /** Label del grupo */
  label: string;
  /** IDs de tabs en el grupo */
  tabIds?: string[];
}

/**
 * Props del componente StateNavTabs
 */
export interface StateNavTabsProps {
  /** Array de tabs */
  tabs: TabItem[];
  /** ID del tab activo */
  activeTab: string;
  /** Callback al cambiar tab */
  onTabChange: (tabId: string) => void;
  /** Grupos para desktop */
  groups?: TabGroup[];
  /** Grupos para móvil con subtabs expandidos */
  mobileGroups?: MobileGroup[];
  /** Mapeo de tabId => Icon component */
  iconMap?: Record<string, ComponentType<{ className?: string }>>;
  /** Si el nav debe ser sticky */
  sticky?: boolean;
  /** Posición top para sticky */
  stickyTop?: string;
  /** Clases adicionales */
  className?: string;
}

/**
 * StateNavTabs - Componente principal de navegación por tabs
 *
 * Fragmentado en Ene 2026 para mejor mantenibilidad.
 * Soporta dos modos:
 * 1. Simple: tabs horizontales + dropdown mobile
 * 2. Agrupado: tabs con dropdowns para grupos + dropdown mobile
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
}: StateNavTabsProps) {
  // Helper para obtener icono de un tab
  const getTabIcon = (tabId: string): ComponentType<{ className?: string }> | undefined => {
    if (iconMap[tabId]) return iconMap[tabId];
    const tab = tabs.find((t) => t.id === tabId);
    return tab?.icon;
  };

  // Calcular tabs standalone (no están en ningún grupo)
  const groupedTabIds = useMemo(() => {
    return new Set(groups.flatMap((g) => g.tabIds || []));
  }, [groups]);

  const standaloneTabs = useMemo(() => {
    return tabs.filter((tab) => !groupedTabIds.has(tab.id) && !tab.disabled);
  }, [tabs, groupedTabIds]);

  // Crear grupos con sus tabs completos
  const groupsWithTabs = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        items: (group.tabIds || [])
          .map((id) => tabs.find((t) => t.id === id))
          .filter((tab): tab is TabItem => !!tab)
          .filter((tab) => !tab.disabled),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, tabs]);

  // Si no hay grupos, renderizar todos los tabs
  const hasGroups = groupsWithTabs.length > 0;

  // Renderizar un tab standalone
  const renderStandaloneTab = (tab: TabItem) => {
    const Icon = getTabIcon(tab.id);
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(TAB_STYLES.base, isActive ? TAB_STYLES.active : TAB_STYLES.inactive)}
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
            {standaloneTabs.map((tab) => renderStandaloneTab(tab))}
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
          tabs.filter((t) => !t.disabled).map((tab) => renderStandaloneTab(tab))
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
