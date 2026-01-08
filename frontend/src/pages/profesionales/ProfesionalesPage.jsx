import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, X, AlertTriangle, ClipboardList, Network, LayoutGrid, LayoutList } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ProfesionalesList from '@/components/profesionales/ProfesionalesList';
import HorariosProfesionalModal from '@/components/profesionales/HorariosProfesionalModal';
import ServiciosProfesionalModal from '@/components/profesionales/ServiciosProfesionalModal';
import {
  useProfesionales,
  useEliminarProfesional,
  ESTADOS_LABORALES
} from '@/hooks/useProfesionales';
import { useDepartamentos } from '@/hooks/useDepartamentos';
import { useToast } from '@/hooks/useToast';

/**
 * Página principal de gestión de profesionales
 * Implementa CRUD completo con búsqueda y filtros
 */
function ProfesionalesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Ene 2026: Vista y paginación
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filtros (Dic 2025: ampliados con nuevos campos)
  const [filtros, setFiltros] = useState({
    activo: '',
    estado: '', // Estado laboral (activo, vacaciones, etc.)
    departamento_id: '', // Departamento
  });

  // Fetch departamentos para filtros (Dic 2025)
  const { data: departamentos = [] } = useDepartamentos({ activo: true });

  // Estados para modales
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profesionalAEliminar, setProfesionalAEliminar] = useState(null);
  const [isHorariosModalOpen, setIsHorariosModalOpen] = useState(false);
  const [profesionalParaHorarios, setProfesionalParaHorarios] = useState(null);
  const [isServiciosModalOpen, setIsServiciosModalOpen] = useState(false);
  const [profesionalParaServicios, setProfesionalParaServicios] = useState(null);

  // Fetch profesionales con filtros y paginación (Ene 2026)
  const { data, isLoading } = useProfesionales({
    page,
    limit,
    busqueda,
    activo: filtros.activo === '' ? undefined : filtros.activo === 'true',
    estado: filtros.estado || undefined,
    departamento_id: filtros.departamento_id ? parseInt(filtros.departamento_id, 10) : undefined,
  });

  // Extraer profesionales y paginación de la respuesta
  const profesionales = data?.profesionales || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false };

  // Hook de eliminación
  const eliminarMutation = useEliminarProfesional();

  // Handler para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      activo: '',
      estado: '',
      departamento_id: '',
    });
    setBusqueda('');
    setPage(1); // Reset a página 1
  };

  // Ene 2026: Handler para cambio de página
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Ene 2026: Handler para cambio de búsqueda (reset página)
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPage(1);
  };

  // Ene 2026: Handler para cambio de filtros (reset página)
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPage(1);
  };

  // Handlers para acciones
  const handleNuevoProfesional = () => {
    navigate('/profesionales/nuevo');
  };

  const handleVerDetalle = (profesional) => {
    navigate(`/profesionales/${profesional.id}`);
  };

  const handleDelete = (profesional) => {
    setProfesionalAEliminar(profesional);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!profesionalAEliminar) return;

    try {
      await eliminarMutation.mutateAsync(profesionalAEliminar.id);
      toast.success(
        `Profesional "${profesionalAEliminar.nombre_completo}" desactivado correctamente`
      );
      setIsDeleteModalOpen(false);
      setProfesionalAEliminar(null);
    } catch (error) {
      toast.error(
        error.message || 'Error al desactivar el profesional. Intenta nuevamente.'
      );
    }
  };

  const handleGestionarHorarios = (profesional) => {
    setProfesionalParaHorarios(profesional);
    setIsHorariosModalOpen(true);
  };

  const handleGestionarServicios = (profesional) => {
    setProfesionalParaServicios(profesional);
    setIsServiciosModalOpen(true);
  };

  // Verificar si hay filtros activos (Dic 2025: nuevos filtros)
  const hasFiltrosActivos =
    filtros.activo !== '' ||
    filtros.estado !== '' ||
    filtros.departamento_id !== '' ||
    busqueda !== '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <BackButton to="/home" label="Volver al Inicio" />
          </div>

          {/* Header - Mobile First */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Profesionales</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                Gestiona los profesionales de tu negocio
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => navigate('/profesionales/organigrama')}
                className="flex-1 sm:flex-initial"
              >
                <Network className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Organigrama</span>
                <span className="sm:hidden">Org</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/onboarding-empleados')}
                className="flex-1 sm:flex-initial"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Onboarding</span>
                <span className="sm:hidden">Onboarding</span>
              </Button>
              <Button onClick={handleNuevoProfesional} className="flex-1 sm:flex-initial">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Profesional</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </div>
          </div>

          {/* Search Bar y Filtros */}
          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={busqueda}
                  onChange={handleBusquedaChange}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {hasFiltrosActivos && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                    {Object.values(filtros).filter((v) => v !== '').length +
                      (busqueda ? 1 : 0)}
                  </span>
                )}
              </Button>

              {/* Ene 2026: Toggle de vista cards/tabla */}
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 transition-colors ${viewMode === 'cards'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title="Vista tarjetas"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 transition-colors ${viewMode === 'table'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title="Vista tabla"
                >
                  <LayoutList className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Panel de Filtros (Dic 2025: ampliado con nuevos filtros) */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Filtro: Estado Activo/Inactivo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Visible
                    </label>
                    <Select
                      value={filtros.activo}
                      onChange={(e) => handleFiltroChange('activo', e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="true">Activos</option>
                      <option value="false">Inactivos</option>
                    </Select>
                  </div>

                  {/* Filtro: Estado Laboral (Dic 2025) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado Laboral
                    </label>
                    <Select
                      value={filtros.estado}
                      onChange={(e) => handleFiltroChange('estado', e.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      {Object.entries(ESTADOS_LABORALES).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Filtro: Departamento (Dic 2025) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Departamento
                    </label>
                    <Select
                      value={filtros.departamento_id}
                      onChange={(e) => handleFiltroChange('departamento_id', e.target.value)}
                    >
                      <option value="">Todos los departamentos</option>
                      {departamentos.map((depto) => (
                        <option key={depto.id} value={depto.id}>
                          {depto.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Botón para limpiar filtros */}
                {hasFiltrosActivos && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLimpiarFiltros}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Limpiar Filtros
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerta Global: Profesionales sin Servicios */}
      {useMemo(() => {
        const profesionalesSinServicios = profesionales?.filter(
          p => (p.total_servicios_asignados === 0 || p.total_servicios_asignados === '0') && p.activo
        ) || [];

        if (profesionalesSinServicios.length === 0) return null;

        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 mt-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-500" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Atención: {profesionalesSinServicios.length} profesional{profesionalesSinServicios.length !== 1 ? 'es' : ''} sin servicios asignados
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      Los siguientes profesionales activos no tienen servicios asignados.
                      Asigna al menos un servicio a cada profesional para que puedan recibir citas:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {profesionalesSinServicios.map(profesional => (
                        <li key={profesional.id}>
                          <a
                            href={`#profesional-${profesional.id}`}
                            className="font-medium underline hover:text-yellow-900 dark:hover:text-yellow-100"
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById(`profesional-${profesional.id}`)?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                              });
                            }}
                          >
                            {profesional.nombre_completo}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const primerProfesional = profesionalesSinServicios[0];
                        if (primerProfesional) {
                          handleGestionarServicios(primerProfesional);
                        }
                      }}
                      className="bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                    >
                      Asignar servicios al primer profesional
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }, [profesionales])}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfesionalesList
          profesionales={profesionales}
          pagination={pagination}
          viewMode={viewMode}
          isLoading={isLoading}
          onVerDetalle={handleVerDetalle}
          onDelete={handleDelete}
          onGestionarHorarios={handleGestionarHorarios}
          onGestionarServicios={handleGestionarServicios}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modal de Gestión de Horarios */}
      <HorariosProfesionalModal
        isOpen={isHorariosModalOpen}
        onClose={() => {
          setIsHorariosModalOpen(false);
          setProfesionalParaHorarios(null);
        }}
        profesional={profesionalParaHorarios}
      />

      {/* Modal de Gestión de Servicios */}
      <ServiciosProfesionalModal
        isOpen={isServiciosModalOpen}
        onClose={() => {
          setIsServiciosModalOpen(false);
          setProfesionalParaServicios(null);
        }}
        profesional={profesionalParaServicios}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProfesionalAEliminar(null);
        }}
        title="Confirmar Desactivación"
        maxWidth="md"
      >
        <div className="space-y-6">
          {/* Icono de advertencia */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ¿Desactivar profesional?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Esta acción no se puede deshacer fácilmente
              </p>
            </div>
          </div>

          {/* Información del profesional */}
          {profesionalAEliminar && (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{
                    backgroundColor:
                      profesionalAEliminar.color_calendario || '#3b82f6',
                  }}
                >
                  {profesionalAEliminar.nombre_completo?.split(' ')[0]?.charAt(0)}
                  {profesionalAEliminar.nombre_completo?.split(' ')[1]?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {profesionalAEliminar.nombre_completo}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profesionalAEliminar.tipo_nombre || 'Tipo no especificado'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de advertencia */}
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <strong>Importante:</strong> El profesional será desactivado
              (marcado como inactivo). Los horarios y citas existentes se
              mantendrán, pero no se podrán crear nuevas citas con este
              profesional.
            </p>
          </div>

          {/* Mensaje informativo */}
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <p className="text-sm text-primary-900 dark:text-primary-200">
              <strong>Consejo:</strong> Puedes reactivar el profesional
              editándolo y marcándolo como activo nuevamente.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setProfesionalAEliminar(null);
              }}
              disabled={eliminarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              isLoading={eliminarMutation.isPending}
              disabled={eliminarMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {eliminarMutation.isPending
                ? 'Desactivando...'
                : 'Sí, Desactivar Profesional'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProfesionalesPage;
