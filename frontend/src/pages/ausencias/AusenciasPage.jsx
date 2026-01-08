/**
 * AusenciasPage - Página principal del módulo Ausencias
 * Unifica Vacaciones + Incapacidades en una sola experiencia
 * Enero 2026
 */
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Users,
  Palmtree,
  HeartPulse,
  CalendarDays,
  Settings,
  CalendarOff,
  Ban,
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import useAuthStore from '@/store/authStore';
import { useSolicitudesPendientesAusencias } from '@/hooks/useAusencias';

// Tabs - Lazy loading para mejor performance
import MisAusenciasTab from './tabs/MisAusenciasTab';
import MiEquipoAusenciasTab from './tabs/MiEquipoAusenciasTab';
import VacacionesAdminTab from './tabs/VacacionesAdminTab';
import IncapacidadesAdminTab from './tabs/IncapacidadesAdminTab';
import OtrosBloqueoTab from './tabs/OtrosBloqueoTab';
import CalendarioAusenciasTab from './tabs/CalendarioAusenciasTab';
import ConfiguracionAusenciasTab from './tabs/ConfiguracionAusenciasTab';

/**
 * Tab item component
 */
function TabItem({ icon: Icon, label, isActive, onClick, count, disabled }) {
  if (disabled) return null;

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
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`
          ml-1 px-2 py-0.5 text-xs rounded-full font-semibold
          ${isActive
              ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }
        `}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Página de Ausencias unificada
 * Tabs dinámicos según el rol del usuario:
 * - Empleado: Mis Ausencias, Calendario
 * - Supervisor: + Mi Equipo
 * - Admin: + Vacaciones, Incapacidades, Configuración
 */
function AusenciasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const { user } = useAuthStore();
  const esAdmin = ['admin', 'propietario', 'super_admin'].includes(user?.rol);

  // Verificar si es supervisor (tiene solicitudes pendientes de su equipo)
  const { data: pendientes, esSupervisor, isLoading: isLoadingSupervisor } =
    useSolicitudesPendientesAusencias();
  const cantidadPendientes = pendientes?.length || 0;

  // Definir tabs disponibles según rol
  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: 'mis-ausencias',
        label: 'Mis Ausencias',
        icon: User,
        roles: ['all'],
      },
    ];

    // Supervisor ve Mi Equipo
    if (esSupervisor || esAdmin) {
      baseTabs.push({
        id: 'mi-equipo',
        label: 'Mi Equipo',
        icon: Users,
        roles: ['supervisor', 'admin'],
        count: cantidadPendientes,
      });
    }

    // Admin ve tabs de gestión
    if (esAdmin) {
      baseTabs.push(
        {
          id: 'vacaciones',
          label: 'Vacaciones',
          icon: Palmtree,
          roles: ['admin'],
        },
        {
          id: 'incapacidades',
          label: 'Incapacidades',
          icon: HeartPulse,
          roles: ['admin'],
        },
        {
          id: 'otros-bloqueos',
          label: 'Otros Bloqueos',
          icon: Ban,
          roles: ['admin'],
        }
      );
    }

    // Calendario para todos
    baseTabs.push({
      id: 'calendario',
      label: 'Calendario',
      icon: CalendarDays,
      roles: ['all'],
    });

    // Configuración solo para admin
    if (esAdmin) {
      baseTabs.push({
        id: 'configuracion',
        label: 'Configuración',
        icon: Settings,
        roles: ['admin'],
      });
    }

    return baseTabs;
  }, [esSupervisor, esAdmin, cantidadPendientes]);

  // Estado del tab activo
  const [activeTab, setActiveTab] = useState(() => {
    // Si viene un tab por URL, usarlo si es válido
    if (tabParam) {
      const validTabs = ['mis-ausencias', 'mi-equipo', 'vacaciones', 'incapacidades', 'otros-bloqueos', 'calendario', 'configuracion'];
      if (validTabs.includes(tabParam)) {
        return tabParam;
      }
    }
    return 'mis-ausencias';
  });

  // Sincronizar tab con URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      // Verificar si el tab es válido para este usuario
      const tabValido = tabs.find((t) => t.id === tabParam);
      if (tabValido) {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, tabs, activeTab]);

  // Cambiar tab y actualizar URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Renderizar contenido del tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'mis-ausencias':
        return <MisAusenciasTab />;
      case 'mi-equipo':
        return esSupervisor || esAdmin ? <MiEquipoAusenciasTab /> : null;
      case 'vacaciones':
        return esAdmin ? <VacacionesAdminTab /> : null;
      case 'incapacidades':
        return esAdmin ? <IncapacidadesAdminTab /> : null;
      case 'otros-bloqueos':
        return esAdmin ? <OtrosBloqueoTab /> : null;
      case 'calendario':
        return <CalendarioAusenciasTab esAdmin={esAdmin} />;
      case 'configuracion':
        return esAdmin ? <ConfiguracionAusenciasTab /> : null;
      default:
        return <MisAusenciasTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <BackButton to="/home" label="Volver al Inicio" />
          </div>

          {/* Título */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <CalendarOff className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ausencias
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestión de vacaciones e incapacidades
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 -mb-2">
            {tabs.map((tab) => (
              <TabItem
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
                count={tab.count}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default AusenciasPage;
