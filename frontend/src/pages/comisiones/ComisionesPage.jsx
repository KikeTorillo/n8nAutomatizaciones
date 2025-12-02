import { useNavigate } from 'react-router-dom';
import { Settings, FileText, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import ComisionesDashboard from '@/components/comisiones/ComisionesDashboard';

/**
 * Página principal del sistema de comisiones
 * Muestra dashboard con métricas y gráficas
 */
function ComisionesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/home')}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Sistema de Comisiones
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Gestión y análisis de comisiones de profesionales
              </p>
            </div>

            {/* Navegación rápida */}
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/comisiones/configuracion')}
                className="flex-1 sm:flex-none text-sm"
              >
                <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Configuración</span>
                <span className="sm:hidden">Config</span>
              </Button>

              <Button
                variant="primary"
                onClick={() => navigate('/comisiones/reportes')}
                className="flex-1 sm:flex-none text-sm"
              >
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                Reportes
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard de Comisiones */}
        <ComisionesDashboard />
      </div>
    </div>
  );
}

export default ComisionesPage;
