/**
 * StateNavTabs - Navegación de tabs reutilizable
 *
 * Soporta dos modos:
 * 1. Simple: tabs horizontales + dropdown mobile
 * 2. Agrupado: tabs con dropdowns para grupos + dropdown mobile
 *
 * Características:
 * - Desktop: Tabs horizontales con opción de agrupación en dropdowns
 * - Mobile: Dropdown selector único con todos los tabs
 * - Soporte para count/badge en tabs
 * - Soporte para tabs disabled
 * - Dark mode
 * - Keyboard navigation (Escape para cerrar)
 * - Click outside para cerrar dropdowns
 */
import { useState, useRef, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside, useEscapeKey } from '@/hooks/utils';

/**
 * TabDropdown - Dropdown para agrupar tabs en desktop
 */
function TabDropdown({ icon: Icon, label, items, activeTab, onTabChange, getTabIcon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar al hacer click fuera
  useClickOutside(dropdownRef, () => setIsOpen(false));

  // Cerrar con Escape
  useEscapeKey(() => setIsOpen(false), isOpen);

  // Verificar si algún item del grupo está activo
  const hasActiveItem = items.some((item) => item.id === activeTab);
  const activeItem = items.find((item) => item.id === activeTab);

  const handleItemClick = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
          hasActiveItem
            ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400'
            : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {activeItem ? (
          <>
            {(() => {
              const ActiveIcon = getTabIcon(activeItem.id) || activeItem.icon || Icon;
              return ActiveIcon ? <ActiveIcon className="h-4 w-4 flex-shrink-0" /> : null;
            })()}
            <span>{activeItem.label}</span>
          </>
        ) : (
          <>
            {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
            <span>{label}</span>
          </>
        )}
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
          role="menu"
        >
          {items.map((item) => {
            const ItemIcon = getTabIcon(item.id) || item.icon;
            const isItemActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  isItemActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                role="menuitem"
              >
                {ItemIcon && (
                  <ItemIcon className={cn('h-4 w-4', isItemActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400')} />
                )}
                <span className="flex-1">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {item.count}
                  </span>
                )}
                {isItemActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * MobileTabSelector - Dropdown para seleccionar tabs en móvil
 */
function MobileTabSelector({ tabs, activeTab, onTabChange, getTabIcon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar al hacer click fuera
  useClickOutside(dropdownRef, () => setIsOpen(false));

  // Cerrar con Escape
  useEscapeKey(() => setIsOpen(false), isOpen);

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveIcon = getTabIcon(activeTab) || activeTabData?.icon;

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  // Filtrar tabs no disabled
  const visibleTabs = tabs.filter(tab => !tab.disabled);

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
          {ActiveIcon && <ActiveIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
          <span className="text-gray-900 dark:text-gray-100">
            {activeTabData?.label || 'Seleccionar'}
          </span>
          {activeTabData?.count !== undefined && activeTabData.count > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              {activeTabData.count}
            </span>
          )}
        </div>
        <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[60vh] overflow-y-auto"
          role="menu"
        >
          {visibleTabs.map((tab) => {
            const TabIcon = getTabIcon(tab.id) || tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                role="menuitem"
              >
                {TabIcon && (
                  <TabIcon className={cn('h-4 w-4', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400')} />
                )}
                <span className="flex-1">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'px-2 py-0.5 text-xs font-semibold rounded-full',
                    isActive
                      ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  )}>
                    {tab.count}
                  </span>
                )}
                {isActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * StateNavTabs - Componente principal de navegación por tabs
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
 *
 * @example
 * // Modo simple (tabs horizontales)
 * <StateNavTabs
 *   tabs={[
 *     { id: 'general', label: 'General', icon: User },
 *     { id: 'historial', label: 'Historial', icon: Clock },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 *
 * @example
 * // Modo agrupado (con dropdowns)
 * <StateNavTabs
 *   tabs={TABS}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   groups={[
 *     { icon: UserCircle, label: 'Perfil', tabIds: ['personal', 'curriculum', 'documentos'] },
 *     { icon: Shield, label: 'Gestión', tabIds: ['ausencias', 'configuracion'] },
 *   ]}
 * />
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
          'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
          isActive
            ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400'
            : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
        )}
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <span>{tab.label}</span>
        {tab.count !== undefined && tab.count > 0 && (
          <span
            className={cn(
              'ml-1 px-2 py-0.5 text-xs rounded-full font-semibold',
              isActive
                ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
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
