import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  X,
  AlertTriangle,
  Building2,
  MapPin,
  Phone,
  Users,
  UserCheck,
  Edit2,
  Eye,
  Trash2,
  Star,
  ArrowRightLeft,
  BarChart3,
} from 'lucide-react';
import {
  BackButton,
  Button,
  Input,
  LoadingSpinner,
  Modal,
  Select
} from '@/components/ui';
import SucursalFormDrawer from '@/components/sucursales/SucursalFormDrawer';
import { useSucursales, useEliminarSucursal } from '@/hooks/useSucursales';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';

/**
 * Página principal de gestión de sucursales
 * Implementa CRUD completo con búsqueda y filtros
 */
function SucursalesPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    activo: '',
  });

  // Estado de modales centralizado con useModalManager
  const { openModal, closeModal, isOpen, getModalData, getModalProps } = useModalManager({
    form: { isOpen: false, data: null, mode: 'create' },
    delete: { isOpen: false, data: null },
  });

  // Fetch sucursales con filtros
  const { data: sucursales, isLoading } = useSucursales({
    activo: filtros.activo === '' ? undefined : filtros.activo === 'true',
  });

  // Filtrar por búsqueda local (nombre, código, ciudad)
  const sucursalesFiltradas = sucursales?.filter((sucursal) => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      sucursal.nombre?.toLowerCase().includes(searchLower) ||
      sucursal.codigo?.toLowerCase().includes(searchLower) ||
      sucursal.ciudad_nombre?.toLowerCase().includes(searchLower) ||
      sucursal.estado_nombre?.toLowerCase().includes(searchLower)
    );
  });

  // Hook de eliminación
  const eliminarMutation = useEliminarSucursal();

  // Handler para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({ activo: '' });
    setBusqueda('');
  };

  // Handlers para acciones
  const handleNuevaSucursal = () => {
    openModal('form', null, { mode: 'create' });
  };

  const handleEdit = (sucursal) => {
    openModal('form', sucursal, { mode: 'edit' });
  };

  const handleVerDetalle = (sucursal) => {
    navigate(`/sucursales/${sucursal.id}`);
  };

  const handleDelete = (sucursal) => {
    if (sucursal.es_matriz) {
      toast.error('No se puede eliminar la sucursal matriz');
      return;
    }
    openModal('delete', sucursal);
  };

  const handleConfirmDelete = async () => {
    const sucursalAEliminar = getModalData('delete');
    if (!sucursalAEliminar) return;

    try {
      await eliminarMutation.mutateAsync(sucursalAEliminar.id);
      toast.success(`Sucursal "${sucursalAEliminar.nombre}" eliminada correctamente`);
      closeModal('delete');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar la sucursal. Intenta nuevamente.');
    }
  };

  // Verificar si hay filtros activos
  const hasFiltrosActivos = filtros.activo !== '' || busqueda !== '';

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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Sucursales
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                Gestiona las sucursales de tu negocio
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={() => navigate('/sucursales/dashboard')}
                className="flex-1 sm:flex-none"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/sucursales/transferencias')}
                className="flex-1 sm:flex-none"
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transferencias
              </Button>
              <Button onClick={handleNuevaSucursal} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Sucursal
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
                  placeholder="Buscar por nombre, código o ciudad..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={
                  showFilters
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : ''
                }
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {hasFiltrosActivos && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                    {Object.values(filtros).filter((v) => v !== '').length + (busqueda ? 1 : 0)}
                  </span>
                )}
              </Button>
            </div>

            {/* Panel de Filtros */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filtro: Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado
                    </label>
                    <Select
                      value={filtros.activo}
                      onChange={(e) => setFiltros({ ...filtros, activo: e.target.value })}
                    >
                      <option value="">Todas</option>
                      <option value="true">Activas</option>
                      <option value="false">Inactivas</option>
                    </Select>
                  </div>
                </div>

                {/* Botón para limpiar filtros */}
                {hasFiltrosActivos && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleLimpiarFiltros}>
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
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : sucursalesFiltradas?.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No hay sucursales
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {busqueda || filtros.activo !== ''
                ? 'No se encontraron sucursales con los filtros aplicados'
                : 'Comienza creando tu primera sucursal'}
            </p>
            {!busqueda && filtros.activo === '' && (
              <div className="mt-6">
                <Button onClick={handleNuevaSucursal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Sucursal
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sucursalesFiltradas?.map((sucursal) => (
              <div
                key={sucursal.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {sucursal.nombre}
                        </h3>
                        {sucursal.es_matriz && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                            <Star className="w-3 h-3 mr-1" />
                            Matriz
                          </span>
                        )}
                      </div>
                      {sucursal.codigo && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {sucursal.codigo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badge de estado */}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sucursal.activo
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {sucursal.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* Info de la sucursal */}
                <div className="space-y-2 mb-4">
                  {(sucursal.ciudad_nombre || sucursal.estado_nombre) && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>
                        {[sucursal.ciudad_nombre, sucursal.estado_nombre]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {sucursal.telefono && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{sucursal.telefono}</span>
                    </div>
                  )}
                </div>

                {/* Contadores */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{sucursal.total_usuarios || 0} usuarios</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <UserCheck className="w-4 h-4 mr-1" />
                    <span>{sucursal.total_profesionales || 0} profesionales</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerDetalle(sucursal)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(sucursal)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sucursal)}
                    disabled={sucursal.es_matriz}
                    className={`${
                      sucursal.es_matriz
                        ? 'opacity-50 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                    }`}
                    title={sucursal.es_matriz ? 'No se puede eliminar la sucursal matriz' : ''}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Crear/Editar Sucursal */}
      <SucursalFormDrawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        mode={getModalProps('form').mode || 'create'}
        sucursal={getModalData('form')}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        title="Confirmar Eliminación"
        maxWidth="md"
      >
        <div className="space-y-6">
          {/* Icono de advertencia */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ¿Eliminar sucursal?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Esta acción desactivará la sucursal
              </p>
            </div>
          </div>

          {/* Información de la sucursal */}
          {getModalData('delete') && (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {getModalData('delete').nombre}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getModalData('delete').codigo || 'Sin código'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de advertencia */}
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <strong>Importante:</strong> La sucursal será desactivada (soft delete). Los datos
              históricos se mantendrán, pero no se podrán crear nuevas citas ni asignar recursos.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => closeModal('delete')}
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
              {eliminarMutation.isPending ? 'Eliminando...' : 'Sí, Eliminar Sucursal'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SucursalesPage;
