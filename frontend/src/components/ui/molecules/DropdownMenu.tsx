import { useState, useRef, useCallback, useEffect, memo, useId, forwardRef, type KeyboardEvent } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { useClickOutsideRef } from '@/hooks/utils/useClickOutside';
import { useEscapeKey } from '@/hooks/utils/useEscapeKey';
import type { DropdownMenuItem, LucideIcon } from '@/types/ui';

export interface DropdownMenuProps {
  /** Elemento que dispara el dropdown (default: ícono de 3 puntos) */
  trigger?: React.ReactNode;
  /** Array de items: { label, icon, onClick, variant, disabled, divider } */
  items?: DropdownMenuItem[];
  /** Alineación del menú: 'left' | 'right' (default: 'right') */
  align?: 'left' | 'right';
  /** Clases adicionales para el contenedor */
  className?: string;
  /** Estado controlado del dropdown */
  isOpen?: boolean;
  /** Callback cuando cambia el estado: (isOpen: boolean) => void */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * DropdownMenu - Menú desplegable para acciones
 *
 * Soporta modo controlado y no controlado:
 * - No controlado (default): gestiona su propio estado interno
 * - Controlado: usa `isOpen` y `onOpenChange` props
 *
 * @example
 * // Modo no controlado (default)
 * <DropdownMenu
 *   items={[
 *     { label: 'Editar', icon: Edit, onClick: () => handleEdit() },
 *     { label: 'Eliminar', icon: Trash, onClick: () => handleDelete(), variant: 'danger' },
 *   ]}
 * />
 *
 * @example
 * // Modo controlado
 * const [isOpen, setIsOpen] = useState(false);
 * <DropdownMenu
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   items={[...]}
 * />
 */
const DropdownMenu = memo(forwardRef<HTMLDivElement, DropdownMenuProps>(function DropdownMenu({
  trigger,
  items = [],
  align = 'right',
  className,
  isOpen: controlledIsOpen,
  onOpenChange,
}, ref) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const triggerId = useId();

  // Patrón controlled/uncontrolled
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Items habilitados (excluye dividers y disabled)
  const enabledItems = items.filter(item => !item.divider && !item.disabled);

  const setIsOpen = useCallback((newValue: boolean | ((prev: boolean) => boolean)) => {
    const nextValue = typeof newValue === 'function' ? newValue(isOpen) : newValue;
    if (isControlled) {
      onOpenChange?.(nextValue);
    } else {
      setInternalIsOpen(nextValue);
    }
  }, [isControlled, isOpen, onOpenChange]);

  // Cerrar al hacer click fuera (usando hook centralizado)
  useClickOutsideRef(dropdownRef, () => setIsOpen(false), isOpen);

  // Cerrar con Escape (usando hook centralizado)
  useEscapeKey(() => setIsOpen(false), isOpen);

  // Reset focus al cerrar
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Focus en item cuando cambia focusedIndex
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  // Handler de navegación por teclado
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < enabledItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : enabledItems.length - 1
        );
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(enabledItems.length - 1);
        break;
      default:
        break;
    }
  }, [isOpen, enabledItems.length]);

  const handleItemClick = useCallback((item: DropdownMenuItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  }, [setIsOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, [setIsOpen]);

  // Combinar refs (externo + interno para click outside)
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    dropdownRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  return (
    <div className={cn('relative inline-block', className)} ref={setRefs}>
      {/* Trigger */}
      {trigger ? (
        <div id={triggerId} onClick={handleToggle}>
          {trigger}
        </div>
      ) : (
        <Button
          id={triggerId}
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="p-1.5"
          aria-label="Más opciones"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      )}

      {/* Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={triggerId}
          onKeyDown={handleKeyDown}
        >
          {(() => {
            // Contador para índice en enabledItems
            let enabledIndex = -1;
            return items.map((item, index) => {
              // Divider
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="my-1 border-t border-gray-200 dark:border-gray-700"
                    role="separator"
                  />
                );
              }

              // Incrementar índice solo para items no-divider y no-disabled
              const isEnabled = !item.disabled;
              if (isEnabled) enabledIndex++;
              const currentEnabledIndex = enabledIndex;

              const Icon = item.icon as LucideIcon | undefined;
              const isDanger = item.variant === 'danger';

              return (
                <button
                  key={item.label || index}
                  ref={isEnabled ? (el) => { itemRefs.current[currentEnabledIndex] = el; } : undefined}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  tabIndex={isEnabled && focusedIndex === currentEnabledIndex ? 0 : -1}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                    'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
                    item.disabled
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : isDanger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  role="menuitem"
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        item.disabled
                          ? 'text-gray-400'
                          : isDanger
                          ? 'text-red-500'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}));

DropdownMenu.displayName = 'DropdownMenu';

export { DropdownMenu };
