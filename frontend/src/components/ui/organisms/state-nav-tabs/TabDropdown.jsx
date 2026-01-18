import { useState, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside, useEscapeKey } from '@/hooks/utils';
import { TAB_STYLES, DROPDOWN_ITEM_STYLES } from './constants';

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
          TAB_STYLES.base,
          hasActiveItem ? TAB_STYLES.active : TAB_STYLES.inactive
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
                  DROPDOWN_ITEM_STYLES.base,
                  item.disabled && DROPDOWN_ITEM_STYLES.disabled,
                  isItemActive ? DROPDOWN_ITEM_STYLES.active : DROPDOWN_ITEM_STYLES.inactive
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

export default TabDropdown;
