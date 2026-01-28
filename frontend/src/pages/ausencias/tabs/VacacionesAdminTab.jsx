/**
 * VacacionesAdminTab - Gestión completa de vacaciones (admin)
 * Muestra dashboard + solicitudes + estadísticas en una sola vista
 * Enero 2026
 */
import { ClipboardList, RefreshCw, Clock, CheckCircle, Calendar, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, StatCardGrid } from '@/components/ui';
import { VacacionesDashboard, SolicitudesEquipoSection } from '@/components/vacaciones';
import { useEstadisticasVacaciones } from '@/hooks/personas';

/**
 * Sección de estadísticas
 */
function EstadisticasVacaciones() {
  const anio = new Date().getFullYear();
  const { data: stats, isLoading } = useEstadisticasVacaciones({ anio });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg h-24 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const totalProfesionales = stats?.saldos?.total_empleados || 0;
  const pendientes = stats?.solicitudes?.pendientes || 0;
  const aprobadas = stats?.solicitudes?.aprobadas || 0;
  const diasTotales = stats?.saldos?.total_dias_usados || 0;

  return (
    <StatCardGrid
      stats={[
        {
          key: 'profesionales',
          icon: Users,
          label: 'Profesionales con saldo',
          value: totalProfesionales,
          color: 'primary',
        },
        {
          key: 'pendientes',
          icon: Clock,
          label: 'Solicitudes pendientes',
          value: pendientes,
          color: 'yellow',
        },
        {
          key: 'aprobadas',
          icon: CheckCircle,
          label: 'Solicitudes aprobadas',
          value: aprobadas,
          color: 'green',
        },
        {
          key: 'dias',
          icon: Calendar,
          label: 'Días otorgados',
          value: diasTotales,
          color: 'blue',
        },
      ]}
      columns={4}
    />
  );
}

/**
 * Tab de Vacaciones para Admin
 * Muestra dashboard + solicitudes + estadísticas en una sola vista scrollable
 */
function VacacionesAdminTab() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vacaciones'], refetchType: 'active' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Solicitudes de Vacaciones
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Dashboard con stats principales */}
      <section className="space-y-4">
        <VacacionesDashboard />
      </section>

      {/* Lista de solicitudes */}
      <section className="space-y-4">
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Solicitudes del Equipo
        </h3>
        <SolicitudesEquipoSection />
      </section>

      {/* Estadísticas */}
      <section className="space-y-4">
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Estadísticas del Año
        </h3>
        <EstadisticasVacaciones />
      </section>
    </div>
  );
}

export default VacacionesAdminTab;
