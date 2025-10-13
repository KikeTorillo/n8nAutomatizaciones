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
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
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
