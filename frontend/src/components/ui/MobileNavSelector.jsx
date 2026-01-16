import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * MobileNavSelector - Selector dropdown para navegación móvil
 *
 * Soporta dos modos:
 * - Flat: Array simple de items
 * - Grouped: Array de grupos con items anidados
 *
 * @param {Object} props
 * @param {Array} [props.items] - Items planos: { id, label, icon, path }
 * @param {Array} [props.groups] - Grupos con items: { id, label, icon, items: [] }
 * @param {Object} [props.activeItem] - Item activo actual
 * @param {string} [props.activeGroupId] - ID del grupo activo (modo grouped)
 * @param {string} [props.activeItemId] - ID del item activo (modo grouped)
 * @param {string} [props.fallbackLabel] - Label si no hay item activo
 * @param {React.ComponentType} [props.fallbackIcon] - Icono si no hay item activo
 */
export default function MobileNavSelector({
  items,
  groups,
  activeItem,
  activeGroupId,
  activeItemId,
  fallbackLabel = 'Navegar',
  fallbackIcon: FallbackIcon = Menu,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const isGrouped = !!groups;

  // Para modo grouped, encontrar item y grupo activos
  const groupedActiveItem = isGrouped
    ? groups?.flatMap(g => g.items).find(item => item.id === activeItemId)
    : null;
  const groupedActiveGroup = isGrouped
    ? groups?.find(g => g.id === activeGroupId)
    : null;

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleItemClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  // Determinar icono y label del botón
  const ActiveIcon = isGrouped
    ? (groupedActiveGroup?.icon || FallbackIcon)
    : (activeItem?.icon || FallbackIcon);
  const displayLabel = isGrouped
    ? (groupedActiveItem?.label || fallbackLabel)
    : (activeItem?.label || fallbackLabel);
  const groupLabel = isGrouped ? groupedActiveGroup?.label : null;

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
          <ActiveIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          {groupLabel && (
            <>
              <span className="text-gray-500 dark:text-gray-400">{groupLabel}</span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </>
          )}
          <span className="text-gray-900 dark:text-gray-100">{displayLabel}</span>
        </div>
        <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[70vh] overflow-y-auto"
          role="menu"
        >
          {isGrouped ? (
            // Modo agrupado
            groups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.id}>
                  {/* Header del grupo */}
                  <div className="px-4 py-2 flex items-center gap-2">
                    <GroupIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
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
                        <ItemIcon className={cn('h-4 w-4', isItemActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400')} />
                        <span className="flex-1">{item.label}</span>
                        {isItemActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          ) : (
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
                  <ItemIcon className={cn('h-4 w-4', isItemActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400')} />
                  <span className="flex-1">{item.label}</span>
                  {isItemActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
