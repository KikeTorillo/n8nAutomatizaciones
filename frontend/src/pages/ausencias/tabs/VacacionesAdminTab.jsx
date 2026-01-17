/**
 * VacacionesAdminTab - Gestión completa de vacaciones (admin)
 * Wrapper del VacacionesDashboard existente con funcionalidades adicionales
 * Enero 2026
 */
import { useState } from 'react';
import { Palmtree, Users, BarChart3, RefreshCw, Clock, CheckCircle, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, StatCardGrid } from '@/components/ui';
import { VacacionesDashboard, SolicitudesEquipoSection } from '@/components/vacaciones';
import { useSaldosVacaciones, useEstadisticasVacaciones } from '@/hooks/personas';

/**
 * Sección de estadísticas
 */
function EstadisticasVacaciones() {
  const anio = new Date().getFullYear();
  const { data: stats, isLoading } = useEstadisticasVacaciones({ anio });
  const { data: saldos } = useSaldosVacaciones({ anio, limit: 1000 });

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

  const totalProfesionales = saldos?.data?.length || 0;
  const pendientes = stats?.pendientes || 0;
  const aprobadas = stats?.aprobadas || 0;
  const diasTotales = stats?.dias_aprobados || 0;

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
 */
function VacacionesAdminTab() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vacaciones'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palmtree className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gestión de Vacaciones
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs de sección */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveSection('dashboard')}
          className={`
            px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2
            ${activeSection === 'dashboard'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <Palmtree className="w-4 h-4" />
          Mi Dashboard
        </button>
        <button
          onClick={() => setActiveSection('equipo')}
          className={`
            px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2
            ${activeSection === 'equipo'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <Users className="w-4 h-4" />
          Solicitudes Equipo
        </button>
        <button
          onClick={() => setActiveSection('estadisticas')}
          className={`
            px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2
            ${activeSection === 'estadisticas'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <BarChart3 className="w-4 h-4" />
          Estadísticas
        </button>
      </div>

      {/* Contenido */}
      {activeSection === 'dashboard' && <VacacionesDashboard />}
      {activeSection === 'equipo' && <SolicitudesEquipoSection />}
      {activeSection === 'estadisticas' && <EstadisticasVacaciones />}
    </div>
  );
}

export default VacacionesAdminTab;
