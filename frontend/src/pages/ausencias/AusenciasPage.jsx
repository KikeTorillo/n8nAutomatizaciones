/**
 * AusenciasPage - Página principal del módulo Ausencias
 * Unifica Vacaciones + Incapacidades en una sola experiencia
 * Navegación plana sin grupos - Enero 2026
 */
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  User,
  Users,
  CalendarDays,
  Settings,
  BarChart3,
  FileSpreadsheet,
  Umbrella,
  HeartPulse,
  Lock,
} from 'lucide-react';
import { BackButton, Button, StateNavTabs, LoadingSpinner } from '@/components/ui';
import useAuthStore, { selectUser } from '@/store/authStore';
import { useToast, useExportCSV } from '@/hooks/utils';
import {
  useSolicitudesPendientesAusencias,
  useMisAusencias,
} from '@/hooks/personas';

// Tab principal (carga eager)
import MisAusenciasTab from './tabs/MisAusenciasTab';

// Tabs secundarios (carga lazy para mejor performance)
const MiEquipoAusenciasTab = lazy(() => import('./tabs/MiEquipoAusenciasTab'));
const DashboardAusenciasTab = lazy(() => import('./tabs/DashboardAusenciasTab'));
const CalendarioAusenciasTab = lazy(() => import('./tabs/CalendarioAusenciasTab'));
const ConfiguracionAusenciasTab = lazy(() => import('./tabs/ConfiguracionAusenciasTab'));

// Fallback para tabs lazy
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner />
    </div>
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
  const toast = useToast();
  const { exportCSV } = useExportCSV();

  const user = useAuthStore(selectUser);
  // FASE 7: Usa nivel_jerarquia >= 80 para admin/propietario
  const esAdmin = user?.nivel_jerarquia >= 80;

  // Verificar si es supervisor (tiene solicitudes pendientes de su equipo)
  const { data: pendientes, esSupervisor, isLoading: isLoadingSupervisor } =
    useSolicitudesPendientesAusencias();
  const cantidadPendientes = pendientes?.length || 0;

  // Hooks para datos exportables (cargan solo cuando se necesitan para exportar)
  const { data: misAusencias } = useMisAusencias();

  // Definir tabs disponibles según rol
  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'mis-ausencias', label: 'Mis Ausencias', icon: User },
    ];

    // Supervisor/Admin ve Mi Equipo (3 sub-tabs)
    if (esSupervisor || esAdmin) {
      allTabs.push(
        { id: 'equipo-vacaciones', label: 'Vacaciones', icon: Umbrella, count: cantidadPendientes },
        { id: 'equipo-incapacidades', label: 'Incapacidades', icon: HeartPulse },
        { id: 'equipo-bloqueos', label: 'Bloqueos', icon: Lock },
      );
    }

    // Admin ve gestión completa
    if (esAdmin) {
      allTabs.push(
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      );
    }

    // Calendario para todos
    allTabs.push({ id: 'calendario', label: 'Calendario', icon: CalendarDays });

    // Configuración solo admin
    if (esAdmin) {
      allTabs.push({ id: 'configuracion', label: 'Configuración', icon: Settings });
    }

    return allTabs;
  }, [esSupervisor, esAdmin, cantidadPendientes]);

  // Grupos de tabs para desktop (evita overflow horizontal)
  const tabGroups = useMemo(() => {
    const groups = [];

    // Grupo Mi Equipo para supervisores/admin
    if (esSupervisor || esAdmin) {
      groups.push({
        icon: Users,
        label: 'Mi Equipo',
        tabIds: ['equipo-vacaciones', 'equipo-incapacidades', 'equipo-bloqueos'],
      });
    }

    // Grupo Administración solo para admin
    if (esAdmin) {
      groups.push({
        icon: BarChart3,
        label: 'Administración',
        tabIds: ['dashboard', 'configuracion'],
      });
    }

    return groups;
  }, [esSupervisor, esAdmin]);

  // IDs válidos de tabs
  const validTabIds = useMemo(() => tabs.map(t => t.id), [tabs]);

  // Estado del tab activo
  const [activeTab, setActiveTab] = useState(() => {
    // Si viene un tab por URL, usarlo si es válido
    if (tabParam && validTabIds.includes(tabParam)) {
      return tabParam;
    }
    return 'mis-ausencias';
  });

  // Sincronizar tab con URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      if (validTabIds.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, validTabIds, activeTab]);

  // Cambiar tab y actualizar URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Renderizar contenido del tab activo
  const renderTabContent = () => {
    // Tab principal carga sin Suspense (eager)
    if (activeTab === 'mis-ausencias') {
      return <MisAusenciasTab />;
    }

    // Tabs secundarios con Suspense (lazy)
    let content;
    switch (activeTab) {
      case 'equipo-vacaciones':
        content = (esSupervisor || esAdmin) ? <MiEquipoAusenciasTab seccion="vacaciones" /> : null;
        break;
      case 'equipo-incapacidades':
        content = (esSupervisor || esAdmin) ? <MiEquipoAusenciasTab seccion="incapacidades" /> : null;
        break;
      case 'equipo-bloqueos':
        content = (esSupervisor || esAdmin) ? <MiEquipoAusenciasTab seccion="bloqueos" /> : null;
        break;
      case 'dashboard':
        content = esAdmin ? <DashboardAusenciasTab /> : null;
        break;
      case 'calendario':
        content = <CalendarioAusenciasTab esAdmin={esAdmin} />;
        break;
      case 'configuracion':
        content = esAdmin ? <ConfiguracionAusenciasTab /> : null;
        break;
      default:
        return <MisAusenciasTab />;
    }

    if (!content) return null;

    return (
      <Suspense fallback={<TabLoadingFallback />}>
        {content}
      </Suspense>
    );
  };

  // Verificar si el tab actual es exportable
  const tabsExportables = ['mis-ausencias', 'equipo-vacaciones'];
  const puedeExportar = tabsExportables.includes(activeTab);

  // Handler para exportar CSV según tab activo usando hook centralizado
  const handleExportarAusencias = () => {
    switch (activeTab) {
      case 'mis-ausencias': {
        if (!misAusencias || misAusencias.length === 0) {
          toast.error('No hay ausencias para exportar');
          return;
        }
        const datosExportar = misAusencias.map((a) => ({
          codigo: a.codigo || '',
          tipo: a.tipo === 'vacaciones' ? 'Vacaciones' : 'Incapacidad',
          fecha_inicio: a.fechaInicio ? format(new Date(a.fechaInicio.split('T')[0] + 'T12:00:00'), 'dd/MM/yyyy') : '',
          fecha_fin: a.fechaFin ? format(new Date(a.fechaFin.split('T')[0] + 'T12:00:00'), 'dd/MM/yyyy') : '',
          dias: a.dias || 0,
          estado: a.estadoConfig?.label || a.estado || '',
          motivo: a.motivo || '',
        }));
        exportCSV(datosExportar, [
          { key: 'codigo', header: 'Código' },
          { key: 'tipo', header: 'Tipo' },
          { key: 'fecha_inicio', header: 'Fecha Inicio' },
          { key: 'fecha_fin', header: 'Fecha Fin' },
          { key: 'dias', header: 'Días' },
          { key: 'estado', header: 'Estado' },
          { key: 'motivo', header: 'Motivo' },
        ], `mis_ausencias_${format(new Date(), 'yyyyMMdd')}`);
        break;
      }

      case 'equipo-vacaciones': {
        if (!pendientes || pendientes.length === 0) {
          toast.error('No hay solicitudes del equipo para exportar');
          return;
        }
        const datosEquipo = pendientes.map((s) => ({
          profesional: s.profesionalNombre || '',
          puesto: s.puestoNombre || '',
          tipo: s.tipo === 'vacaciones' ? 'Vacaciones' : 'Incapacidad',
          fecha_inicio: s.fechaInicio ? format(new Date(s.fechaInicio.split('T')[0] + 'T12:00:00'), 'dd/MM/yyyy') : '',
          fecha_fin: s.fechaFin ? format(new Date(s.fechaFin.split('T')[0] + 'T12:00:00'), 'dd/MM/yyyy') : '',
          dias: s.dias || 0,
          estado: s.estado || '',
          motivo: s.motivo || '',
        }));
        exportCSV(datosEquipo, [
          { key: 'profesional', header: 'Profesional' },
          { key: 'puesto', header: 'Puesto' },
          { key: 'tipo', header: 'Tipo' },
          { key: 'fecha_inicio', header: 'Fecha Inicio' },
          { key: 'fecha_fin', header: 'Fecha Fin' },
          { key: 'dias', header: 'Días' },
          { key: 'estado', header: 'Estado' },
          { key: 'motivo', header: 'Motivo' },
        ], `equipo_ausencias_${format(new Date(), 'yyyyMMdd')}`);
        break;
      }

      default:
        toast.error('Este tab no soporta exportación');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header fijo del módulo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ausencias</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestión de vacaciones e incapacidades
            </p>
          </div>
          {puedeExportar && (
            <Button
              variant="secondary"
              onClick={handleExportarAusencias}
              aria-label="Exportar datos a CSV"
              className="w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
          )}
        </div>
      </div>

      {/* NavTabs - con grupos para evitar overflow en desktop */}
      <StateNavTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        groups={tabGroups}
        sticky={false}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default AusenciasPage;
