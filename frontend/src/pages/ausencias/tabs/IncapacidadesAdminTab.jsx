/**
 * IncapacidadesAdminTab - Gestión completa de incapacidades (admin)
 * Wrapper de los componentes existentes de incapacidades
 * Enero 2026
 */
import { useState } from 'react';
import { useModalManager } from '@/hooks/useModalManager';
import { HeartPulse, List, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import {
  IncapacidadesList,
  IncapacidadFormModal,
  IncapacidadesEstadisticas,
} from '@/components/incapacidades';

/**
 * Tab de Incapacidades para Admin
 */
function IncapacidadesAdminTab() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('lista');

  // Modales centralizados
  const { openModal, closeModal, isOpen } = useModalManager({
    form: { isOpen: false },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['incapacidades'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gestión de Incapacidades
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

      {/* Tabs de sección */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveSection('lista')}
          className={`
            px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2
            ${activeSection === 'lista'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <List className="w-4 h-4" />
          Lista
        </button>
        <button
          onClick={() => setActiveSection('estadisticas')}
          className={`
            px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2
            ${activeSection === 'estadisticas'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <BarChart3 className="w-4 h-4" />
          Estadísticas
        </button>
      </div>

      {/* Contenido */}
      {activeSection === 'lista' && (
        <IncapacidadesList onRegistrar={() => setShowFormModal(true)} />
      )}
      {activeSection === 'estadisticas' && <IncapacidadesEstadisticas />}

      {/* Modal de registro */}
      <IncapacidadFormModal
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
      />
    </div>
  );
}

export default IncapacidadesAdminTab;
