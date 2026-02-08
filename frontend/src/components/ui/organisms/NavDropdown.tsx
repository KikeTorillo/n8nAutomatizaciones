import { useState, useRef, useCallback, memo, forwardRef, type ComponentType, type ForwardedRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutsideRef } from '@/hooks/utils/useClickOutside';
import { useEscapeKey } from '@/hooks/utils';

/**
 * Item del dropdown de navegación
 */
export interface NavDropdownItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  path: string;
}

/**
 * Props del componente NavDropdown
 */
export interface NavDropdownProps {
  /** Texto del botón dropdown */
  label: string;
  /** Icono lucide-react del grupo */
  icon?: ComponentType<{ className?: string }>;
  /** Array de items */
  items?: NavDropdownItem[];
  /** Si el grupo contiene la ruta activa */
  isActive?: boolean;
  /** ID del item activo dentro del grupo */
  activeItemId?: string;
  /** Handler para selección (modo controlado, sin router) */
  onItemSelect?: (item: NavDropdownItem) => void;
  /** Clases adicionales */
  className?: string;
}

/**
 * NavDropdown - Dropdown de navegación con items agrupados
 * Usado para agrupar múltiples rutas bajo un mismo menú desplegable
 *
 * Ene 2026: Movido de molecules a organisms (maneja estado complejo y coordina navegación)
 */
export const NavDropdown = memo(
  forwardRef<HTMLDivElement, NavDropdownProps>(function NavDropdown({
  label,
  icon: Icon,
  items = [],
  isActive = false,
  activeItemId,
  onItemSelect,
  className,
}, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const setRefs = useCallback((node: HTMLDivElement | null) => {
    dropdownRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [ref]);

  // Cerrar al hacer click fuera (usando hook centralizado)
  useClickOutsideRef(dropdownRef, () => setIsOpen(false), isOpen);

  // Cerrar con Escape
  useEscapeKey(() => setIsOpen(false), isOpen);

  const handleItemClick = useCallback(
    (item: NavDropdownItem) => {
      if (onItemSelect) {
        onItemSelect(item);
      } else {
        navigate!(item.path);
      }
      setIsOpen(false);
    },
    [onItemSelect, navigate]
  );

  return (
    <div className="relative" ref={setRefs}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[44px]',
          isActive
            ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${label}, ${items.length} opciones`}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isItemActive = item.id === activeItemId;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors min-h-[44px]',
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
                        : 'text-gray-400 dark:text-gray-500'
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
      )}
    </div>
  );
  })
);

NavDropdown.displayName = 'NavDropdown';
