/**
 * VacacionesPage - Página principal de vacaciones
 * Fase 3 del Plan de Empleados Competitivo - Enero 2026
 * FEATURE: Tabs "Mis Vacaciones" y "Mi Equipo" para supervisores
 */
import { useState } from 'react';
import { Calendar, Users, CalendarDays } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import {
  VacacionesDashboard,
  SolicitudesEquipoSection,
  CalendarioEquipoVacaciones,
} from '@/components/vacaciones';
import { useSolicitudesPendientes } from '@/hooks/useVacaciones';

/**
 * Tab item component
 */
function TabItem({ icon: Icon, label, isActive, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && count > 0 && (
        <span className={`
          ml-1 px-2 py-0.5 text-xs rounded-full font-semibold
          ${isActive
            ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Página de gestión de vacaciones
 * Muestra el dashboard de vacaciones del usuario actual
 * Si el usuario es supervisor, muestra tab adicional para aprobar solicitudes
 */
function VacacionesPage() {
  const [activeTab, setActiveTab] = useState('mis-vacaciones');

  // Verificar si hay solicitudes pendientes (solo supervisores ven esta tab)
  const { data: pendientesData } = useSolicitudesPendientes();
  const solicitudesPendientes = pendientesData?.data || [];
  const cantidadPendientes = solicitudesPendientes.length;

  // Mostrar tab de equipo si hay solicitudes pendientes o si no hay error (usuario es supervisor)
  const esSupervisor = pendientesData !== undefined && !pendientesData?.error;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <BackButton to="/home" label="Volver al Inicio" />
          </div>

          {/* Tabs - Solo mostrar si es supervisor */}
          {esSupervisor && (
            <div className="flex items-center gap-2 mt-4">
              <TabItem
                icon={Calendar}
                label="Mis Vacaciones"
                isActive={activeTab === 'mis-vacaciones'}
                onClick={() => setActiveTab('mis-vacaciones')}
              />
              <TabItem
                icon={Users}
                label="Mi Equipo"
                isActive={activeTab === 'mi-equipo'}
                onClick={() => setActiveTab('mi-equipo')}
                count={cantidadPendientes}
              />
              <TabItem
                icon={CalendarDays}
                label="Calendario"
                isActive={activeTab === 'calendario'}
                onClick={() => setActiveTab('calendario')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'mis-vacaciones' && <VacacionesDashboard />}
        {activeTab === 'mi-equipo' && esSupervisor && <SolicitudesEquipoSection />}
        {activeTab === 'calendario' && esSupervisor && <CalendarioEquipoVacaciones soloEquipo={true} />}
      </div>
    </div>
  );
}

export default VacacionesPage;
