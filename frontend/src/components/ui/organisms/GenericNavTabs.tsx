import { memo, forwardRef, type ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavDropdown } from './NavDropdown';
import { MobileNavSelector, type NavItem, type NavGroup } from './MobileNavSelector';

/**
 * Encuentra el item activo basado en la ruta actual (modo flat)
 */
function getActiveItem(
  pathname: string,
  items: NavItem[],
  defaultPath?: string
): NavItem | null {
  // Buscar coincidencia exacta primero
  const exactMatch = items.find((item) => pathname === item.path);
  if (exactMatch) return exactMatch;

  // Buscar coincidencia parcial (para subrutas)
  for (const item of items) {
    if (pathname.startsWith(item.path + '/')) {
      return item;
    }
  }

  // Default al primer item si estamos en el módulo
  if (defaultPath && pathname.startsWith(defaultPath)) {
    return items[0];
  }

  return null;
}

/**
 * Encuentra el grupo e item activo basado en la ruta actual (modo grouped)
 */
function getActiveInfo(
  pathname: string,
  groups: NavGroup[]
): { groupId: string | null; itemId: string | null } {
  for (const group of groups) {
    for (const item of group.items) {
      if (pathname === item.path || pathname.startsWith(item.path + '/')) {
        return { groupId: group.id, itemId: item.id };
      }
    }
  }
  return { groupId: null, itemId: null };
}

/**
 * Props del componente GenericNavTabs
 */
export interface GenericNavTabsProps {
  /** Items planos */
  items?: NavItem[];
  /** Grupos con items */
  groups?: NavGroup[];
  /** Path base del módulo para detección de activo */
  defaultPath?: string;
  /** Label para mobile si no hay item activo */
  fallbackLabel?: string;
  /** Icono para mobile si no hay item activo */
  fallbackIcon?: ComponentType<{ className?: string }>;
  /** Clases adicionales */
  className?: string;
}

/**
 * GenericNavTabs - Navegación de tabs genérica para módulos
 *
 * Soporta dos modos:
 * - Flat: Array simple de items → tabs horizontales en desktop
 * - Grouped: Array de grupos → dropdowns en desktop
 *
 * Mobile siempre usa MobileNavSelector
 */
const GenericNavTabs = memo(
  forwardRef<HTMLElement, GenericNavTabsProps>(function GenericNavTabs({
  items,
  groups,
  defaultPath,
  fallbackLabel,
  fallbackIcon,
  className,
}, ref) {
  const location = useLocation();
  const navigate = useNavigate();

  const isGrouped = !!groups;

  // Calcular estado activo según modo
  const activeItem =
    !isGrouped && items ? getActiveItem(location.pathname, items, defaultPath) : null;
  const { groupId, itemId } = isGrouped && groups
    ? getActiveInfo(location.pathname, groups)
    : { groupId: null, itemId: null };

  return (
    <nav
      ref={ref}
      className={cn(
        'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-1 px-4 py-2">
        {isGrouped && groups ? (
          // Modo agrupado: Dropdowns
          groups.map((group) => (
            <NavDropdown
              key={group.id}
              label={group.label}
              icon={group.icon}
              items={group.items}
              isActive={group.id === groupId}
              activeItemId={itemId || undefined}
            />
          ))
        ) : items ? (
          // Modo flat: Tabs horizontales
          items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = activeItem?.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                {ItemIcon && (
                  <ItemIcon
                    className={cn(
                      'h-4 w-4',
                      isActive ? 'text-primary-600 dark:text-primary-400' : ''
                    )}
                  />
                )}
                {item.label}
              </button>
            );
          })
        ) : null}
      </div>

      {/* Mobile */}
      <div className="md:hidden px-4 py-2">
        <MobileNavSelector
          items={!isGrouped ? items : undefined}
          groups={isGrouped ? groups : undefined}
          activeItem={activeItem || undefined}
          activeGroupId={groupId || undefined}
          activeItemId={itemId || undefined}
          fallbackLabel={fallbackLabel}
          fallbackIcon={fallbackIcon}
        />
      </div>
    </nav>
  );
  })
);

GenericNavTabs.displayName = 'GenericNavTabs';

export { GenericNavTabs };
