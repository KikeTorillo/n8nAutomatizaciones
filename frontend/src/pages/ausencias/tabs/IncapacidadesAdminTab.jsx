/**
 * IncapacidadesAdminTab - Gestión completa de incapacidades (admin)
 * Muestra lista + estadísticas en una sola vista
 * Enero 2026
 */
import { useModalManager } from '@/hooks/utils';
import { HeartPulse, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import {
  IncapacidadesList,
  IncapacidadFormModal,
  IncapacidadesEstadisticas,
} from '@/components/incapacidades';

/**
 * Tab de Incapacidades para Admin
 * Muestra lista + estadísticas en una sola vista scrollable
 */
function IncapacidadesAdminTab() {
  const queryClient = useQueryClient();

  // Modal de registro
  const { openModal, closeModal, isOpen } = useModalManager({
    form: { isOpen: false },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['incapacidades'], refetchType: 'active' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Incapacidades
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openModal('form')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Registrar
          </Button>
        </div>
      </div>

      {/* Lista de incapacidades */}
      <section>
        <IncapacidadesList />
      </section>

      {/* Estadísticas */}
      <section className="space-y-4">
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Estadísticas
        </h3>
        <IncapacidadesEstadisticas />
      </section>

      {/* Modal de registro */}
      <IncapacidadFormModal
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
      />
    </div>
  );
}

export default IncapacidadesAdminTab;
