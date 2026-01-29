/**
 * Grid de estadísticas para página de Profesionales
 * Ene 2026 - Migración a ListadoCRUDPage
 */

import { useMemo } from 'react';
import { Users, UserCheck, Umbrella, Stethoscope } from 'lucide-react';
import { StatCardGrid } from '@/components/ui';

/**
 * Calcular estadísticas desde lista de profesionales
 */
export default function ProfesionalesStatsGrid({ profesionales = [], total = 0, className }) {
  const stats = useMemo(() => {
    const activos = profesionales.filter(p => p.estado === 'activo').length;
    const vacaciones = profesionales.filter(p => p.estado === 'vacaciones').length;
    const incapacidad = profesionales.filter(p => p.estado === 'incapacidad').length;

    return [
      { label: 'Total', value: total, icon: Users, color: 'purple' },
      { label: 'Activos', value: activos, icon: UserCheck, color: 'green' },
      { label: 'Vacaciones', value: vacaciones, icon: Umbrella, color: 'blue' },
      { label: 'Incapacidad', value: incapacidad, icon: Stethoscope, color: 'yellow' },
    ];
  }, [profesionales, total]);

  return <StatCardGrid stats={stats} className={className} />;
}
