import { memo, useState, useRef, useMemo, type ComponentType } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside, useEscapeKey } from '@/hooks/utils';
import { DROPDOWN_ITEM_STYLES, COUNT_STYLES } from './constants';

/**
 * Tab individual
 */
export interface TabItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  count?: number;
  disabled?: boolean;
}

/**
 * Grupo para móvil
 */
export interface MobileGroup {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  items?: TabItem[];
}

/**
 * Props del componente MobileTabSelector
 */
export interface MobileTabSelectorProps {
  /** Array de tabs disponibles */
  tabs: TabItem[];
  /** ID del tab activo */
  activeTab: string;
  /** Callback al cambiar tab */
  onTabChange: (tabId: string) => void;
  /** Función para obtener icono de tab */
  getTabIcon: (tabId: string) => ComponentType<{ className?: string }> | undefined;
  /** Array de grupos para móvil (opcional) */
  mobileGroups?: MobileGroup[];
}

/**
 * MobileTabSelector - Dropdown para seleccionar tabs en móvil
 */
const MobileTabSelector = memo(function MobileTabSelector({
  tabs,
  activeTab,
  onTabChange,
  getTabIcon,
  mobileGroups,
}: MobileTabSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useClickOutside(dropdownRef, () => setIsOpen(false));

  // Cerrar con Escape
  useEscapeKey(() => setIsOpen(false), isOpen);

  // Detectar modo agrupado
  const isGrouped = !!mobileGroups && mobileGroups.length > 0;

  // Buscar grupo/item activo (modo agrupado)
  const activeGroupInfo = useMemo(() => {
    if (!isGrouped || !mobileGroups) return null;
    for (const group of mobileGroups) {
      const item = group.items?.find((i) => i.id === activeTab);
      if (item) return { group, item };
    }
    return null;
  }, [isGrouped, mobileGroups, activeTab]);

  // En modo agrupado, usar info del item activo; en modo flat, usar tabs
  const activeTabData = isGrouped
    ? activeGroupInfo?.item
    : tabs.find((tab) => tab.id === activeTab);
  const ActiveIcon = isGrouped
    ? activeGroupInfo?.item?.icon || activeGroupInfo?.group?.icon
    : getTabIcon(activeTab) || activeTabData?.icon;

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  // Filtrar tabs no disabled
  const visibleTabs = tabs.filter((tab) => !tab.disabled);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
          'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600',
          'text-gray-900 dark:text-gray-100'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-2">
          {ActiveIcon && (
            <ActiveIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          )}
          <span className="text-gray-900 dark:text-gray-100">
            {activeTabData?.label || 'Seleccionar'}
          </span>
          {activeTabData?.count !== undefined && activeTabData.count > 0 && (
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-semibold rounded-full',
                COUNT_STYLES.inactive
              )}
            >
              {activeTabData.count}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[60vh] overflow-y-auto"
          role="menu"
        >
          {isGrouped && mobileGroups ? (
            // Modo agrupado: headers de grupo + items indentados
            mobileGroups.map((group) => {
              const GroupIcon = group.icon;
              const hasActiveItem = group.items?.some((item) => item.id === activeTab);

              return (
                <div key={group.id}>
                  {/* Header del grupo */}
                  <div
                    className={cn(
                      'px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2',
                      hasActiveItem
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {GroupIcon && <GroupIcon className="h-3.5 w-3.5" />}
                    {group.label}
                  </div>

                  {/* Items del grupo */}
                  {group.items?.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={cn(
                          'w-full flex items-center gap-3 pl-10 pr-4 py-2.5 text-sm text-left transition-colors',
                          isActive ? DROPDOWN_ITEM_STYLES.active : DROPDOWN_ITEM_STYLES.inactive
                        )}
                        role="menuitem"
                      >
                        {ItemIcon && (
                          <ItemIcon
                            className={cn(
                              'h-4 w-4',
                              isActive
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-400'
                            )}
                          />
                        )}
                        <span className="flex-1">{item.label}</span>
                        {item.count !== undefined && item.count > 0 && (
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs font-semibold rounded-full',
                              isActive ? COUNT_STYLES.active : COUNT_STYLES.inactive
                            )}
                          >
                            {item.count}
                          </span>
                        )}
                        {isActive && (
                          <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          ) : (
            // Modo flat: comportamiento original
            visibleTabs.map((tab) => {
              const TabIcon = getTabIcon(tab.id) || tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                    isActive ? DROPDOWN_ITEM_STYLES.active : DROPDOWN_ITEM_STYLES.inactive
                  )}
                  role="menuitem"
                >
                  {TabIcon && (
                    <TabIcon
                      className={cn(
                        'h-4 w-4',
                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                      )}
                    />
                  )}
                  <span className="flex-1">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-semibold rounded-full',
                        isActive ? COUNT_STYLES.active : COUNT_STYLES.inactive
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});

MobileTabSelector.displayName = 'MobileTabSelector';

export default MobileTabSelector;
