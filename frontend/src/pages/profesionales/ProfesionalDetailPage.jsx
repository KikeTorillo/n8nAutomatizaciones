import { lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Briefcase,
  Heart,
  GraduationCap,
  FileText,
  Wallet,
  Calendar,
  Settings,
  UserCircle,
  Shield,
} from 'lucide-react';
import { Button, LoadingSpinner, StateNavTabs } from '@/components/ui';
import ProfesionalHeader from '@/components/profesionales/ProfesionalHeader';
import ProfesionalProgressBar from '@/components/profesionales/ProfesionalProgressBar';
import { useProfesional } from '@/hooks/personas';

// Tab principal (carga eager)
import GeneralTab from '@/components/profesionales/tabs/GeneralTab';

// Tabs secundarios (carga lazy para mejor performance)
const TrabajoTab = lazy(() => import('@/components/profesionales/tabs/TrabajoTab'));
const PersonalTab = lazy(() => import('@/components/profesionales/tabs/PersonalTab'));
const CurriculumTab = lazy(() => import('@/components/profesionales/tabs/CurriculumTab'));
const DocumentosTab = lazy(() => import('@/components/profesionales/tabs/DocumentosTab'));
const CompensacionTab = lazy(() => import('@/components/profesionales/tabs/CompensacionTab'));
const AusenciasTab = lazy(() => import('@/components/profesionales/tabs/AusenciasTab'));
const ConfiguracionTab = lazy(() => import('@/components/profesionales/tabs/ConfiguracionTab'));

// Fallback para tabs lazy
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner />
    </div>
  );
}

// Definición de tabs disponibles con iconos
const TABS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'trabajo', label: 'Trabajo', icon: Briefcase },
  { id: 'personal', label: 'Personal', icon: Heart },
  { id: 'curriculum', label: 'Currículum', icon: GraduationCap },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'compensacion', label: 'Compensación', icon: Wallet },
  { id: 'ausencias', label: 'Ausencias', icon: Calendar },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

// Grupos de tabs para desktop (dropdowns)
const TAB_GROUPS = [
  { icon: UserCircle, label: 'Perfil', tabIds: ['personal', 'curriculum', 'documentos'] },
  { icon: Shield, label: 'Gestión', tabIds: ['ausencias', 'configuracion'] },
];

/**
 * Página de detalle de profesional
 * Muestra información completa en tabs organizados
 * Ruta: /profesionales/:id o /profesionales/:id/:tab
 */
function ProfesionalDetailPage() {
  const { id, tab } = useParams();
  const navigate = useNavigate();

  // Tab activa (default: general)
  const activeTab = tab && TABS.some(t => t.id === tab) ? tab : 'general';

  // Fetch profesional
  const { data: profesional, isLoading, error } = useProfesional(id);

  // Cambiar tab
  const handleTabChange = (newTab) => {
    navigate(`/profesionales/${id}/${newTab}`, { replace: true });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error o no encontrado
  if (error || !profesional) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <User className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Profesional no encontrado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          El profesional que buscas no existe o fue eliminado
        </p>
        <Button onClick={() => navigate('/profesionales')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Profesionales
        </Button>
      </div>
    );
  }

  // Renderizar tab activa
  const renderTabContent = () => {
    // Tab general carga sin Suspense (eager)
    if (activeTab === 'general') {
      return <GeneralTab profesional={profesional} />;
    }

    // Tabs secundarios con Suspense (lazy)
    let TabComponent;
    switch (activeTab) {
      case 'trabajo':
        TabComponent = TrabajoTab;
        break;
      case 'personal':
        TabComponent = PersonalTab;
        break;
      case 'curriculum':
        TabComponent = CurriculumTab;
        break;
      case 'documentos':
        TabComponent = DocumentosTab;
        break;
      case 'compensacion':
        TabComponent = CompensacionTab;
        break;
      case 'ausencias':
        TabComponent = AusenciasTab;
        break;
      case 'configuracion':
        TabComponent = ConfiguracionTab;
        break;
      default:
        return <GeneralTab profesional={profesional} />;
    }

    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <TabComponent profesional={profesional} />
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Sticky */}
      <ProfesionalHeader profesional={profesional} />

      {/* Barra de Progreso */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ProfesionalProgressBar profesional={profesional} />
        </div>
      </div>

      {/* Tabs Navigation */}
      <StateNavTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        groups={TAB_GROUPS}
        stickyTop="top-[140px]"
      />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ProfesionalDetailPage;
