/**
 * ====================================================================
 * CLIENTE DETAIL PAGE - VISTA DE DETALLE CON TABS
 * ====================================================================
 *
 * Fase 4C - Vista con Tabs (Ene 2026)
 * Refactorizado para usar BaseDetailLayout (Ene 2026)
 *
 * Página de detalle del cliente con navegación por tabs:
 * - General: Información del cliente + Smart Buttons
 * - Historial: Timeline unificado de actividades
 * - Documentos: Gestión de documentos
 * - Oportunidades: Gestión de oportunidades comerciales
 *
 * ====================================================================
 */

import { lazy, Suspense, useMemo } from 'react';
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
  TrendingUp,
} from 'lucide-react';
import {
  Button,
  LoadingSpinner,
  BaseDetailLayout,
} from '@/components/ui';
import ClienteEtiquetasEditor from '@/components/clientes/ClienteEtiquetasEditor';
import { useCliente, useEstadisticasCliente } from '@/hooks/personas';
import { useUsuarios } from '@/hooks/personas';

// Tab principal (carga eager)
import ClienteGeneralTab from './tabs/ClienteGeneralTab';

// Tabs secundarios (carga lazy para mejor performance)
const ClienteTimelineTab = lazy(() => import('./tabs/ClienteTimelineTab'));
const ClienteDocumentosTab = lazy(() => import('./tabs/ClienteDocumentosTab'));
const ClienteOportunidadesTab = lazy(() => import('./tabs/ClienteOportunidadesTab'));

// Fallback para tabs lazy
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner />
    </div>
  );
}

// Configuración de tabs
const CLIENTE_TABS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'historial', label: 'Historial', icon: Clock },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'oportunidades', label: 'Oportunidades', icon: TrendingUp },
];

/**
 * Header personalizado del cliente con avatar, etiquetas y contacto
 */
function ClienteHeaderContent({ cliente, onEdit }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300'
                    : 'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-800 dark:text-secondary-300'
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
    </div>
  );
}

/**
 * Página de detalle del cliente con tabs
 * Refactorizado para usar BaseDetailLayout (Ene 2026)
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
  const { data: cliente, isLoading: loadingCliente, error } = useCliente(id);

  // Obtener estadísticas del cliente (Vista 360°)
  const { data: estadisticas } = useEstadisticasCliente(id);

  // Obtener usuarios para asignación de tareas
  const { data: usuariosData } = useUsuarios({ activo: true, limit: 100 });
  const usuarios = usuariosData?.usuarios || [];

  // Memoizar el contenido del header
  const headerContent = useMemo(() => {
    if (!cliente) return null;
    return (
      <ClienteHeaderContent
        cliente={cliente}
        onEdit={() => navigate(`/clientes/${id}/editar`)}
      />
    );
  }, [cliente, navigate, id]);

  // Renderizar tab activo
  const renderTabContent = () => {
    // Tab general carga sin Suspense (eager)
    if (activeTab === 'general') {
      return (
        <ClienteGeneralTab
          cliente={cliente}
          estadisticas={estadisticas}
        />
      );
    }

    // Tabs secundarios con Suspense (lazy)
    let content;
    switch (activeTab) {
      case 'historial':
        content = (
          <ClienteTimelineTab
            clienteId={parseInt(id)}
            usuarios={usuarios}
          />
        );
        break;
      case 'documentos':
        content = (
          <ClienteDocumentosTab
            clienteId={parseInt(id)}
          />
        );
        break;
      case 'oportunidades':
        content = (
          <ClienteOportunidadesTab
            clienteId={parseInt(id)}
            usuarios={usuarios}
          />
        );
        break;
      default:
        return (
          <ClienteGeneralTab
            cliente={cliente}
            estadisticas={estadisticas}
          />
        );
    }

    return (
      <Suspense fallback={<TabLoadingFallback />}>
        {content}
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BaseDetailLayout
        backTo="/clientes"
        backLabel="Volver a Clientes"
        isLoading={loadingCliente}
        error={error}
        notFound={!cliente && !loadingCliente && !error}
        notFoundConfig={{
          title: 'Cliente no encontrado',
          description: 'El cliente que buscas no existe o fue eliminado.',
          backLabel: 'Volver a Clientes',
        }}
        // Tabs
        tabs={CLIENTE_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        // Header personalizado via beforeTabs
        beforeTabs={headerContent}
      >
        {renderTabContent()}
      </BaseDetailLayout>
    </div>
  );
}

export default ClienteDetailPage;
