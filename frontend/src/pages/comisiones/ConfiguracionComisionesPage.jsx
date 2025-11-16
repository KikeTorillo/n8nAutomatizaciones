import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Filter, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import ConfiguracionComisionesTable from '@/components/comisiones/ConfiguracionComisionesTable';
import ConfigComisionModal from '@/components/comisiones/ConfigComisionModal';
import HistorialCambiosModal from '@/components/comisiones/HistorialCambiosModal';
import { useConfiguracionesComision } from '@/hooks/useComisiones';
import { useProfesionales } from '@/hooks/useProfesionales';

/**
 * Página de gestión de configuración de comisiones
 * Permite CRUD de configuraciones y ver historial de cambios
 */
function ConfiguracionComisionesPage() {
  const navigate = useNavigate();

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

  // Fetch data
  const { data: profesionales } = useProfesionales();
  const { data: configuraciones, isLoading } = useConfiguracionesComision({
    profesional_id: filtros.profesional_id || undefined,
    activo: filtros.activo === '' ? undefined : filtros.activo === 'true',
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Configuración de Comisiones
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona las reglas de comisión para profesionales y servicios
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Ocultar Filtros' : 'Filtros'}
              </Button>

              <Button
                variant="primary"
                onClick={handleNuevaConfiguracion}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Configuración
              </Button>
            </div>
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

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Configuraciones Globales vs Específicas
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>
              <strong>Configuración Global:</strong> Se aplica a todos los servicios del profesional
            </li>
            <li>
              <strong>Configuración Específica:</strong> Se aplica solo al servicio seleccionado y tiene prioridad sobre la global
            </li>
            <li>
              Las comisiones se calculan automáticamente cuando una cita cambia a estado "completada"
            </li>
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
