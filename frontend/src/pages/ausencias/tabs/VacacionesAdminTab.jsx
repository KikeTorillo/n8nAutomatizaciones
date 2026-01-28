/**
 * VacacionesAdminTab - Gestión completa de vacaciones (admin)
 * Renderiza la sección según initialSection (navegación desde StateNavTabs)
 * Enero 2026
 */
import { Palmtree, Users, RefreshCw, Clock, CheckCircle, Calendar } from 'lucide-react';
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
 * @param {Object} props
 * @param {string} [props.initialSection='dashboard'] - Sección a mostrar ('dashboard' | 'equipo' | 'estadisticas')
 */
function VacacionesAdminTab({ initialSection = 'dashboard' }) {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vacaciones'], refetchType: 'active' });
  };

  // Configuración por sección
  const sectionConfig = {
    dashboard: { title: 'Mi Dashboard', icon: Palmtree, color: 'green' },
    equipo: { title: 'Solicitudes del Equipo', icon: Users, color: 'primary' },
    estadisticas: { title: 'Estadísticas de Vacaciones', icon: Calendar, color: 'blue' },
  };

  const config = sectionConfig[initialSection] || sectionConfig.dashboard;
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 text-${config.color}-600 dark:text-${config.color}-400`} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {config.title}
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Contenido según sección */}
      {initialSection === 'dashboard' && <VacacionesDashboard />}
      {initialSection === 'equipo' && <SolicitudesEquipoSection />}
      {initialSection === 'estadisticas' && <EstadisticasVacaciones />}
    </div>
  );
}

export default VacacionesAdminTab;
