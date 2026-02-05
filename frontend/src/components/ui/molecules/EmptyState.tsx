import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import { Button } from '../atoms/Button';
import { EMPTY_STATE_SIZES, EMPTY_STATE_BASE } from '@/lib/uiConstants';
import type { Size, ButtonVariant, LucideIcon } from '@/types/ui';

export interface EmptyStateProps {
  /** Icono de lucide-react (default: Inbox) */
  icon?: LucideIcon;
  /** Título del estado vacío */
  title: string;
  /** Descripción adicional */
  description?: string;
  /** Texto del botón de acción */
  actionLabel?: string;
  /** Callback del botón de acción */
  onAction?: () => void;
  /** Variante del botón */
  actionVariant?: Extract<ButtonVariant, 'primary' | 'secondary' | 'outline'>;
  /** Contenido adicional */
  children?: ReactNode;
  /** Tamaño del componente */
  size?: Size;
  /** Clases adicionales */
  className?: string;
}

/**
 * EmptyState - Estado vacío reutilizable para listas y tablas
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
}: EmptyStateProps) {
  const sizes = (EMPTY_STATE_SIZES as Record<Size, { container: string; icon: string; title: string; description: string }>)[size] || EMPTY_STATE_SIZES.md;

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
