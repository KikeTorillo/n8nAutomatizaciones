import { useEffect, memo, forwardRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOAST_EXTENDED_VARIANTS, TOAST_CONTAINER_STYLES } from '@/lib/uiConstants';
import type { ToastType } from '@/types/ui';

export interface ToastProps {
  /** ID único del toast */
  id: string | number;
  /** Mensaje a mostrar */
  message: string;
  /** Tipo de toast */
  type?: ToastType;
  /** Duración en ms antes de auto-cerrar */
  duration?: number;
  /** Callback al cerrar */
  onClose: (id: string | number) => void;
}

// Mapeo de iconos por tipo
const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

/**
 * Toast — Notificación temporal tipo overlay.
 *
 * Se muestra brevemente (por defecto 5 s) en una esquina de la pantalla
 * y desaparece automáticamente. Ideal para confirmar acciones del usuario
 * (ej. "Guardado correctamente") o reportar errores puntuales.
 *
 * Para mensajes que deben permanecer visibles dentro del flujo de la página
 * (ej. advertencia de formulario, estado de suscripción), usar {@link Alert}.
 */
const Toast = memo(
  forwardRef<HTMLDivElement, ToastProps>(function Toast({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose,
}, ref) {
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const variant = TOAST_EXTENDED_VARIANTS[type] || TOAST_EXTENDED_VARIANTS.info;
  const Icon = icons[type] || icons.info;

  return (
    <div
      ref={ref}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        variant.bg,
        variant.border,
        variant.textColor,
        TOAST_CONTAINER_STYLES
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', variant.iconColor)} />

      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>

      <button
        onClick={() => onClose(id)}
        className={cn(variant.iconColor, 'hover:opacity-70 transition-opacity flex-shrink-0')}
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}));

Toast.displayName = 'Toast';

export { Toast };
