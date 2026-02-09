import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/**
 * Card de información editable
 * Muestra un grupo de campos con título, icono y botón de edición
 *
 * @param {Object} props
 * @param {string} props.title - Título de la card
 * @param {string} [props.subtitle] - Subtítulo opcional
 * @param {LucideIcon} [props.icon] - Icono del header
 * @param {ReactNode} props.children - Contenido de la card
 * @param {Function} [props.onEdit] - Callback para edición
 * @param {string} [props.className] - Clases adicionales
 * @param {ReactNode} [props.headerActions] - Acciones adicionales en header
 * @param {'default'|'compact'} [props.variant] - Variante de estilo
 * @param {string} [props.iconColor] - Color del icono (ej: 'blue', 'amber', 'primary')
 */
function InfoCard({
  title,
  subtitle,
  icon: Icon,
  children,
  onEdit,
  className = '',
  headerActions,
  variant = 'default',
  iconColor,
}) {
  // Mapeo de colores para el icono
  const iconColorClasses = {
    blue: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    gray: 'text-gray-400 dark:text-gray-500',
  };

  const isCompact = variant === 'compact';

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
      isCompact && 'shadow-sm',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between',
        isCompact ? 'px-6 py-4' : 'px-4 py-3 border-b border-gray-200 dark:border-gray-700'
      )}>
        <div className="flex items-center gap-3">
          {Icon && (
            iconColor ? (
              <div className={cn('p-3 rounded-lg', iconColorClasses[iconColor] || iconColorClasses.gray)}>
                <Icon className="h-6 w-6" />
              </div>
            ) : (
              <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            )
          )}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        isCompact ? 'px-6 pb-6' : 'p-4 space-y-3'
      )}>
        {children}
      </div>
    </div>
  );
}

export default InfoCard;
