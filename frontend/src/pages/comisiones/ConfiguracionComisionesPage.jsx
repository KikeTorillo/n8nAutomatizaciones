import { useState } from 'react';
import { Plus, Filter, X, Calendar, Package, Settings } from 'lucide-react';
import { useModalManager } from '@/hooks/utils';
import { Button, Select } from '@/components/ui';
import ComisionesPageLayout from '@/components/comisiones/ComisionesPageLayout';
import ConfiguracionComisionesTable from '@/components/comisiones/ConfiguracionComisionesTable';
import ConfigComisionModal from '@/components/comisiones/ConfigComisionModal';
import HistorialCambiosModal from '@/components/comisiones/HistorialCambiosModal';
import { useConfiguracionesComision } from '@/hooks/otros';
import { useProfesionales } from '@/hooks/personas';

// Tabs disponibles
const TABS = [
  { id: 'servicio', label: 'Servicios', icon: Calendar, description: 'Comisiones por citas' },
  { id: 'producto', label: 'Productos', icon: Package, description: 'Comisiones por ventas POS' },
];

/**
 * Página de gestión de configuración de comisiones
 * Permite CRUD de configuraciones y ver historial de cambios
 * Soporta tanto servicios (citas) como productos (ventas POS)
 */
function ConfiguracionComisionesPage() {
  // Tab activo
  const [activeTab, setActiveTab] = useState('servicio');

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    historial: { isOpen: false, data: null },
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    profesional_id: '',
    activo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data - filtra por aplica_a según el tab activo
  const { data: profesionalesData } = useProfesionales();
  const profesionales = profesionalesData?.profesionales || [];
  const { data: configuraciones, isLoading } = useConfiguracionesComision({
    profesional_id: filtros.profesional_id || undefined,
    activo: filtros.activo === '' ? undefined : filtros.activo === 'true',
    aplica_a: activeTab, // 'servicio' o 'producto'
  });

  // Handlers
  const handleNuevaConfiguracion = () => {
    openModal('form', null);
  };

  const handleEditar = (config) => {
    openModal('form', config);
  };

  const handleVerHistorial = (profesionalId, servicioId) => {
    openModal('historial', { profesionalId, servicioId });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      profesional_id: '',
      activo: '',
    });
  };

  return (
    <ComisionesPageLayout
      icon={Settings}
      title="Configuración"
      subtitle="Gestiona las reglas de comisión para profesionales"
      actions={
        <>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleNuevaConfiguracion}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nueva Configuración</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </>
      }
    >
      {/* Tabs Servicios / Productos */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 sm:flex-none group inline-flex items-center justify-center sm:justify-start py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm
                    ${isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <Icon
                    className={`
                      mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5
                      ${isActive ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}
                    `}
                  />
                  <span>{tab.label}</span>
                  <span className="hidden sm:inline ml-2 text-xs text-gray-400 dark:text-gray-500">
                    ({tab.description})
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtros</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profesional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profesional
              </label>
              <Select
                value={filtros.profesional_id}
                onChange={(e) => setFiltros({ ...filtros, profesional_id: e.target.value })}
              >
                <option value="">Todos los profesionales</option>
                {profesionales?.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nombre} {prof.apellidos}
                  </option>
                ))}
              </Select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <Select
                value={filtros.activo}
                onChange={(e) => setFiltros({ ...filtros, activo: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLimpiarFiltros}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Tabla de Configuraciones */}
      <ConfiguracionComisionesTable
        configuraciones={configuraciones}
        isLoading={isLoading}
        onEdit={handleEditar}
        onViewHistory={handleVerHistorial}
      />

      {/* Información adicional - varía según el tab */}
      <div className="mt-6 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-primary-900 dark:text-primary-300 mb-2">
          {activeTab === 'servicio'
            ? 'Comisiones por Servicios (Citas)'
            : 'Comisiones por Productos (Ventas POS)'
          }
        </h4>
        <ul className="text-sm text-primary-800 dark:text-primary-300 space-y-1 list-disc list-inside">
          {activeTab === 'servicio' ? (
            <>
              <li>
                <strong>Configuración Global:</strong> Se aplica a todos los servicios del profesional
              </li>
              <li>
                <strong>Configuración Específica:</strong> Se aplica solo al servicio seleccionado y tiene prioridad sobre la global
              </li>
              <li>
                Las comisiones se calculan automáticamente cuando una cita cambia a estado "completada"
              </li>
            </>
          ) : (
            <>
              <li>
                <strong>Configuración Global:</strong> Se aplica a todas las ventas del profesional
              </li>
              <li>
                <strong>Por Categoría:</strong> Se aplica a todos los productos de una categoría
              </li>
              <li>
                <strong>Por Producto:</strong> Aplica solo al producto específico (máxima prioridad)
              </li>
              <li>
                Las comisiones se calculan automáticamente al completar una venta POS
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Modales */}
      <ConfigComisionModal
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        configuracion={getModalData('form')}
        aplicaA={activeTab}
      />

      <HistorialCambiosModal
        isOpen={isOpen('historial')}
        onClose={() => closeModal('historial')}
        profesionalId={getModalData('historial')?.profesionalId}
        servicioId={getModalData('historial')?.servicioId}
      />
    </ComisionesPageLayout>
  );
}

export default ConfiguracionComisionesPage;
