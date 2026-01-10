import { useState, useRef, useEffect } from 'react';
import {
  User,
  Briefcase,
  Heart,
  GraduationCap,
  FileText,
  Wallet,
  Settings,
  Calendar,
  ChevronDown,
  Check,
  UserCircle,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeo de iconos por tab
const TAB_ICONS = {
  general: User,
  trabajo: Briefcase,
  personal: Heart,
  curriculum: GraduationCap,
  documentos: FileText,
  compensacion: Wallet,
  ausencias: Calendar,
  configuracion: Settings,
};

/**
 * TabDropdown - Dropdown para agrupar tabs en desktop
 * Patrón consistente con AusenciasPage
 */
function TabDropdown({ icon: Icon, label, items, activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Verificar si algún item del grupo está activo
  const hasActiveItem = items.some((item) => item.id === activeTab);
  const activeItem = items.find((item) => item.id === activeTab);

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
          'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
          hasActiveItem
            ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400'
            : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {activeItem ? (
          <>
            {(() => {
              const ActiveIcon = TAB_ICONS[activeItem.id] || User;
              return <ActiveIcon className="h-4 w-4 flex-shrink-0" />;
            })()}
            <span>{activeItem.label}</span>
          </>
        ) : (
          <>
            <Icon className="h-4 w-4 flex-shrink-0" />
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
            const ItemIcon = TAB_ICONS[item.id] || User;
            const isItemActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
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
 * MobileTabSelector - Dropdown para seleccionar tabs en móvil
 * Muestra todos los tabs en una lista plana
 */
function MobileTabSelector({ tabs, activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveIcon = TAB_ICONS[activeTab] || User;

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

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

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
            {activeTabData?.label || 'General'}
          </span>
        </div>
        <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[60vh] overflow-y-auto"
          role="menu"
        >
          {tabs.map((tab) => {
            const TabIcon = TAB_ICONS[tab.id] || User;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                role="menuitem"
              >
                <TabIcon className={cn('h-4 w-4', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400')} />
                <span className="flex-1">{tab.label}</span>
                {isActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Navegación de tabs para la página de detalle del profesional
 * Desktop: Tabs horizontales con dropdowns para grupos (sin scroll)
 * Mobile: Dropdown selector único
 *
 * Estructura desktop (5 elementos):
 * - General (standalone)
 * - Trabajo (standalone)
 * - Perfil ▼ (Personal, Currículum, Documentos)
 * - Compensación (standalone)
 * - Gestión ▼ (Ausencias, Configuración)
 */
function ProfesionalTabs({ tabs, activeTab, onTabChange }) {
  // Tabs standalone (visibles directamente)
  const standaloneTabs = ['general', 'trabajo', 'compensacion'];

  // Grupos de tabs
  const perfilGroup = {
    icon: UserCircle,
    label: 'Perfil',
    items: tabs.filter(t => ['personal', 'curriculum', 'documentos'].includes(t.id))
  };

  const gestionGroup = {
    icon: Shield,
    label: 'Gestión',
    items: tabs.filter(t => ['ausencias', 'configuracion'].includes(t.id))
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[140px] z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: Tabs horizontales con dropdowns */}
        <nav className="hidden md:flex items-center -mb-px" aria-label="Tabs">
          {/* General */}
          {tabs.filter(t => t.id === 'general').map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Trabajo */}
          {tabs.filter(t => t.id === 'trabajo').map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Dropdown: Perfil (Personal, Currículum, Documentos) */}
          {perfilGroup.items.length > 0 && (
            <TabDropdown
              icon={perfilGroup.icon}
              label={perfilGroup.label}
              items={perfilGroup.items}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          )}

          {/* Compensación */}
          {tabs.filter(t => t.id === 'compensacion').map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Dropdown: Gestión (Ausencias, Configuración) */}
          {gestionGroup.items.length > 0 && (
            <TabDropdown
              icon={gestionGroup.icon}
              label={gestionGroup.label}
              items={gestionGroup.items}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          )}
        </nav>

        {/* Mobile: Selector dropdown con todos los tabs */}
        <div className="md:hidden py-2">
          <MobileTabSelector
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>
      </div>
    </div>
  );
}

export default ProfesionalTabs;
