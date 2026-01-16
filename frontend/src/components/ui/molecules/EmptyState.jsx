import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import Button from '../atoms/Button';

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
export function EmptyState({
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
  const sizeClasses = {
    sm: {
      container: 'p-6',
      icon: 'w-10 h-10',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'p-8 sm:p-12',
      icon: 'w-12 h-12 sm:w-16 sm:h-16',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'p-12 sm:p-16',
      icon: 'w-16 h-16 sm:w-20 sm:h-20',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm',
        'border border-gray-200 dark:border-gray-700',
        'text-center',
        sizes.container,
        className
      )}
    >
      <Icon
        className={cn(
          'mx-auto mb-4 text-gray-400 dark:text-gray-500',
          sizes.icon
        )}
      />
      <h3
        className={cn(
          'font-semibold text-gray-900 dark:text-gray-100 mb-2',
          sizes.title
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'text-gray-600 dark:text-gray-400 mb-6',
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
}

export default EmptyState;
