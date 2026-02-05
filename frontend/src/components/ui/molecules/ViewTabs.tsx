import { memo, useCallback, useRef, forwardRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import {
  TAB_CONTAINER_STYLES,
  TAB_NAV_STYLES,
  getTabButtonStyles,
  getTabIconStyles,
} from '@/lib/uiConstants';
import type { ViewTab, LucideIcon } from '@/types/ui';

export interface ViewTabsProps {
  /** Configuración de tabs */
  tabs: ViewTab[];
  /** ID del tab activo */
  activeTab: string;
  /** Callback cuando cambia el tab */
  onChange: (tabId: string) => void;
  /** Clases adicionales */
  className?: string;
  /** Etiqueta ARIA para el tablist */
  ariaLabel?: string;
}

interface TabButtonProps {
  /** Configuración del tab */
  tab: ViewTab;
  /** Si el tab está activo */
  isActive: boolean;
  /** Callback cuando cambia el tab */
  onChange: (tabId: string) => void;
  /** Handler para navegación con teclado */
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * ViewTabs - Tabs para cambiar entre vistas (Lista, Calendario, etc.)
 */
export const ViewTabs = memo(function ViewTabs({
  tabs,
  activeTab,
  onChange,
  className,
  ariaLabel = 'Cambiar vista',
}: ViewTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Handler para navegación con flechas
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const tabCount = tabs.length;
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % tabCount;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + tabCount) % tabCount;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = tabCount - 1;
    }

    if (newIndex !== currentIndex) {
      onChange(tabs[newIndex].id);
      tabRefs.current[newIndex]?.focus();
    }
  }, [tabs, onChange]);

  return (
    <div className={cn(TAB_CONTAINER_STYLES, className)}>
      <nav
        className={TAB_NAV_STYLES}
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab, index) => (
          <TabButton
            key={tab.id}
            ref={(el) => { tabRefs.current[index] = el; }}
            tab={tab}
            isActive={activeTab === tab.id}
            onChange={onChange}
            onKeyDown={(e) => handleKeyDown(e, index)}
          />
        ))}
      </nav>
    </div>
  );
});

/**
 * TabButton - Botón de tab memoizado con forwardRef
 */
const TabButton = memo(forwardRef<HTMLButtonElement, TabButtonProps>(function TabButton(
  { tab, isActive, onChange, onKeyDown },
  ref
) {
  const Icon = tab.icon as LucideIcon | undefined;

  const handleClick = useCallback(() => {
    onChange(tab.id);
  }, [onChange, tab.id]);

  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      className={getTabButtonStyles(isActive)}
    >
      {Icon && (
        <Icon
          className={getTabIconStyles(isActive)}
          aria-hidden="true"
        />
      )}
      <span className="hidden sm:inline">{tab.label}</span>
      {/* Mostrar solo icono en móvil si hay icono */}
      {Icon && <span className="sm:hidden">{tab.label}</span>}
      {/* Si no hay icono, mostrar siempre el label */}
      {!Icon && <span className="sm:hidden">{tab.label}</span>}
    </button>
  );
}));

ViewTabs.displayName = 'ViewTabs';
