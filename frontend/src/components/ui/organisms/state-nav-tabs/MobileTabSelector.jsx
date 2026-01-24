import { memo, useState, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside, useEscapeKey } from '@/hooks/utils';
import { DROPDOWN_ITEM_STYLES, COUNT_STYLES } from './constants';

/**
 * MobileTabSelector - Dropdown para seleccionar tabs en móvil
 *
 * @component
 * @param {Object} props
 * @param {Array} props.tabs - Array de tabs disponibles
 * @param {string} props.activeTab - ID del tab activo
 * @param {function} props.onTabChange - Callback al cambiar tab
 * @param {function} props.getTabIcon - Función para obtener icono de tab
 * @returns {React.ReactElement}
 */
const MobileTabSelector = memo(function MobileTabSelector({ tabs, activeTab, onTabChange, getTabIcon }) {
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
            <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', COUNT_STYLES.inactive)}>
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
                  isActive ? DROPDOWN_ITEM_STYLES.active : DROPDOWN_ITEM_STYLES.inactive
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
                    isActive ? COUNT_STYLES.active : COUNT_STYLES.inactive
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
});

MobileTabSelector.displayName = 'MobileTabSelector';

export default MobileTabSelector;
