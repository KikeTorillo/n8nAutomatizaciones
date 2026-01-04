import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProfesionalHeader from '@/components/profesionales/ProfesionalHeader';
import ProfesionalTabs from '@/components/profesionales/ProfesionalTabs';
import ProfesionalProgressBar from '@/components/profesionales/ProfesionalProgressBar';
import { useProfesional } from '@/hooks/useProfesionales';

// Tabs
import GeneralTab from '@/components/profesionales/tabs/GeneralTab';
import TrabajoTab from '@/components/profesionales/tabs/TrabajoTab';
import PersonalTab from '@/components/profesionales/tabs/PersonalTab';
import CurriculumTab from '@/components/profesionales/tabs/CurriculumTab';
import DocumentosTab from '@/components/profesionales/tabs/DocumentosTab';
import CompensacionTab from '@/components/profesionales/tabs/CompensacionTab';
import ConfiguracionTab from '@/components/profesionales/tabs/ConfiguracionTab';

// Definición de tabs disponibles
const TABS = [
  { id: 'general', label: 'General' },
  { id: 'trabajo', label: 'Trabajo' },
  { id: 'personal', label: 'Personal' },
  { id: 'curriculum', label: 'Currículum' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'compensacion', label: 'Compensación' },
  { id: 'configuracion', label: 'Configuración' },
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
    switch (activeTab) {
      case 'general':
        return <GeneralTab profesional={profesional} />;
      case 'trabajo':
        return <TrabajoTab profesional={profesional} />;
      case 'personal':
        return <PersonalTab profesional={profesional} />;
      case 'curriculum':
        return <CurriculumTab profesional={profesional} />;
      case 'documentos':
        return <DocumentosTab profesional={profesional} />;
      case 'compensacion':
        return <CompensacionTab profesional={profesional} />;
      case 'configuracion':
        return <ConfiguracionTab profesional={profesional} />;
      default:
        return <GeneralTab profesional={profesional} />;
    }
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
      <ProfesionalTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ProfesionalDetailPage;
