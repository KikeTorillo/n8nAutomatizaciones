import { useState, useRef, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { useClickOutsideRef } from '@/hooks/utils/useClickOutside';
import { useEscapeKey } from '@/hooks/utils/useEscapeKey';

/**
 * DropdownMenu - Menú desplegable para acciones
 *
 * Soporta modo controlado y no controlado:
 * - No controlado (default): gestiona su propio estado interno
 * - Controlado: usa `isOpen` y `onOpenChange` props
 *
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - Elemento que dispara el dropdown (default: ícono de 3 puntos)
 * @param {Array} props.items - Array de items: { label, icon, onClick, variant, disabled, divider }
 * @param {string} props.align - Alineación del menú: 'left' | 'right' (default: 'right')
 * @param {string} props.className - Clases adicionales para el contenedor
 * @param {boolean} [props.isOpen] - Estado controlado del dropdown
 * @param {Function} [props.onOpenChange] - Callback cuando cambia el estado: (isOpen: boolean) => void
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
const DropdownMenu = memo(function DropdownMenu({
  trigger,
  items = [],
  align = 'right',
  className,
  isOpen: controlledIsOpen,
  onOpenChange,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Patrón controlled/uncontrolled
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = useCallback((newValue) => {
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

  const handleItemClick = useCallback((item) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  }, [setIsOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, [setIsOpen]);

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      {/* Trigger */}
      {trigger ? (
        <div onClick={handleToggle}>
          {trigger}
        </div>
      ) : (
        <Button
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
        >
          {items.map((item, index) => {
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

            const Icon = item.icon;
            const isDanger = item.variant === 'danger';

            return (
              <button
                key={item.label || index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
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
          })}
        </div>
      )}
    </div>
  );
});

DropdownMenu.displayName = 'DropdownMenu';

DropdownMenu.propTypes = {
  trigger: PropTypes.node,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      icon: PropTypes.elementType,
      onClick: PropTypes.func,
      variant: PropTypes.oneOf(['default', 'danger']),
      disabled: PropTypes.bool,
      divider: PropTypes.bool,
    })
  ),
  align: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
  /** Estado controlado del dropdown */
  isOpen: PropTypes.bool,
  /** Callback cuando cambia el estado: (isOpen: boolean) => void */
  onOpenChange: PropTypes.func,
};

export { DropdownMenu };
