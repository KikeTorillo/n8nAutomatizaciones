import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Filter, X, Calendar, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import ConfiguracionComisionesTable from '@/components/comisiones/ConfiguracionComisionesTable';
import ConfigComisionModal from '@/components/comisiones/ConfigComisionModal';
import HistorialCambiosModal from '@/components/comisiones/HistorialCambiosModal';
import { useConfiguracionesComision } from '@/hooks/useComisiones';
import { useProfesionales } from '@/hooks/useProfesionales';

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
  const navigate = useNavigate();

  // Tab activo
  const [activeTab, setActiveTab] = useState('servicio');

  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [configuracionSeleccionada, setConfiguracionSeleccionada] = useState(null);
  const [historialParams, setHistorialParams] = useState({ profesionalId: null, servicioId: null });

  // Filtros
  const [filtros, setFiltros] = useState({
    profesional_id: '',
    activo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data - filtra por aplica_a según el tab activo
  const { data: profesionales } = useProfesionales();
  const { data: configuraciones, isLoading } = useConfiguracionesComision({
    profesional_id: filtros.profesional_id || undefined,
    activo: filtros.activo === '' ? undefined : filtros.activo === 'true',
    aplica_a: activeTab, // 'servicio' o 'producto'
  });

  // Handlers
  const handleNuevaConfiguracion = () => {
    setConfiguracionSeleccionada(null);
    setIsModalOpen(true);
  };

  const handleEditar = (config) => {
    setConfiguracionSeleccionada(config);
    setIsModalOpen(true);
  };

  const handleVerHistorial = (profesionalId, servicioId) => {
    setHistorialParams({ profesionalId, servicioId });
    setIsHistorialModalOpen(true);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      profesional_id: '',
      activo: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/comisiones')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Comisiones
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Configuración de Comisiones
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Gestiona las reglas de comisión para profesionales
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-none text-sm"
              >
                <Filter className="w-4 h-4 mr-1 sm:mr-2" />
                Filtros
              </Button>

              <Button
                variant="primary"
                onClick={handleNuevaConfiguracion}
                className="flex-1 sm:flex-none text-sm"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nueva Configuración</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Servicios / Productos */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
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
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5
                        ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    <span>{tab.label}</span>
                    <span className="hidden sm:inline ml-2 text-xs text-gray-400">
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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
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
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            {activeTab === 'servicio'
              ? 'Comisiones por Servicios (Citas)'
              : 'Comisiones por Productos (Ventas POS)'
            }
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
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
      </div>

      {/* Modales */}
      <ConfigComisionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setConfiguracionSeleccionada(null);
        }}
        configuracion={configuracionSeleccionada}
        aplicaA={activeTab}
      />

      <HistorialCambiosModal
        isOpen={isHistorialModalOpen}
        onClose={() => setIsHistorialModalOpen(false)}
        profesionalId={historialParams.profesionalId}
        servicioId={historialParams.servicioId}
      />
    </div>
  );
}

export default ConfiguracionComisionesPage;
