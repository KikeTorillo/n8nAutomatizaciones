/**
 * Grid de estadísticas para página de Clientes
 * Ene 2026 - Migración a ListadoCRUDPage
 */

import { useMemo } from 'react';
import { Users, UserCheck, Mail, UserX } from 'lucide-react';
import { StatCardGrid } from '@/components/ui';
import { useEstadisticasClientes } from '@/hooks/personas';

/**
 * Componente de estadísticas de clientes
 */
export default function ClientesStatsGrid({ className }) {
  const { data: estadisticas } = useEstadisticasClientes();

  const stats = useMemo(
    () => [
      {
        key: 'total',
        icon: Users,
        label: 'Total Clientes',
        value: estadisticas?.total_clientes || 0,
        color: 'primary',
      },
      {
        key: 'activos',
        icon: UserCheck,
        label: 'Activos',
        value: estadisticas?.clientes_activos || 0,
        color: 'green',
      },
      {
        key: 'marketing',
        icon: Mail,
        label: 'Permiten Marketing',
        value: estadisticas?.clientes_marketing || 0,
        color: 'primary',
      },
      {
        key: 'inactivos',
        icon: UserX,
        label: 'Inactivos',
        value: estadisticas?.clientes_inactivos || 0,
        color: 'yellow',
      },
    ],
    [estadisticas]
  );

  return <StatCardGrid stats={stats} columns={4} className={className} />;
}
