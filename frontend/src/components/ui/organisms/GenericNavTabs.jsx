import { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavDropdown } from './NavDropdown';
import { MobileNavSelector } from './MobileNavSelector';

/**
 * Encuentra el item activo basado en la ruta actual (modo flat)
 */
function getActiveItem(pathname, items, defaultPath) {
  // Buscar coincidencia exacta primero
  const exactMatch = items.find(item => pathname === item.path);
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
function getActiveInfo(pathname, groups) {
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
 * GenericNavTabs - Navegación de tabs genérica para módulos
 *
 * Soporta dos modos:
 * - Flat: Array simple de items → tabs horizontales en desktop
 * - Grouped: Array de grupos → dropdowns en desktop
 *
 * Mobile siempre usa MobileNavSelector
 *
 * @param {Object} props
 * @param {Array} [props.items] - Items planos: { id, label, icon, path }
 * @param {Array} [props.groups] - Grupos con items: { id, label, icon, items: [] }
 * @param {string} [props.defaultPath] - Path base del módulo para detección de activo
 * @param {string} [props.fallbackLabel] - Label para mobile si no hay item activo
 * @param {React.ComponentType} [props.fallbackIcon] - Icono para mobile si no hay item activo
 * @param {string} [props.className] - Clases adicionales
 */
const GenericNavTabs = memo(function GenericNavTabs({
  items,
  groups,
  defaultPath,
  fallbackLabel,
  fallbackIcon,
  className,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isGrouped = !!groups;

  // Calcular estado activo según modo
  const activeItem = !isGrouped ? getActiveItem(location.pathname, items, defaultPath) : null;
  const { groupId, itemId } = isGrouped ? getActiveInfo(location.pathname, groups) : { groupId: null, itemId: null };

  return (
    <nav className={cn('bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700', className)}>
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-1 px-4 py-2">
        {isGrouped ? (
          // Modo agrupado: Dropdowns
          groups.map((group) => (
            <NavDropdown
              key={group.id}
              label={group.label}
              icon={group.icon}
              items={group.items}
              isActive={group.id === groupId}
              activeItemId={itemId}
            />
          ))
        ) : (
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
                <ItemIcon className={cn('h-4 w-4', isActive ? 'text-primary-600 dark:text-primary-400' : '')} />
                {item.label}
              </button>
            );
          })
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden px-4 py-2">
        <MobileNavSelector
          items={!isGrouped ? items : undefined}
          groups={isGrouped ? groups : undefined}
          activeItem={activeItem}
          activeGroupId={groupId}
          activeItemId={itemId}
          fallbackLabel={fallbackLabel}
          fallbackIcon={fallbackIcon}
        />
      </div>
    </nav>
  );
});

GenericNavTabs.displayName = 'GenericNavTabs';

export { GenericNavTabs };
