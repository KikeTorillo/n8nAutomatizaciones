import { memo } from 'react';
import PropTypes from 'prop-types';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALERT_VARIANTS } from '@/lib/uiConstants';

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
  const styles = ALERT_VARIANTS[variant] || ALERT_VARIANTS.info;
  const DefaultIcon = defaultIcons[variant] || defaultIcons.warning;

  return (
    <div
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        styles.container,
        'border rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icono principal */}
        {Icon && (
          <div className={cn('p-3 rounded-lg', styles.iconBg)}>
            <Icon className={cn('h-6 w-6', styles.icon)} />
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header con título y botón cerrar */}
          {title && (
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {!Icon && <DefaultIcon className={cn('h-4 w-4', styles.icon)} />}
                <h3 className={cn('font-semibold', styles.title)}>
                  {title}
                </h3>
              </div>
              {dismissible && onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className={cn(
                    'p-1 rounded-lg transition-colors',
                    styles.text,
                    'hover:bg-black/5 dark:hover:bg-white/5'
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Contenido de la alerta */}
          <div className={styles.text}>
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

Alert.propTypes = {
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'error', 'rose']),
  icon: PropTypes.elementType,
  title: PropTypes.string,
  children: PropTypes.node,
  action: PropTypes.node,
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

export { Alert };
