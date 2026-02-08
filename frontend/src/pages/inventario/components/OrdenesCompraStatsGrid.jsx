/**
 * Grid de estadísticas para Órdenes de Compra
 * Feb 2026 - Extracción desde OrdenesCompraPage
 */

import { memo, useMemo } from 'react';
import {
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { StatCardGrid } from '@/components/ui';

/**
 * Componente que calcula stats del data y renderiza StatCardGrid
 * @param {Object} props
 * @param {Object} props.totales - Objeto con totales del backend
 * @param {number} props.totales.cantidad - Total de órdenes
 * @param {number|string} props.totales.valor_total - Valor total de órdenes
 * @param {number|string} props.totales.total_pagado - Total pagado
 * @param {number|string} props.totales.pendiente_pago - Pendiente de pago
 */
const OrdenesCompraStatsGrid = memo(function OrdenesCompraStatsGrid({ totales }) {
  const stats = useMemo(() => {
    if (!totales) return null;

    return [
      {
        icon: ShoppingCart,
        label: 'Total Ordenes',
        value: totales.cantidad || 0,
      },
      {
        icon: DollarSign,
        label: 'Valor Total',
        value: `$${parseFloat(totales.valor_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        color: 'primary',
      },
      {
        icon: Package,
        label: 'Total Pagado',
        value: `$${parseFloat(totales.total_pagado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        color: 'green',
      },
      {
        icon: AlertTriangle,
        label: 'Pendiente de Pago',
        value: `$${parseFloat(totales.pendiente_pago || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        color: 'orange',
      },
    ];
  }, [totales]);

  if (!stats) return null;

  return <StatCardGrid stats={stats} />;
});

export default OrdenesCompraStatsGrid;
