import { memo } from 'react';
import { Badge } from '@/components/ui';
import {
  ESTADOS_SUSCRIPCION,
  ESTADO_LABELS,
  ESTADO_COLORS,
} from '@/hooks/suscripciones-negocio';

/**
 * Badge para mostrar estado de suscripción
 * @param {string} estado - Estado de la suscripción
 * @param {string} size - Tamaño del badge (sm, md, lg)
 */
function SuscripcionStatusBadge({ estado, size = 'md' }) {
  const label = ESTADO_LABELS[estado] || estado;
  const color = ESTADO_COLORS[estado] || 'default';

  // Mapear colores a variantes de Badge
  const variantMap = {
    blue: 'info',
    green: 'success',
    yellow: 'warning',
    red: 'error',
    gray: 'default',
    orange: 'warning',
  };

  const variant = variantMap[color] || 'default';

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}

SuscripcionStatusBadge.displayName = 'SuscripcionStatusBadge';

export default memo(SuscripcionStatusBadge);
