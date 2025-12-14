import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Componente Toast para notificaciones
 * @param {Object} props
 * @param {string} props.id - ID único del toast
 * @param {string} props.message - Mensaje a mostrar
 * @param {('success'|'error'|'info'|'warning')} props.type - Tipo de toast
 * @param {number} props.duration - Duración en ms antes de auto-cerrar
 * @param {Function} props.onClose - Callback al cerrar
 */
function Toast({ id, message, type = 'info', duration = 5000, onClose }) {
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const variants = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      textColor: 'text-green-800 dark:text-green-200',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-800 dark:text-red-200',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    info: {
      bg: 'bg-primary-50 dark:bg-primary-900/30',
      border: 'border-primary-200 dark:border-primary-800',
      icon: Info,
      iconColor: 'text-primary-700 dark:text-primary-400',
      textColor: 'text-primary-800 dark:text-primary-200',
    },
  };

  const variant = variants[type] || variants.info;
  const Icon = variant.icon;

  return (
    <div
      className={`
        ${variant.bg} ${variant.border} ${variant.textColor}
        border rounded-lg p-4 shadow-lg
        flex items-start gap-3
        min-w-[320px] max-w-md
        animate-slide-in-right
      `}
    >
      <Icon className={`w-5 h-5 ${variant.iconColor} flex-shrink-0 mt-0.5`} />

      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>

      <button
        onClick={() => onClose(id)}
        className={`${variant.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Toast;
