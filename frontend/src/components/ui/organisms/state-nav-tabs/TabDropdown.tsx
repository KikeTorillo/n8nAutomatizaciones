import { memo, useState, useRef, type ComponentType } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutsideRef, useEscapeKey } from '@/hooks/utils';
import { TAB_STYLES, DROPDOWN_ITEM_STYLES } from './constants';

/**
 * Item de dropdown
 */
export interface TabDropdownItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  count?: number;
  disabled?: boolean;
}

/**
 * Props del componente TabDropdown
 */
export interface TabDropdownProps {
  /** Icono del grupo */
  icon?: ComponentType<{ className?: string }>;
  /** Label del grupo */
  label: string;
  /** Items del dropdown */
  items: TabDropdownItem[];
  /** Tab activo actual */
  activeTab: string;
  /** Callback al cambiar tab */
  onTabChange: (tabId: string) => void;
  /** Función para obtener icono de tab */
  getTabIcon: (tabId: string) => ComponentType<{ className?: string }> | undefined;
}

/**
 * TabDropdown - Dropdown para agrupar tabs en desktop
 */
const TabDropdown = memo(function TabDropdown({
  icon: Icon,
  label,
  items,
  activeTab,
  onTabChange,
  getTabIcon,
}: TabDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera (useClickOutsideRef para refs externas)
  useClickOutsideRef(dropdownRef, () => setIsOpen(false), isOpen);

  // Cerrar con Escape
  useEscapeKey(() => setIsOpen(false), isOpen);

  // Verificar si algún item del grupo está activo
  const hasActiveItem = items.some((item) => item.id === activeTab);

  const handleItemClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(TAB_STYLES.base, hasActiveItem ? TAB_STYLES.active : TAB_STYLES.inactive)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <span>{label}</span>
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
                  <ItemIcon
                    className={cn(
                      'h-4 w-4',
                      isItemActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                    )}
                  />
                )}
                <span className="flex-1">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {item.count}
                  </span>
                )}
                {isItemActive && (
                  <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

TabDropdown.displayName = 'TabDropdown';

export default TabDropdown;
