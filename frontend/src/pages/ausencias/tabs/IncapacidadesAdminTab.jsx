/**
 * IncapacidadesAdminTab - Gestión completa de incapacidades (admin)
 * Renderiza la sección según initialSection (navegación desde StateNavTabs)
 * Enero 2026
 */
import { useModalManager } from '@/hooks/utils';
import { HeartPulse, List, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import {
  IncapacidadesList,
  IncapacidadFormModal,
  IncapacidadesEstadisticas,
} from '@/components/incapacidades';

/**
 * Tab de Incapacidades para Admin
 * @param {Object} props
 * @param {string} [props.initialSection='lista'] - Sección a mostrar ('lista' | 'estadisticas')
 */
function IncapacidadesAdminTab({ initialSection = 'lista' }) {
  const queryClient = useQueryClient();

  // Modal de registro
  const { openModal, closeModal, isOpen } = useModalManager({
    form: { isOpen: false },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['incapacidades'], refetchType: 'active' });
  };

  // Configuración por sección
  const sectionConfig = {
    lista: { title: 'Lista de Incapacidades', icon: List },
    estadisticas: { title: 'Estadísticas de Incapacidades', icon: BarChart3 },
  };

  const config = sectionConfig[initialSection] || sectionConfig.lista;
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {config.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {initialSection === 'lista' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openModal('form')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Registrar
            </Button>
          )}
        </div>
      </div>

      {/* Contenido según sección */}
      {initialSection === 'lista' && <IncapacidadesList />}
      {initialSection === 'estadisticas' && <IncapacidadesEstadisticas />}

      {/* Modal de registro */}
      <IncapacidadFormModal
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
      />
    </div>
  );
}

export default IncapacidadesAdminTab;
