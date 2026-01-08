/**
 * IncapacidadesPage - Página principal de gestión de incapacidades
 * Módulo de Profesionales - Enero 2026
 */
import { useState } from 'react';
import { HeartPulse, List, BarChart3, Plus } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import {
  IncapacidadesList,
  IncapacidadFormModal,
  IncapacidadesEstadisticas,
} from '@/components/incapacidades';
import { useIncapacidades } from '@/hooks/useIncapacidades';

/**
 * Tab item component
 */
function TabItem({ icon: Icon, label, isActive, onClick, count }) {
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
      {label}
      {count !== undefined && count > 0 && (
        <span className={`
          ml-1 px-2 py-0.5 text-xs rounded-full font-semibold
          ${isActive
            ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Página de gestión de incapacidades médicas (IMSS)
 */
function IncapacidadesPage() {
  const [activeTab, setActiveTab] = useState('lista');
  const [showFormModal, setShowFormModal] = useState(false);

  // Obtener conteo de incapacidades activas
  const { data: incapacidadesData } = useIncapacidades({ estado: 'activa', limite: 1 });
  const totalActivas = incapacidadesData?.total || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <BackButton to="/profesionales" label="Volver a Profesionales" />
          </div>

          {/* Title + Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <HeartPulse className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Incapacidades
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gestión de incapacidades médicas IMSS
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowFormModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Incapacidad
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-6">
            <TabItem
              icon={List}
              label="Incapacidades"
              isActive={activeTab === 'lista'}
              onClick={() => setActiveTab('lista')}
              count={totalActivas}
            />
            <TabItem
              icon={BarChart3}
              label="Estadísticas"
              isActive={activeTab === 'estadisticas'}
              onClick={() => setActiveTab('estadisticas')}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'lista' && (
          <IncapacidadesList onRegistrar={() => setShowFormModal(true)} />
        )}

        {activeTab === 'estadisticas' && (
          <IncapacidadesEstadisticas />
        )}
      </div>

      {/* Modal de registro */}
      <IncapacidadFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
      />
    </div>
  );
}

export default IncapacidadesPage;
