import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ProfesionalesList from '@/components/profesionales/ProfesionalesList';
import ProfesionalFormModal from '@/components/profesionales/ProfesionalFormModal';
import HorariosProfesionalModal from '@/components/profesionales/HorariosProfesionalModal';
import ServiciosProfesionalModal from '@/components/profesionales/ServiciosProfesionalModal';
import { useProfesionales, useEliminarProfesional } from '@/hooks/useProfesionales';
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

  // Filtros
  const [filtros, setFiltros] = useState({
    activo: '',
    tipo_profesional: '',
  });

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

  // Fetch profesionales con filtros
  const { data: profesionales, isLoading } = useProfesionales({
    busqueda,
    activo: filtros.activo === '' ? undefined : filtros.activo === 'true',
    tipo_profesional: filtros.tipo_profesional || undefined,
  });

  // Hook de eliminación
  const eliminarMutation = useEliminarProfesional();

  // Handler para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      activo: '',
      tipo_profesional: '',
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

  // Verificar si hay filtros activos
  const hasFiltrosActivos =
    filtros.activo !== '' ||
    filtros.tipo_profesional !== '' ||
    busqueda !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver al Dashboard
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profesionales</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona los profesionales de tu negocio
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleNuevoProfesional}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Profesional
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
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary-50 text-primary-700' : ''}
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

            {/* Panel de Filtros */}
            {showFilters && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filtro: Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
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

                  {/* Filtro: Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Profesional
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: Barbero, Estilista..."
                      value={filtros.tipo_profesional}
                      onChange={(e) =>
                        setFiltros({
                          ...filtros,
                          tipo_profesional: e.target.value,
                        })
                      }
                    />
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
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Atención: {profesionalesSinServicios.length} profesional{profesionalesSinServicios.length !== 1 ? 'es' : ''} sin servicios asignados
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Los siguientes profesionales activos no tienen servicios asignados.
                      Asigna al menos un servicio a cada profesional para que puedan recibir citas:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {profesionalesSinServicios.map(profesional => (
                        <li key={profesional.id}>
                          <a
                            href={`#profesional-${profesional.id}`}
                            className="font-medium underline hover:text-yellow-900"
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
                      className="bg-white hover:bg-yellow-50 text-yellow-800 border-yellow-300"
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
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                ¿Desactivar profesional?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Esta acción no se puede deshacer fácilmente
              </p>
            </div>
          </div>

          {/* Información del profesional */}
          {profesionalAEliminar && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
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
                  <p className="font-medium text-gray-900">
                    {profesionalAEliminar.nombre_completo}
                  </p>
                  <p className="text-sm text-gray-600">
                    {profesionalAEliminar.tipo_profesional}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de advertencia */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Importante:</strong> El profesional será desactivado
              (marcado como inactivo). Los horarios y citas existentes se
              mantendrán, pero no se podrán crear nuevas citas con este
              profesional.
            </p>
          </div>

          {/* Mensaje informativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Consejo:</strong> Puedes reactivar el profesional
              editándolo y marcándolo como activo nuevamente.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
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
