import { memo } from 'react';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeo de iconos por defecto según la variante
const defaultIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  rose: AlertTriangle,
};

/**
 * Alert - Componente de alerta reutilizable
 *
 * @param {Object} props
 * @param {'info'|'success'|'warning'|'error'|'rose'} props.variant - Variante de color
 * @param {LucideIcon} props.icon - Icono principal
 * @param {string} props.title - Título de la alerta
 * @param {ReactNode} props.children - Contenido de la alerta
 * @param {ReactNode} [props.action] - Botón/acción opcional
 * @param {boolean} [props.dismissible] - Si se puede cerrar
 * @param {Function} [props.onDismiss] - Callback al cerrar
 * @param {string} [props.className] - Clases adicionales
 */

const variantStyles = {
  info: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    border: 'border-primary-200 dark:border-primary-800',
    iconBg: 'bg-primary-100 dark:bg-primary-900/40',
    iconColor: 'text-primary-600 dark:text-primary-400',
    titleColor: 'text-primary-800 dark:text-primary-200',
    textColor: 'text-primary-700 dark:text-primary-300',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-800 dark:text-green-200',
    textColor: 'text-green-700 dark:text-green-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-amber-800 dark:text-amber-200',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-800 dark:text-red-200',
    textColor: 'text-red-700 dark:text-red-300',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
    titleColor: 'text-rose-800 dark:text-rose-200',
    textColor: 'text-rose-700 dark:text-rose-300',
  },
};

const Alert = memo(function Alert({
  variant = 'info',
  icon: Icon,
  title,
  children,
  action,
  dismissible = false,
  onDismiss,
  className,
}) {
  const styles = variantStyles[variant] || variantStyles.info;
  const DefaultIcon = defaultIcons[variant] || defaultIcons.warning;

  return (
    <div
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        styles.bg,
        styles.border,
        'border rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icono principal */}
        {Icon && (
          <div className={cn('p-3 rounded-lg', styles.iconBg)}>
            <Icon className={cn('h-6 w-6', styles.iconColor)} />
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header con título y botón cerrar */}
          {title && (
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <DefaultIcon className={cn('h-4 w-4', styles.iconColor)} />
                <h3 className={cn('font-semibold', styles.titleColor)}>
                  {title}
                </h3>
              </div>
              {dismissible && onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className={cn(
                    'p-1 rounded-lg transition-colors',
                    styles.textColor,
                    'hover:bg-black/5 dark:hover:bg-white/5'
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Contenido de la alerta */}
          <div className={styles.textColor}>
            {children}
          </div>

          {/* Acción opcional */}
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Alert.displayName = 'Alert';

export { Alert };
export default Alert;
