import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Bell, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Definición de items de navegación para Agendamiento
 * Nota: Bloqueos se movió a /ausencias?tab=otros-bloqueos (Ene 2026)
 */
const NAV_ITEMS = [
  { id: 'citas', label: 'Citas', icon: Calendar, path: '/citas' },
  { id: 'recordatorios', label: 'Recordatorios', icon: Bell, path: '/recordatorios' },
];

/**
 * Encuentra el item activo basado en la ruta actual
 */
function getActiveItem(pathname) {
  const exactMatch = NAV_ITEMS.find(item => pathname === item.path);
  if (exactMatch) return exactMatch;

  for (const item of NAV_ITEMS) {
    if (pathname.startsWith(item.path + '/')) {
      return item;
    }
  }

  if (pathname.startsWith('/citas')) {
    return NAV_ITEMS[0];
  }

  return null;
}

/**
 * Selector móvil - Dropdown con todos los items
 */
function MobileNavSelector({ items, activeItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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

  const ActiveIcon = activeItem?.icon || Calendar;

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
          <span className="text-gray-900 dark:text-gray-100">
            {activeItem?.label || 'Citas'}
          </span>
        </div>
        <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
          role="menu"
        >
          {items.map((item) => {
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
          })}
        </div>
      )}
    </div>
  );
}

/**
 * AgendamientoNavTabs - Navegación principal del módulo Agendamiento
 * Desktop: Tabs horizontales simples
 * Mobile: Dropdown selector único (consistente con Inventario y Profesionales)
 */
export default function AgendamientoNavTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeItem = getActiveItem(location.pathname);

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Desktop: Tabs horizontales */}
      <div className="hidden md:flex items-center gap-1 px-4 py-2">
        {NAV_ITEMS.map((item) => {
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
        })}
      </div>

      {/* Mobile: Selector único */}
      <div className="md:hidden px-4 py-2">
        <MobileNavSelector
          items={NAV_ITEMS}
          activeItem={activeItem}
        />
      </div>
    </nav>
  );
}
