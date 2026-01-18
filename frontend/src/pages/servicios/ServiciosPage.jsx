import { useState, useMemo } from 'react';
import { Plus, Search, Filter, AlertTriangle, Briefcase, CheckCircle, DollarSign, List, XCircle } from 'lucide-react';
import {
  BackButton,
  Button,
  Input,
  StatCardGrid,
  ViewTabs
} from '@/components/ui';
import ServiciosList from '@/components/servicios/ServiciosList';
import ServicioFormDrawer from '@/components/servicios/ServicioFormDrawer';
import ProfesionalesServicioModal from '@/components/servicios/ProfesionalesServicioModal';
import ServiciosFilters from '@/components/servicios/ServiciosFilters';
import ServiciosSinProfesionalesAlert from '@/components/servicios/ServiciosSinProfesionalesAlert';
import { useServicios, useEliminarServicio } from '@/hooks/agendamiento';
import { useToast, useModalManager, usePagination, useDeleteConfirmation } from '@/hooks/utils';
import { formatCurrency } from '@/lib/utils';

/**
 * Página principal de gestión de servicios
 * Implementa CRUD completo con búsqueda, filtros y paginación
 */
function ServiciosPage() {
  const toast = useToast();
  const { page, handlePageChange, resetPage, queryParams } = usePagination({ limit: 20 });
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Gestión centralizada de modales
  const { openModal, closeModal, isOpen, getModalData, getModalProps } = useModalManager({
    formulario: { isOpen: false, data: null, mode: 'create' },
    profesionales: { isOpen: false, data: null },
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    activo: '',
    categoria: '',
    precio_min: '',
    precio_max: '',
  });

  // Estado de vista activa (tabs)
  const [vistaActiva, setVistaActiva] = useState('todos'); // 'todos', 'activos', 'inactivos'

  // Determinar filtro de activo basado en vista y filtros
  const getActivoFilter = () => {
    // Si hay un filtro específico en el panel, usarlo
    if (filtros.activo !== '') {
      return filtros.activo === 'true';
    }
    // Si no, usar el tab activo
    if (vistaActiva === 'activos') return true;
    if (vistaActiva === 'inactivos') return false;
    return undefined; // 'todos' - sin filtro
  };

  // Fetch servicios con filtros
  // React Query maneja el debouncing automáticamente con keepPreviousData
  const { data, isLoading } = useServicios({
    ...queryParams,
    busqueda,
    activo: getActivoFilter(),
    categoria: filtros.categoria || undefined,
    precio_min: filtros.precio_min || undefined,
    precio_max: filtros.precio_max || undefined,
  });

  // Hook de eliminación
  const eliminarMutation = useEliminarServicio();

  // Hook de confirmación de eliminación (desactivación)
  const { confirmDelete, DeleteConfirmModal } = useDeleteConfirmation({
    deleteMutation: eliminarMutation,
    entityName: 'servicio',
    getName: (s) => s.nombre,
    confirmTitle: 'Desactivar servicio',
    confirmMessage: '¿Estás seguro de desactivar el servicio "{name}"? Las citas existentes se mantendrán, pero no se podrán crear nuevas.',
    confirmText: 'Sí, Desactivar',
    successMessage: 'Servicio desactivado correctamente',
    renderChildren: (servicio) => servicio && (
      <div className="space-y-3 mt-4">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Servicio: </span>
              <span className="text-gray-900 dark:text-gray-100">{servicio.nombre}</span>
            </div>
            {servicio.categoria && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Categoría: </span>
                <span className="text-gray-900 dark:text-gray-100">{servicio.categoria}</span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
          <p className="text-sm text-primary-900 dark:text-primary-300">
            💡 Puedes reactivar el servicio editándolo y marcándolo como activo nuevamente.
          </p>
        </div>
      </div>
    ),
  });

  // Configuración de estadísticas
  const statsConfig = useMemo(() => {
    const servicios = data?.servicios || [];
    const total = data?.paginacion?.total || servicios.length;
    const activos = servicios.filter(s => s.activo).length;
    const sinProfesionales = servicios.filter(s => s.total_profesionales_asignados === 0 && s.activo).length;
    const precioPromedio = servicios.length > 0
      ? servicios.reduce((sum, s) => sum + parseFloat(s.precio || 0), 0) / servicios.length
      : 0;

    return [
      { key: 'total', icon: Briefcase, label: 'Total Servicios', value: total, color: 'primary' },
      { key: 'activos', icon: CheckCircle, label: 'Activos', value: activos, color: 'green' },
      { key: 'sinProf', icon: AlertTriangle, label: 'Sin Profesionales', value: sinProfesionales, color: 'yellow' },
      { key: 'precio', icon: DollarSign, label: 'Precio Promedio', value: formatCurrency(precioPromedio), color: 'primary' },
    ];
  }, [data?.servicios, data?.paginacion?.total]);

  // Configuración de ViewTabs
  const viewTabsConfig = useMemo(() => [
    { id: 'todos', label: 'Todos', icon: List },
    { id: 'activos', label: 'Activos', icon: CheckCircle },
    { id: 'inactivos', label: 'Inactivos', icon: XCircle },
  ], []);

  // Handler para crear nuevo servicio
  const handleNuevoServicio = () => {
    openModal('formulario', null, { mode: 'create' });
  };

  // Handler para editar servicio
  const handleEdit = (servicio) => {
    openModal('formulario', servicio, { mode: 'edit' });
  };

  // Handler para gestionar profesionales
  const handleGestionarProfesionales = (servicio) => {
    openModal('profesionales', servicio);
  };

  // Handler para eliminar (desactivar) servicio
  const handleDelete = (servicio) => confirmDelete(servicio);

  // Handler para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      activo: '',
      categoria: '',
      precio_min: '',
      precio_max: '',
    });
    setBusqueda('');
    resetPage();
  };

  // Verificar si hay filtros activos
  const hasFiltrosActivos =
    filtros.activo !== '' ||
    filtros.categoria !== '' ||
    filtros.precio_min !== '' ||
    filtros.precio_max !== '' ||
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Servicios</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                Gestiona los servicios de tu negocio
              </p>
            </div>

            <Button onClick={handleNuevoServicio} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Servicio
            </Button>
          </div>

          {/* Search Bar y Filtros */}
          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o categoría..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    resetPage(); // Resetear a página 1 al buscar
                  }}
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
                    {Object.values(filtros).filter(v => v !== '').length + (busqueda ? 1 : 0)}
                  </span>
                )}
              </Button>
            </div>

            {/* Panel de Filtros */}
            {showFilters && (
              <ServiciosFilters
                filtros={filtros}
                onFiltrosChange={(nuevosFiltros) => {
                  setFiltros(nuevosFiltros);
                  resetPage();
                }}
                onLimpiarFiltros={handleLimpiarFiltros}
                hasFiltrosActivos={hasFiltrosActivos}
              />
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas y Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Estadísticas */}
        <StatCardGrid stats={statsConfig} columns={4} />

        {/* Tabs de Vista */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <ViewTabs
            tabs={viewTabsConfig}
            activeTab={vistaActiva}
            onChange={(tab) => {
              setVistaActiva(tab);
              resetPage(); // Resetear a página 1 al cambiar vista
              // Limpiar filtro de estado cuando se usa tab
              if (filtros.activo !== '') {
                setFiltros({ ...filtros, activo: '' });
              }
            }}
          />
        </div>
      </div>

      {/* Alerta Global: Servicios sin Profesionales */}
      <ServiciosSinProfesionalesAlert
        servicios={data?.servicios}
        onAsignarProfesionales={handleGestionarProfesionales}
      />

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
      <ServicioFormDrawer
        key={`${getModalProps('formulario').mode}-${getModalData('formulario')?.id || 'new'}`}
        isOpen={isOpen('formulario')}
        onClose={() => closeModal('formulario')}
        mode={getModalProps('formulario').mode || 'create'}
        servicio={getModalData('formulario')}
      />

      {/* Modal de Gestión de Profesionales */}
      <ProfesionalesServicioModal
        isOpen={isOpen('profesionales')}
        onClose={() => closeModal('profesionales')}
        servicio={getModalData('profesionales')}
      />

      {/* Modal de Confirmación de Desactivación */}
      <DeleteConfirmModal />
    </div>
  );
}

export default ServiciosPage;
