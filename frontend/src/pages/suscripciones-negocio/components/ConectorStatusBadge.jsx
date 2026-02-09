import { memo } from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * Configuración de estados de conectores
 */
const ESTADO_CONFIG = {
  verificado: {
    label: 'Verificado',
    variant: 'success',
    icon: CheckCircle,
    description: 'Conexión verificada y funcionando',
  },
  sin_verificar: {
    label: 'Sin verificar',
    variant: 'warning',
    icon: AlertCircle,
    description: 'Aún no se ha verificado la conexión',
  },
  error: {
    label: 'Error',
    variant: 'error',
    icon: XCircle,
    description: 'La verificación falló',
  },
  pendiente: {
    label: 'Verificando...',
    variant: 'default',
    icon: Clock,
    description: 'Verificación en proceso',
  },
};

/**
 * Formatea la fecha de última verificación
 */
function formatLastVerified(fecha) {
  if (!fecha) return 'Nunca verificado';

  const date = new Date(fecha);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Determina el estado basado en los datos del conector
 */
function getEstado(conector, isVerifying = false) {
  if (isVerifying) return 'pendiente';
  if (conector.verificado === true) return 'verificado';
  if (conector.verificado === false && conector.ultimo_test_fecha) return 'error';
  return 'sin_verificar';
}

/**
 * Genera el texto del tooltip
 */
function getTooltipText(conector, config) {
  let text = config.description;
  if (conector.ultimo_test_fecha) {
    text += ` | Última verificación: ${formatLastVerified(conector.ultimo_test_fecha)}`;
  }
  if (conector.errores_consecutivos > 0) {
    text += ` | Errores consecutivos: ${conector.errores_consecutivos}`;
  }
  return text;
}

/**
 * Badge para mostrar estado de verificación del conector
 * @param {Object} conector - Datos del conector
 * @param {boolean} isVerifying - Si se está verificando actualmente
 * @param {string} size - Tamaño del badge (sm, md, lg)
 * @param {boolean} showIcon - Mostrar icono
 * @param {boolean} showLastVerified - Mostrar última verificación
 */
function ConectorStatusBadge({
  conector,
  isVerifying = false,
  size = 'md',
  showIcon = true,
  showLastVerified = false,
}) {
  const estado = getEstado(conector, isVerifying);
  const config = ESTADO_CONFIG[estado];
  const Icon = config.icon;

  return (
    <div
      className="inline-flex items-center gap-2"
      title={getTooltipText(conector, config)}
    >
      <Badge variant={config.variant} size={size}>
        {showIcon && <Icon className="w-3 h-3 mr-1" />}
        {config.label}
      </Badge>
      {showLastVerified && conector.ultimo_test_fecha && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatLastVerified(conector.ultimo_test_fecha)}
        </span>
      )}
    </div>
  );
}

ConectorStatusBadge.displayName = 'ConectorStatusBadge';

export default memo(ConectorStatusBadge);
