import { useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOAST_EXTENDED_VARIANTS, TOAST_CONTAINER_STYLES } from '@/lib/uiConstants';

/**
 * Componente Toast para notificaciones
 * @param {Object} props
 * @param {string} props.id - ID único del toast
 * @param {string} props.message - Mensaje a mostrar
 * @param {('success'|'error'|'info'|'warning')} props.type - Tipo de toast
 * @param {number} props.duration - Duración en ms antes de auto-cerrar
 * @param {Function} props.onClose - Callback al cerrar
 */
const Toast = memo(function Toast({ id, message, type = 'info', duration = 5000, onClose }) {
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  // Mapeo de iconos por tipo
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const variant = TOAST_EXTENDED_VARIANTS[type] || TOAST_EXTENDED_VARIANTS.info;
  const Icon = icons[type] || icons.info;

  return (
    <div
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
});

Toast.displayName = 'Toast';

Toast.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};

export { Toast };
