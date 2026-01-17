/**
 * AusenciasPage - Página principal del módulo Ausencias
 * Unifica Vacaciones + Incapacidades en una sola experiencia
 * Enero 2026
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  User,
  Users,
  Palmtree,
  HeartPulse,
  CalendarDays,
  Settings,
  CalendarOff,
  Ban,
  ChevronDown,
  Check,
  ClipboardList,
  FileSpreadsheet,
} from 'lucide-react';
import { BackButton, Button } from '@/components/ui';
import useAuthStore, { selectUser } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { useExportCSV } from '@/hooks/useExportCSV';
import {
  useSolicitudesPendientesAusencias,
  useMisAusencias,
} from '@/hooks/useAusencias';
import { useIncapacidades } from '@/hooks/useIncapacidades';

// Tabs - Lazy loading para mejor performance
import MisAusenciasTab from './tabs/MisAusenciasTab';
import MiEquipoAusenciasTab from './tabs/MiEquipoAusenciasTab';
import VacacionesAdminTab from './tabs/VacacionesAdminTab';
import IncapacidadesAdminTab from './tabs/IncapacidadesAdminTab';
import OtrosBloqueoTab from './tabs/OtrosBloqueoTab';
import CalendarioAusenciasTab from './tabs/CalendarioAusenciasTab';
import ConfiguracionAusenciasTab from './tabs/ConfiguracionAusenciasTab';

/**
 * Tab item component - Solo visible en desktop (md+)
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
      <span>{label}</span>
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
 * TabDropdown - Dropdown para agrupar tabs en desktop
 */
function TabDropdown({ icon: Icon, label, items, activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Verificar si algún item del grupo está activo
  const hasActiveItem = items.some((item) => item.id === activeTab);
  const activeItem = items.find((item) => item.id === activeTab);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleItemClick = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
          ${hasActiveItem
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {activeItem ? (
          <>
            {(() => {
              const ActiveIcon = activeItem.icon;
              return <ActiveIcon className="w-4 h-4" />;
            })()}
            <span>{activeItem.label}</span>
          </>
        ) : (
          <>
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
          role="menu"
        >
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isItemActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                  isItemActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                role="menuitem"
              >
                <ItemIcon className={`h-4 w-4 ${isItemActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                <span className="flex-1">{item.label}</span>
                {isItemActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile selector - Dropdown para navegación en móvil
 */
function MobileAusenciasSelector({ tabs, activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeTabData = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabData?.icon || User;

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleItemClick = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-2">
          <ActiveIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span>{activeTabData?.label}</span>
          {activeTabData?.count > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              {activeTabData.count}
            </span>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
          role="menu"
        >
          {tabs.map((tab) => {
            const ItemIcon = tab.icon;
            const isItemActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleItemClick(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                  isItemActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                role="menuitem"
              >
                <ItemIcon className={`h-4 w-4 ${isItemActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                <span className="flex-1">{tab.label}</span>
                {tab.count > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {tab.count}
                  </span>
                )}
                {isItemActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              </button>
            );
          })}
        </div>
      )}
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
  const esAdmin = ['admin', 'propietario', 'super_admin'].includes(user?.rol);

  // Verificar si es supervisor (tiene solicitudes pendientes de su equipo)
  const { data: pendientes, esSupervisor, isLoading: isLoadingSupervisor } =
    useSolicitudesPendientesAusencias();
  const cantidadPendientes = pendientes?.length || 0;

  // Hooks para datos exportables (cargan solo cuando se necesitan para exportar)
  const { data: misAusencias } = useMisAusencias();
  const { data: incapacidadesData } = useIncapacidades({ limite: 100 });

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

  // Verificar si el tab actual es exportable
  const tabsExportables = ['mis-ausencias', 'mi-equipo', 'incapacidades'];
  const puedeExportar = tabsExportables.includes(activeTab);

  // Handler para exportar CSV según tab activo usando hook centralizado
  const handleExportarAusencias = () => {
    const tiposLabel = {
      enfermedad_general: 'Enfermedad General',
      maternidad: 'Maternidad',
      riesgo_trabajo: 'Riesgo de Trabajo',
    };
    const estadosLabel = {
      activa: 'Activa',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada',
    };

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

      case 'mi-equipo': {
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

      case 'incapacidades': {
        const incapacidades = incapacidadesData?.data || [];
        if (incapacidades.length === 0) {
          toast.error('No hay incapacidades para exportar');
          return;
        }
        const datosIncapacidades = incapacidades.map((i) => ({
          codigo: i.codigo || '',
          profesional: i.profesional_nombre || '',
          tipo: tiposLabel[i.tipo_incapacidad] || i.tipo_incapacidad || '',
          fecha_inicio: i.fecha_inicio ? format(new Date(i.fecha_inicio.split('T')[0] + 'T12:00:00'), 'dd/MM/yyyy') : '',
          fecha_fin: i.fecha_fin ? format(new Date(i.fecha_fin.split('T')[0] + 'T12:00:00'), 'dd/MM/yyyy') : '',
          dias: i.dias_autorizados || 0,
          folio_imss: i.folio_imss || '',
          estado: estadosLabel[i.estado] || i.estado || '',
        }));
        exportCSV(datosIncapacidades, [
          { key: 'codigo', header: 'Código' },
          { key: 'profesional', header: 'Profesional' },
          { key: 'tipo', header: 'Tipo' },
          { key: 'fecha_inicio', header: 'Fecha Inicio' },
          { key: 'fecha_fin', header: 'Fecha Fin' },
          { key: 'dias', header: 'Días' },
          { key: 'folio_imss', header: 'Folio IMSS' },
          { key: 'estado', header: 'Estado' },
        ], `incapacidades_${format(new Date(), 'yyyyMMdd')}`);
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

      {/* NavTabs - Barra separada como en otros módulos */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Desktop: Tabs agrupados */}
        <div className="hidden md:flex items-center gap-1 px-4 py-2">
          {/* Mis Ausencias - siempre visible */}
          <TabItem
            icon={User}
            label="Mis Ausencias"
            isActive={activeTab === 'mis-ausencias'}
            onClick={() => handleTabChange('mis-ausencias')}
          />

          {/* Mi Equipo - supervisor/admin */}
          {(esSupervisor || esAdmin) && (
            <TabItem
              icon={Users}
              label="Mi Equipo"
              isActive={activeTab === 'mi-equipo'}
              onClick={() => handleTabChange('mi-equipo')}
              count={cantidadPendientes}
            />
          )}

          {/* Tipos - dropdown para admin (Vacaciones, Incapacidades, Otros Bloqueos) */}
          {esAdmin && (
            <TabDropdown
              icon={ClipboardList}
              label="Tipos"
              items={[
                { id: 'vacaciones', label: 'Vacaciones', icon: Palmtree },
                { id: 'incapacidades', label: 'Incapacidades', icon: HeartPulse },
                { id: 'otros-bloqueos', label: 'Otros Bloqueos', icon: Ban },
              ]}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}

          {/* Calendario - siempre visible */}
          <TabItem
            icon={CalendarDays}
            label="Calendario"
            isActive={activeTab === 'calendario'}
            onClick={() => handleTabChange('calendario')}
          />

          {/* Configuración - solo admin */}
          {esAdmin && (
            <TabItem
              icon={Settings}
              label="Configuración"
              isActive={activeTab === 'configuracion'}
              onClick={() => handleTabChange('configuracion')}
            />
          )}
        </div>
        {/* Mobile: Dropdown con todos los tabs */}
        <div className="md:hidden px-4 py-2">
          <MobileAusenciasSelector
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default AusenciasPage;
