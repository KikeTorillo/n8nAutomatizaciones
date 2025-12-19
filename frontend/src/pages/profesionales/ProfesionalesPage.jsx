import { useState, useMemo } from 'react';
import { Plus, Search, Filter, X, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ProfesionalesList from '@/components/profesionales/ProfesionalesList';
import ProfesionalFormModal from '@/components/profesionales/ProfesionalFormModal';
import HorariosProfesionalModal from '@/components/profesionales/HorariosProfesionalModal';
import ServiciosProfesionalModal from '@/components/profesionales/ServiciosProfesionalModal';
import {
  useProfesionales,
  useEliminarProfesional,
  TIPOS_EMPLEADO,
  ESTADOS_LABORALES
} from '@/hooks/useProfesionales';
import { useTiposProfesional } from '@/hooks/useTiposProfesional';
import { useDepartamentos } from '@/hooks/useDepartamentos';
import { useToast } from '@/hooks/useToast';

/**
 * Página principal de gestión de profesionales
 * Implementa CRUD completo con búsqueda y filtros
 */
function ProfesionalesPage() {
  const toast = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros (Dic 2025: ampliados con nuevos campos)
  const [filtros, setFiltros] = useState({
    activo: '',
    tipo_profesional_id: '',
    estado: '', // Estado laboral (activo, vacaciones, etc.)
    tipo: '', // Tipo empleado (operativo, administrativo, etc.)
    departamento_id: '', // Departamento
  });

  // Fetch tipos de profesional para filtros
  const { data: tiposProfesional = [] } = useTiposProfesional({ activo: true });
  // Fetch departamentos para filtros (Dic 2025)
  const { data: departamentos = [] } = useDepartamentos({ activo: true });

  // Estados para modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profesionalAEliminar, setProfesionalAEliminar] = useState(null);
  const [isHorariosModalOpen, setIsHorariosModalOpen] = useState(false);
  const [profesionalParaHorarios, setProfesionalParaHorarios] = useState(null);
  const [isServiciosModalOpen, setIsServiciosModalOpen] = useState(false);
  const [profesionalParaServicios, setProfesionalParaServicios] = useState(null);

  // Fetch profesionales con filtros (Dic 2025: nuevos filtros)
  const { data: profesionales, isLoading } = useProfesionales({
    busqueda,
    activo: filtros.activo === '' ? undefined : filtros.activo === 'true',
    tipo_profesional_id: filtros.tipo_profesional_id ? parseInt(filtros.tipo_profesional_id, 10) : undefined,
    estado: filtros.estado || undefined,
    tipo: filtros.tipo || undefined,
    departamento_id: filtros.departamento_id ? parseInt(filtros.departamento_id, 10) : undefined,
  });

  // Hook de eliminación
  const eliminarMutation = useEliminarProfesional();

  // Handler para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      activo: '',
      tipo_profesional_id: '',
      estado: '',
      tipo: '',
      departamento_id: '',
    });
    setBusqueda('');
  };

  // Handlers para acciones
  const handleNuevoProfesional = () => {
    setModalMode('create');
    setProfesionalSeleccionado(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (profesional) => {
    setModalMode('edit');
    setProfesionalSeleccionado(profesional);
    setIsFormModalOpen(true);
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
    filtros.tipo_profesional_id !== '' ||
    filtros.estado !== '' ||
    filtros.tipo !== '' ||
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

            <Button onClick={handleNuevoProfesional} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Profesional
            </Button>
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
                  onChange={(e) => setBusqueda(e.target.value)}
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
                      onChange={(e) =>
                        setFiltros({ ...filtros, activo: e.target.value })
                      }
                    >
                      <option value="">Todos</option>
                      <option value="true">Activos</option>
                      <option value="false">Inactivos</option>
                    </Select>
                  </div>

                  {/* Filtro: Tipo de Profesional (legacy) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Profesional
                    </label>
                    <Select
                      value={filtros.tipo_profesional_id}
                      onChange={(e) =>
                        setFiltros({
                          ...filtros,
                          tipo_profesional_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Todos los tipos</option>
                      {tiposProfesional.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre} {tipo.es_sistema ? '' : '(Personalizado)'}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Filtro: Estado Laboral (Dic 2025) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado Laboral
                    </label>
                    <Select
                      value={filtros.estado}
                      onChange={(e) =>
                        setFiltros({ ...filtros, estado: e.target.value })
                      }
                    >
                      <option value="">Todos los estados</option>
                      {Object.entries(ESTADOS_LABORALES).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Filtro: Tipo de Empleado (Dic 2025) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Empleado
                    </label>
                    <Select
                      value={filtros.tipo}
                      onChange={(e) =>
                        setFiltros({ ...filtros, tipo: e.target.value })
                      }
                    >
                      <option value="">Todos</option>
                      {Object.entries(TIPOS_EMPLEADO).map(([key, val]) => (
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
                      onChange={(e) =>
                        setFiltros({ ...filtros, departamento_id: e.target.value })
                      }
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
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGestionarHorarios={handleGestionarHorarios}
          onGestionarServicios={handleGestionarServicios}
        />
      </div>

      {/* Modal de Crear/Editar Profesional */}
      <ProfesionalFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setModalMode('create');
          setProfesionalSeleccionado(null);
        }}
        mode={modalMode}
        profesional={profesionalSeleccionado}
      />

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
