import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutsideRef } from '@/hooks/utils/useClickOutside';

/**
 * NavDropdown - Dropdown de navegación con items agrupados
 * Usado para agrupar múltiples rutas bajo un mismo menú desplegable
 *
 * Ene 2026: Movido de molecules a organisms (maneja estado complejo y coordina navegación)
 *
 * @param {string} label - Texto del botón dropdown
 * @param {React.ComponentType} icon - Icono lucide-react del grupo
 * @param {Array} items - Array de items: { id, label, icon, path }
 * @param {boolean} isActive - Si el grupo contiene la ruta activa
 * @param {string} activeItemId - ID del item activo dentro del grupo
 * @param {string} className - Clases adicionales
 */
export const NavDropdown = memo(function NavDropdown({
  label,
  icon: Icon,
  items = [],
  isActive = false,
  activeItemId,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Cerrar al hacer click fuera (usando hook centralizado)
  useClickOutsideRef(dropdownRef, () => setIsOpen(false), isOpen);

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

  const handleItemClick = useCallback((path) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  return (
    <div className="relative" ref={dropdownRef}>
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
                onClick={() => handleItemClick(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors min-h-[44px]',
                  isItemActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                role="menuitem"
              >
                {ItemIcon && (
                  <ItemIcon className={cn('h-4 w-4', isItemActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500')} />
                )}
                <span className="flex-1">{item.label}</span>
                {isItemActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

NavDropdown.displayName = 'NavDropdown';

export default NavDropdown;
