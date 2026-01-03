/**
 * VacacionesPage - Página principal de vacaciones
 * Fase 3 del Plan de Empleados Competitivo - Enero 2026
 */
import BackButton from '@/components/ui/BackButton';
import { VacacionesDashboard } from '@/components/vacaciones';

/**
 * Página de gestión de vacaciones
 * Muestra el dashboard de vacaciones del usuario actual
 */
function VacacionesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <BackButton to="/home" label="Volver al Inicio" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VacacionesDashboard />
      </div>
    </div>
  );
}

export default VacacionesPage;
