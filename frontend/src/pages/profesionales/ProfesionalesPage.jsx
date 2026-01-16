import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus, Search, Filter, X, AlertTriangle, Users,
  UserCheck, Umbrella, Stethoscope, LayoutGrid, LayoutList, Download
} from 'lucide-react';
import {
  Button,
  Input,
  Modal,
  Select,
  StatCardGrid,
  ViewTabs
} from '@/components/ui';
import ProfesionalesPageLayout from '@/components/profesionales/ProfesionalesPageLayout';
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
import { useExportCSV } from '@/hooks/useExportCSV';
import { useModalManager } from '@/hooks/useModalManager';
import { useFilters } from '@/hooks/useFilters';

/**
 * Página principal de gestión de profesionales
 * Usa ProfesionalesPageLayout para consistencia con Inventario
 */
function ProfesionalesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { exportCSV } = useExportCSV();
  const [showFilters, setShowFilters] = useState(false);

  // Vista y paginación
  const [viewMode, setViewMode] = useState('cards');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filtros con persistencia y debounce automático
  const {
    filtros,
    filtrosQuery,
    hasFiltrosActivos,
    filtrosActivos,
    setFiltro,
    limpiarFiltros,
  } = useFilters(
    {
      busqueda: '',
      activo: '',
      estado: '',
      departamento_id: '',
    },
    { moduloId: 'profesionales.lista' }
  );

  // Fetch departamentos para filtros
  const { data: departamentos = [] } = useDepartamentos({ activo: true });

  // Estado de modales centralizado
  const {
    openModal,
    closeModal,
    isOpen,
    getModalData,
  } = useModalManager({
    eliminar: { isOpen: false, data: null },
    horarios: { isOpen: false, data: null },
    servicios: { isOpen: false, data: null },
  });

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [filtrosQuery]);

  // Fetch profesionales con filtros y paginación
  const { data, isLoading } = useProfesionales({
    page,
    limit,
    busqueda: filtrosQuery.busqueda || undefined,
    activo: filtrosQuery.activo === '' ? undefined : filtrosQuery.activo === 'true',
    estado: filtrosQuery.estado || undefined,
    departamento_id: filtrosQuery.departamento_id ? parseInt(filtrosQuery.departamento_id, 10) : undefined,
  });

  // Extraer profesionales y paginación de la respuesta
  const profesionales = data?.profesionales || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false };

  // Hook de eliminación
  const eliminarMutation = useEliminarProfesional();

  // Calcular estadísticas para StatCards
  const stats = useMemo(() => {
    const activos = profesionales.filter(p => p.estado === 'activo').length;
    const vacaciones = profesionales.filter(p => p.estado === 'vacaciones').length;
    const incapacidad = profesionales.filter(p => p.estado === 'incapacidad').length;

    return [
      { label: 'Total', value: pagination.total, icon: Users, color: 'gray' },
      { label: 'Activos', value: activos, icon: UserCheck, color: 'green' },
      { label: 'Vacaciones', value: vacaciones, icon: Umbrella, color: 'blue' },
      { label: 'Incapacidad', value: incapacidad, icon: Stethoscope, color: 'amber' },
    ];
  }, [profesionales, pagination.total]);

  // Exportar CSV usando hook centralizado
  const handleExportarCSV = () => {
    const datosExportar = profesionales.map(p => ({
      nombre: p.nombre_completo || '',
      email: p.email || '',
      telefono: p.telefono || '',
      departamento: p.departamento_nombre || '',
      puesto: p.puesto_nombre || '',
      estado: p.estado || '',
      fecha_contratacion: p.fecha_contratacion ? format(new Date(p.fecha_contratacion), 'dd/MM/yyyy') : '',
    }));

    exportCSV(datosExportar, [
      { key: 'nombre', header: 'Nombre' },
      { key: 'email', header: 'Email' },
      { key: 'telefono', header: 'Teléfono' },
      { key: 'departamento', header: 'Departamento' },
      { key: 'puesto', header: 'Puesto' },
      { key: 'estado', header: 'Estado' },
      { key: 'fecha_contratacion', header: 'Fecha Contratación' },
    ], `profesionales_${format(new Date(), 'yyyyMMdd')}`);
  };

  // Handlers
  const handleLimpiarFiltros = () => {
    limpiarFiltros();
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBusquedaChange = (e) => {
    setFiltro('busqueda', e.target.value);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltro(campo, valor);
  };

  const handleNuevoProfesional = () => {
    navigate('/profesionales/nuevo');
  };

  const handleVerDetalle = (profesional) => {
    navigate(`/profesionales/${profesional.id}`);
  };

  const handleDelete = (profesional) => {
    openModal('eliminar', profesional);
  };

  const handleConfirmDelete = async () => {
    const profesionalAEliminar = getModalData('eliminar');
    if (!profesionalAEliminar) return;

    try {
      await eliminarMutation.mutateAsync(profesionalAEliminar.id);
      toast.success(`Profesional "${profesionalAEliminar.nombre_completo}" desactivado correctamente`);
      closeModal('eliminar');
    } catch (error) {
      toast.error(error.message || 'Error al desactivar el profesional');
    }
  };

  const handleGestionarHorarios = (profesional) => {
    openModal('horarios', profesional);
  };

  const handleGestionarServicios = (profesional) => {
    openModal('servicios', profesional);
  };

  // Configuración de ViewTabs
  const viewTabsConfig = useMemo(() => [
    { id: 'cards', label: 'Tarjetas', icon: LayoutGrid },
    { id: 'table', label: 'Tabla', icon: LayoutList },
  ], []);

  // Alerta de profesionales sin servicios
  const alertaProfesionalesSinServicios = useMemo(() => {
    const sinServicios = profesionales.filter(
      p => (p.total_servicios_asignados === 0 || p.total_servicios_asignados === '0') && p.activo
    );
    if (sinServicios.length === 0) return null;
    return sinServicios;
  }, [profesionales]);

  return (
    <ProfesionalesPageLayout
      icon={Users}
      title="Lista de Profesionales"
      subtitle={`${pagination.total} profesional${pagination.total !== 1 ? 'es' : ''} en total`}
      actions={
        <>
          <Button variant="outline" onClick={handleExportarCSV}>
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button onClick={handleNuevoProfesional}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Profesional</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </>
      }
    >
      {/* StatCards */}
      <StatCardGrid stats={stats} className="mb-6" />

      {/* Alerta: Profesionales sin servicios */}
      {alertaProfesionalesSinServicios && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-500 flex-shrink-0" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Atención: {alertaProfesionalesSinServicios.length} profesional{alertaProfesionalesSinServicios.length !== 1 ? 'es' : ''} sin servicios asignados
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Asigna al menos un servicio a cada profesional para que puedan recibir citas.</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {alertaProfesionalesSinServicios.slice(0, 3).map(profesional => (
                    <li key={profesional.id}>{profesional.nombre_completo}</li>
                  ))}
                  {alertaProfesionalesSinServicios.length > 3 && (
                    <li>y {alertaProfesionalesSinServicios.length - 3} más...</li>
                  )}
                </ul>
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGestionarServicios(alertaProfesionalesSinServicios[0])}
                  className="bg-white dark:bg-gray-800 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                >
                  Asignar servicios
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar y Filtros */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={filtros.busqueda}
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
                {filtrosActivos}
              </span>
            )}
          </Button>
          <ViewTabs
            tabs={viewTabsConfig}
            activeTab={viewMode}
            onChange={setViewMode}
            className="border-b-0 mb-0"
          />
        </div>

        {/* Panel de Filtros */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </Select>
              </div>
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
                    <option key={depto.id} value={depto.id}>{depto.nombre}</option>
                  ))}
                </Select>
              </div>
            </div>
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

      {/* Lista de Profesionales */}
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

      {/* Modales */}
      <HorariosProfesionalModal
        isOpen={isOpen('horarios')}
        onClose={() => closeModal('horarios')}
        profesional={getModalData('horarios')}
      />
      <ServiciosProfesionalModal
        isOpen={isOpen('servicios')}
        onClose={() => closeModal('servicios')}
        profesional={getModalData('servicios')}
      />
      <Modal
        isOpen={isOpen('eliminar')}
        onClose={() => closeModal('eliminar')}
        title="Confirmar Desactivación"
        maxWidth="md"
      >
        <div className="space-y-6">
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
          {getModalData('eliminar') && (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: getModalData('eliminar').color_calendario || '#753572' }}
                >
                  {getModalData('eliminar').nombre_completo?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {getModalData('eliminar').nombre_completo}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getModalData('eliminar').puesto_nombre || 'Sin puesto'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <strong>Importante:</strong> El profesional será desactivado. Los horarios y citas existentes se mantendrán.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => closeModal('eliminar')} disabled={eliminarMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              isLoading={eliminarMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, Desactivar
            </Button>
          </div>
        </div>
      </Modal>
    </ProfesionalesPageLayout>
  );
}

export default ProfesionalesPage;
