import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { EMPTY_STATE_SIZES, EMPTY_STATE_BASE } from '@/lib/uiConstants';

/**
 * EmptyState - Estado vacío reutilizable para listas y tablas
 *
 * @param {Object} props
 * @param {React.ComponentType} [props.icon] - Icono de lucide-react (default: Inbox)
 * @param {string} props.title - Título del estado vacío
 * @param {string} [props.description] - Descripción adicional
 * @param {string} [props.actionLabel] - Texto del botón de acción
 * @param {Function} [props.onAction] - Callback del botón de acción
 * @param {'primary'|'secondary'|'outline'} [props.actionVariant] - Variante del botón
 * @param {React.ReactNode} [props.children] - Contenido adicional
 * @param {'sm'|'md'|'lg'} [props.size] - Tamaño del componente
 * @param {string} [props.className] - Clases adicionales
 */
export const EmptyState = memo(function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  children,
  size = 'md',
  className,
}) {
  const sizes = EMPTY_STATE_SIZES[size] || EMPTY_STATE_SIZES.md;

  return (
    <div
      className={cn(
        EMPTY_STATE_BASE.container,
        sizes.container,
        className
      )}
    >
      <Icon
        className={cn(
          EMPTY_STATE_BASE.icon,
          sizes.icon
        )}
      />
      <h3
        className={cn(
          EMPTY_STATE_BASE.title,
          sizes.title
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            EMPTY_STATE_BASE.description,
            sizes.description
          )}
        >
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  actionVariant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  children: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};
