/**
 * ====================================================================
 * CLIENTE DETAIL PAGE - VISTA DE DETALLE CON TABS
 * ====================================================================
 *
 * Fase 4C - Vista con Tabs (Ene 2026)
 * Página de detalle del cliente con navegación por tabs:
 * - General: Información del cliente + Smart Buttons
 * - Historial: Timeline unificado de actividades
 * - Documentos: Gestión de documentos
 *
 * ====================================================================
 */

import { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Edit,
  Phone,
  Mail,
  Building2,
  UserCircle,
  Tag,
  User,
  Clock,
  FileText,
  ChevronDown,
  Check,
  TrendingUp,
  Calendar,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { StatCardGrid } from '@/components/ui/StatCardGrid';
import ClienteEtiquetasEditor from '@/components/clientes/ClienteEtiquetasEditor';
import { useCliente, useEstadisticasCliente } from '@/hooks/useClientes';
import { useUsuarios } from '@/hooks/useUsuarios';
import { cn, formatCurrency } from '@/lib/utils';

// Tabs components
import ClienteGeneralTab from './tabs/ClienteGeneralTab';
import ClienteTimelineTab from './tabs/ClienteTimelineTab';
import ClienteDocumentosTab from './tabs/ClienteDocumentosTab';
import ClienteOportunidadesTab from './tabs/ClienteOportunidadesTab';

// Configuración de tabs
const CLIENTE_TABS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'historial', label: 'Historial', icon: Clock },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'oportunidades', label: 'Oportunidades', icon: TrendingUp },
];

/**
 * Navegación de tabs para cliente
 * Desktop: Tabs horizontales
 * Mobile: Dropdown selector
 */
function ClienteTabs({ activeTab, onTabChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeTabData = CLIENTE_TABS.find(t => t.id === activeTab) || CLIENTE_TABS[0];
  const ActiveIcon = activeTabData.icon;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: Tabs horizontales */}
        <nav className="hidden md:flex items-center -mb-px" aria-label="Tabs">
          {CLIENTE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile: Dropdown selector */}
        <div className="md:hidden py-2 relative">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            <div className="flex items-center gap-2">
              <ActiveIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span>{activeTabData.label}</span>
            </div>
            <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform', mobileOpen && 'rotate-180')} />
          </button>

          {mobileOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              {CLIENTE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400')} />
                    <span className="flex-1">{tab.label}</span>
                    {isActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Header del cliente con información resumida y estadísticas
 */
function ClienteHeader({ cliente, estadisticas, onEdit }) {
  // Configuracion de StatCards con estadisticas del cliente
  const statsConfig = useMemo(
    () => [
      {
        key: 'citas',
        icon: Calendar,
        label: 'Total Citas',
        value: estadisticas?.total_citas || 0,
        color: 'blue',
      },
      {
        key: 'compras',
        icon: ShoppingCart,
        label: 'Compras',
        value: estadisticas?.total_compras || 0,
        color: 'green',
      },
      {
        key: 'invertido',
        icon: DollarSign,
        label: 'Total Invertido',
        value: formatCurrency(estadisticas?.total_invertido || 0),
        color: 'primary',
      },
      {
        key: 'ultima_visita',
        icon: Clock,
        label: 'Dias desde ultima visita',
        value: estadisticas?.dias_sin_visita ?? '-',
        color: 'yellow',
      },
    ],
    [estadisticas]
  );

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-4">
          <BackButton to="/clientes" label="Volver a Clientes" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {cliente.foto_url ? (
              <img
                src={cliente.foto_url}
                alt={cliente.nombre}
                className="flex-shrink-0 h-16 w-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="flex-shrink-0 h-16 w-16 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-semibold text-2xl">
                  {cliente.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {cliente.nombre}
                </h1>
                {/* Badge de tipo */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                    cliente.tipo === 'empresa'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                      : 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'
                  }`}
                >
                  {cliente.tipo === 'empresa' ? (
                    <>
                      <Building2 className="w-3 h-3" />
                      Empresa
                    </>
                  ) : (
                    <>
                      <UserCircle className="w-3 h-3" />
                      Persona
                    </>
                  )}
                </span>
              </div>
              {/* Contacto rápido */}
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                {cliente.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {cliente.email}
                  </span>
                )}
                {cliente.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {cliente.telefono}
                  </span>
                )}
              </div>
              {/* Badges de estado */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    cliente.activo
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}
                >
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
                {cliente.marketing_permitido && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300">
                    Marketing permitido
                  </span>
                )}
              </div>
              {/* Etiquetas del cliente */}
              <div className="flex items-center gap-2 mt-2">
                <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <ClienteEtiquetasEditor
                  clienteId={parseInt(cliente.id)}
                  etiquetas={cliente.etiquetas || []}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <Button onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Estadisticas del cliente */}
        <StatCardGrid stats={statsConfig} columns={4} />
      </div>
    </div>
  );
}

/**
 * Página de detalle del cliente con tabs
 */
function ClienteDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab activo desde URL o default 'general'
  const activeTab = searchParams.get('tab') || 'general';

  // Cambiar tab y actualizar URL
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Obtener datos del cliente
  const { data: cliente, isLoading: loadingCliente } = useCliente(id);

  // Obtener estadísticas del cliente (Vista 360°)
  const { data: estadisticas } = useEstadisticasCliente(id);

  // Obtener usuarios para asignación de tareas
  const { data: usuariosData } = useUsuarios({ activo: true, limit: 100 });
  const usuarios = usuariosData?.usuarios || [];

  if (loadingCliente) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Cliente no encontrado</p>
          <Button onClick={() => navigate('/clientes')} className="mt-4">
            Volver a Clientes
          </Button>
        </div>
      </div>
    );
  }

  // Renderizar tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'historial':
        return (
          <ClienteTimelineTab
            clienteId={parseInt(id)}
            usuarios={usuarios}
          />
        );
      case 'documentos':
        return (
          <ClienteDocumentosTab
            clienteId={parseInt(id)}
          />
        );
      case 'oportunidades':
        return (
          <ClienteOportunidadesTab
            clienteId={parseInt(id)}
            usuarios={usuarios}
          />
        );
      case 'general':
      default:
        return (
          <ClienteGeneralTab
            cliente={cliente}
            estadisticas={estadisticas}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con info resumida y estadisticas */}
      <ClienteHeader
        cliente={cliente}
        estadisticas={estadisticas}
        onEdit={() => navigate(`/clientes/${id}/editar`)}
      />

      {/* Navegación de tabs */}
      <ClienteTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Contenido del tab activo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ClienteDetailPage;
