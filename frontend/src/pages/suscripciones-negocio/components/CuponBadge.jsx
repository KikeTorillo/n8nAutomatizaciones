import { memo } from 'react';
import { Tag, Percent, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui';
import { TIPOS_DESCUENTO } from '@/hooks/suscripciones-negocio';
import { formatCurrency } from '@/lib/utils';

/**
 * Badge para mostrar información de cupón
 * @param {Object} cupon - Datos del cupón
 * @param {boolean} showValue - Mostrar valor del descuento
 */
function CuponBadge({ cupon, showValue = true }) {
  if (!cupon) return null;

  const isPorcentaje = cupon.tipo_descuento === TIPOS_DESCUENTO.PORCENTAJE;
  const Icon = isPorcentaje ? Percent : DollarSign;

  const valorFormateado = isPorcentaje
    ? `${cupon.valor_descuento}%`
    : formatCurrency(cupon.valor_descuento);

  return (
    <Badge variant="primary" size="sm" className="gap-1">
      <Tag className="w-3 h-3" />
      <span className="font-mono">{cupon.codigo}</span>
      {showValue && (
        <>
          <span className="mx-1">•</span>
          <Icon className="w-3 h-3" />
          <span>{valorFormateado}</span>
        </>
      )}
    </Badge>
  );
}

CuponBadge.displayName = 'CuponBadge';

export default memo(CuponBadge);
