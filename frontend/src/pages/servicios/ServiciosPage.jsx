import { useState } from 'react';
import { Plus, Search, Filter, X, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ServiciosList from '@/components/servicios/ServiciosList';
import ServicioFormModal from '@/components/servicios/ServicioFormModal';
import ProfesionalesServicioModal from '@/components/servicios/ProfesionalesServicioModal';
import { useServicios, useEliminarServicio } from '@/hooks/useServicios';
import { useToast } from '@/hooks/useToast';

/**
 * Página principal de gestión de servicios
 * Implementa CRUD completo con búsqueda, filtros y paginación
 */
function ServiciosPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para modal de crear/editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  // Estados para modal de profesionales
  const [isProfesionalesModalOpen, setIsProfesionalesModalOpen] = useState(false);
  const [servicioParaProfesionales, setServicioParaProfesionales] = useState(null);

  // Estados para modal de confirmación de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [servicioAEliminar, setServicioAEliminar] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    activo: '',
    categoria: '',
    precio_min: '',
    precio_max: '',
  });

  // Fetch servicios con filtros
  // React Query maneja el debouncing automáticamente con keepPreviousData
  const { data, isLoading } = useServicios({
    pagina: page,
    limite: 20,
    busqueda,
    // Solo enviar filtros si tienen valor
    activo: filtros.activo === '' ? undefined : filtros.activo === 'true',
    categoria: filtros.categoria || undefined,
    precio_min: filtros.precio_min || undefined,
    precio_max: filtros.precio_max || undefined,
  });

  // Hook de eliminación
  const eliminarMutation = useEliminarServicio();

  // Handlers para paginación
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler para crear nuevo servicio
  const handleNuevoServicio = () => {
    setModalMode('create');
    setServicioSeleccionado(null);
    setIsModalOpen(true);
  };

  // Handler para editar servicio
  const handleEdit = (servicio) => {
    setModalMode('edit');
    setServicioSeleccionado(servicio);
    setIsModalOpen(true);
  };

  // Handler para gestionar profesionales
  const handleGestionarProfesionales = (servicio) => {
    setServicioParaProfesionales(servicio);
    setIsProfesionalesModalOpen(true);
  };

  // Handler para abrir modal de confirmación de eliminación
  const handleDelete = (servicio) => {
    setServicioAEliminar(servicio);
    setIsDeleteModalOpen(true);
  };

  // Handler para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!servicioAEliminar) return;

    try {
      await eliminarMutation.mutateAsync(servicioAEliminar.id);
      toast.success(
        `Servicio "${servicioAEliminar.nombre}" desactivado correctamente`
      );
      setIsDeleteModalOpen(false);
      setServicioAEliminar(null);
    } catch (error) {
      toast.error(
        error.message || 'Error al desactivar el servicio. Intenta nuevamente.'
      );
    }
  };

  // Handler para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      activo: '',
      categoria: '',
      precio_min: '',
      precio_max: '',
    });
    setBusqueda('');
    setPage(1);
  };

  // Verificar si hay filtros activos
  const hasFiltrosActivos =
    filtros.activo !== '' ||
    filtros.categoria !== '' ||
    filtros.precio_min !== '' ||
    filtros.precio_max !== '' ||
    busqueda !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona los servicios de tu negocio
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleNuevoServicio}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Servicio
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
                  placeholder="Buscar por nombre o categoría..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPage(1); // Resetear a página 1 al buscar
                  }}
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
                    {Object.values(filtros).filter(v => v !== '').length + (busqueda ? 1 : 0)}
                  </span>
                )}
              </Button>
            </div>

            {/* Panel de Filtros */}
            {showFilters && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Filtro: Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <Select
                      value={filtros.activo}
                      onChange={(e) => {
                        setFiltros({ ...filtros, activo: e.target.value });
                        setPage(1);
                      }}
                    >
                      <option value="">Todos</option>
                      <option value="true">Activos</option>
                      <option value="false">Inactivos</option>
                    </Select>
                  </div>

                  {/* Filtro: Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: Cortes, Barba..."
                      value={filtros.categoria}
                      onChange={(e) => {
                        setFiltros({ ...filtros, categoria: e.target.value });
                        setPage(1);
                      }}
                    />
                  </div>

                  {/* Filtro: Precio Mínimo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Mínimo
                    </label>
                    <Input
                      type="number"
                      placeholder="10000"
                      min="0"
                      value={filtros.precio_min}
                      onChange={(e) => {
                        setFiltros({ ...filtros, precio_min: e.target.value });
                        setPage(1);
                      }}
                    />
                  </div>

                  {/* Filtro: Precio Máximo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Máximo
                    </label>
                    <Input
                      type="number"
                      placeholder="100000"
                      min="0"
                      value={filtros.precio_max}
                      onChange={(e) => {
                        setFiltros({ ...filtros, precio_max: e.target.value });
                        setPage(1);
                      }}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ServiciosList
          servicios={data?.servicios}
          paginacion={data?.paginacion}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onGestionarProfesionales={handleGestionarProfesionales}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal de Crear/Editar Servicio */}
      <ServicioFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalMode('create');
          setServicioSeleccionado(null);
        }}
        mode={modalMode}
        servicio={servicioSeleccionado}
      />

      {/* Modal de Gestión de Profesionales */}
      <ProfesionalesServicioModal
        isOpen={isProfesionalesModalOpen}
        onClose={() => {
          setIsProfesionalesModalOpen(false);
          setServicioParaProfesionales(null);
        }}
        servicio={servicioParaProfesionales}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setServicioAEliminar(null);
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
                ¿Desactivar servicio?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Esta acción no se puede deshacer fácilmente
              </p>
            </div>
          </div>

          {/* Información del servicio */}
          {servicioAEliminar && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Servicio:{' '}
                  </span>
                  <span className="text-sm text-gray-900">
                    {servicioAEliminar.nombre}
                  </span>
                </div>
                {servicioAEliminar.categoria && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Categoría:{' '}
                    </span>
                    <span className="text-sm text-gray-900">
                      {servicioAEliminar.categoria}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mensaje de advertencia */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Importante:</strong> El servicio será desactivado
              (marcado como inactivo). Las citas existentes con este servicio se
              mantendrán, pero no se podrán crear nuevas citas.
            </p>
          </div>

          {/* Mensaje informativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Consejo:</strong> Puedes reactivar el servicio
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
                setServicioAEliminar(null);
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
                : 'Sí, Desactivar Servicio'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ServiciosPage;
