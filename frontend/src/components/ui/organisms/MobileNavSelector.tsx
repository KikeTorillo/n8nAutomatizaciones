import { useState, useRef, memo, forwardRef, useCallback, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutsideRef, useEscapeKey } from '@/hooks/utils';

/**
 * Item de navegación
 */
export interface NavItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  path: string;
}

/**
 * Grupo de navegación
 */
export interface NavGroup {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  items: NavItem[];
}

/**
 * Props del componente MobileNavSelector
 */
export interface MobileNavSelectorProps {
  /** Items planos */
  items?: NavItem[];
  /** Grupos con items */
  groups?: NavGroup[];
  /** Item activo actual (modo flat) */
  activeItem?: NavItem;
  /** ID del grupo activo (modo grouped) */
  activeGroupId?: string;
  /** ID del item activo (modo grouped) */
  activeItemId?: string;
  /** Label si no hay item activo */
  fallbackLabel?: string;
  /** Icono si no hay item activo */
  fallbackIcon?: ComponentType<{ className?: string }>;
}

/**
 * MobileNavSelector - Selector dropdown para navegación móvil
 *
 * Soporta dos modos:
 * - Flat: Array simple de items
 * - Grouped: Array de grupos con items anidados
 */
const MobileNavSelector = memo(
  forwardRef<HTMLDivElement, MobileNavSelectorProps>(function MobileNavSelector({
  items,
  groups,
  activeItem,
  activeGroupId,
  activeItemId,
  fallbackLabel = 'Navegar',
  fallbackIcon: FallbackIcon = Menu,
}, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isGrouped = !!groups;

  // Para modo grouped, encontrar item y grupo activos
  const groupedActiveItem = isGrouped
    ? groups?.flatMap((g) => g.items).find((item) => item.id === activeItemId)
    : null;
  const groupedActiveGroup = isGrouped ? groups?.find((g) => g.id === activeGroupId) : null;

  // Cerrar al hacer click fuera (hook centralizado)
  useClickOutsideRef(dropdownRef, () => setIsOpen(false), isOpen);

  // Cerrar con Escape (hook centralizado)
  useEscapeKey(() => setIsOpen(false), isOpen);

  const handleItemClick = useCallback(
    (path: string) => {
      navigate(path);
      setIsOpen(false);
    },
    [navigate]
  );

  // Determinar icono y label del botón
  const ActiveIcon = isGrouped
    ? groupedActiveGroup?.icon || FallbackIcon
    : activeItem?.icon || FallbackIcon;
  const displayLabel = isGrouped
    ? groupedActiveItem?.label || fallbackLabel
    : activeItem?.label || fallbackLabel;
  const groupLabel = isGrouped ? groupedActiveGroup?.label : null;

  return (
    <div className="relative" ref={(node) => {
        dropdownRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}>
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
          <ActiveIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          {groupLabel && (
            <>
              <span className="text-gray-500 dark:text-gray-400">{groupLabel}</span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </>
          )}
          <span className="text-gray-900 dark:text-gray-100">{displayLabel}</span>
        </div>
        <ChevronDown
          className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[70vh] overflow-y-auto"
          role="menu"
        >
          {isGrouped && groups ? (
            // Modo agrupado
            groups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.id}>
                  {/* Header del grupo */}
                  <div className="px-4 py-2 flex items-center gap-2">
                    {GroupIcon && (
                      <GroupIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    )}
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  {/* Items del grupo */}
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = item.id === activeItemId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.path)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 pl-10 py-2.5 text-sm text-left transition-colors',
                          isItemActive
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        )}
                        role="menuitem"
                      >
                        {ItemIcon && (
                          <ItemIcon
                            className={cn(
                              'h-4 w-4',
                              isItemActive
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-400'
                            )}
                          />
                        )}
                        <span className="flex-1">{item.label}</span>
                        {isItemActive && (
                          <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          ) : items ? (
            // Modo flat
            items.map((item) => {
              const ItemIcon = item.icon;
              const isItemActive = activeItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                    isItemActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                  {isItemActive && (
                    <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              );
            })
          ) : null}
        </div>
      )}
    </div>
  );
  })
);

MobileNavSelector.displayName = 'MobileNavSelector';

export { MobileNavSelector };
