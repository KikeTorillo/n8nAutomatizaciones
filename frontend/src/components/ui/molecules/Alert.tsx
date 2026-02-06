import { memo, forwardRef, type ReactNode } from 'react';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALERT_VARIANTS } from '@/lib/uiConstants';
import type { AlertVariant, LucideIcon } from '@/types/ui';

// Mapeo de iconos por defecto según la variante
const defaultIcons: Record<string, LucideIcon> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle,
  error: XCircle,
  rose: AlertTriangle,
};

export interface AlertProps {
  /** Variante de color */
  variant?: AlertVariant;
  /** Icono principal */
  icon?: LucideIcon;
  /** Título de la alerta */
  title?: string;
  /** Contenido de la alerta */
  children?: ReactNode;
  /** Botón/acción opcional */
  action?: ReactNode;
  /** Si se puede cerrar */
  dismissible?: boolean;
  /** Callback al cerrar */
  onDismiss?: () => void;
  /** Clases adicionales */
  className?: string;
}

interface AlertVariantStyles {
  container: string;
  iconBg: string;
  icon: string;
  title: string;
  text: string;
}

/**
 * Alert — Mensaje inline persistente dentro del flujo de la página.
 *
 * Se renderiza en el lugar donde se coloca y permanece visible hasta que
 * el usuario lo cierre (si `dismissible`) o hasta que cambie el estado.
 * Ideal para advertencias de formulario, estados de error permanentes
 * o información contextual (ej. "Tu suscripción expira pronto").
 *
 * Para notificaciones temporales tipo overlay que desaparecen solas
 * (ej. "Guardado correctamente"), usar {@link Toast}.
 */
const Alert = memo(
  forwardRef<HTMLDivElement, AlertProps>(function Alert({
  variant = 'info',
  icon: Icon,
  title,
  children,
  action,
  dismissible = false,
  onDismiss,
  className,
}, ref) {
  const styles = ALERT_VARIANTS[variant] || ALERT_VARIANTS.info;
  const DefaultIcon = defaultIcons[variant] || defaultIcons.warning;

  return (
    <div
      ref={ref}
      role="alert"
      aria-live={variant === 'error' || variant === 'danger' ? 'assertive' : 'polite'}
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
}));

Alert.displayName = 'Alert';

export { Alert };
