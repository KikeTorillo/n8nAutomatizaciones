import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Plus, TrendingUp, Clock, CheckCircle, List, CalendarDays } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import { StatCardGrid } from '@/components/ui/StatCardGrid';
import { ViewTabs } from '@/components/ui/ViewTabs';
import { Pagination } from '@/components/ui/Pagination';
import CitasList from '@/components/citas/CitasList';
import CitaFilters from '@/components/citas/CitaFilters';
import CitaDetailModal from '@/components/citas/CitaDetailModal';
import CitaFormModal from '@/components/citas/CitaFormModal';
import CompletarCitaModal from '@/components/citas/CompletarCitaModal';
import NoShowModal from '@/components/citas/NoShowModal';
import CancelarCitaModal from '@/components/citas/CancelarCitaModal';
import CalendarioMensual from '@/components/citas/CalendarioMensual';
import AgendamientoNavTabs from '@/components/agendamiento/AgendamientoNavTabs';
import { useModalManager } from '@/hooks/useModalManager';
import {
  useCitas,
  useCitasDelDia,
  useConfirmarCita,
  useIniciarCita,
} from '@/hooks/useCitas';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useServicios } from '@/hooks/useServicios';

/**
 * Página principal de Gestión de Citas - FASE 1-4
 */
function CitasPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estado de vista activa (lista o calendario)
  const [vistaActiva, setVistaActiva] = useState('lista'); // 'lista' o 'calendario'

  // Estado de paginación
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Estado de filtros (incluye sucursal_id para multi-sucursal)
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    profesional_id: '',
    servicio_id: '',
    sucursal_id: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  // Estado de modales centralizado con useModalManager
  const {
    openModal,
    closeModal,
    transitionModal,
    isOpen,
    getModalData,
    getModalProps,
  } = useModalManager({
    detalles: { isOpen: false, data: null },
    formulario: { isOpen: false, data: null, mode: 'create', fechaPreseleccionada: null, clientePreseleccionado: null },
    cancelar: { isOpen: false, data: null },
    completar: { isOpen: false, data: null },
    noShow: { isOpen: false, data: null },
  });

  // Efecto para abrir modal desde navegación (ej: desde ClienteDetailPage)
  useEffect(() => {
    if (location.state?.abrirModal) {
      openModal('formulario', null, {
        mode: 'create',
        clientePreseleccionado: location.state?.clienteId || null,
      });
      // Limpiar el state para evitar que se abra de nuevo al navegar
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.abrirModal]); // Solo depender de abrirModal, no del objeto completo

  // Queries con paginación
  const { data: citasData, isLoading: cargandoCitas } = useCitas({
    ...filtros,
    page,
    limit: ITEMS_PER_PAGE,
  });
  const citas = citasData?.citas || [];
  const citasMeta = citasData?.meta || { total: 0, page: 1, limit: ITEMS_PER_PAGE, total_pages: 1 };

  const { data: citasDelDiaData } = useCitasDelDia();
  const citasDelDia = citasDelDiaData || [];

  // ✅ FIX: Query para citas pendientes (backend limita a max 100)
  const { data: todasCitasPendientesData } = useCitas({ estado: 'pendiente', limit: 100 });
  const todasCitasPendientes = todasCitasPendientesData?.citas || [];

  const { data: profesionalesData } = useProfesionales({ activo: true });
  const profesionales = profesionalesData?.profesionales || [];
  const { data: serviciosData } = useServicios({ activo: true });
  const servicios = serviciosData?.servicios || [];

  // Mutations
  const confirmarMutation = useConfirmarCita();
  const iniciarMutation = useIniciarCita();

  // Handlers de filtros
  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setPage(1); // Resetear a página 1 al cambiar filtros
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: '',
      profesional_id: '',
      servicio_id: '',
      sucursal_id: '',
      fecha_desde: '',
      fecha_hasta: '',
    });
    setPage(1); // Resetear a página 1 al limpiar filtros
  };

  // Handler de paginación
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handlers de acciones
  const handleVerDetalles = (cita) => {
    openModal('detalles', cita);
  };

  const handleCambiarEstado = (cita, accion) => {
    switch (accion) {
      case 'confirmar':
        confirmarMutation.mutate({ id: cita.id });
        break;
      case 'iniciar':
        iniciarMutation.mutate({ id: cita.id });
        break;
      case 'completar':
        // Transición suave: cerrar modal de detalles y abrir modal de completar
        transitionModal('detalles', 'completar', cita);
        break;
      case 'no_show':
        // Transición suave: cerrar modal de detalles y abrir modal de no_show
        transitionModal('detalles', 'noShow', cita);
        break;
      default:
        break;
    }
  };

  const handleEditar = (cita) => {
    openModal('formulario', cita, { mode: 'edit' });
  };

  const handleAbrirModalCancelar = (cita) => {
    openModal('cancelar', cita);
  };

  const handleNuevaCita = (fechaDesdeCalendario) => {
    openModal('formulario', null, {
      mode: 'create',
      fechaPreseleccionada: fechaDesdeCalendario || null,
    });
  };

  // Calcular estadísticas memoizadas para evitar recálculos innecesarios
  const estadisticas = useMemo(() => ({
    hoy: citasDelDia.length,
    pendientes: todasCitasPendientes.length,
    enCurso: citasDelDia.filter((c) => c.estado === 'en_curso').length,
    completadas: citasDelDia.filter((c) => c.estado === 'completada').length,
  }), [citasDelDia, todasCitasPendientes]);

  // Configuración de StatCards
  const statsConfig = useMemo(() => [
    { key: 'hoy', icon: Calendar, label: 'Citas Hoy', value: estadisticas.hoy, color: 'primary' },
    { key: 'pendientes', icon: Clock, label: 'Pendientes', value: estadisticas.pendientes, color: 'yellow' },
    { key: 'enCurso', icon: TrendingUp, label: 'En Curso', value: estadisticas.enCurso, color: 'primary' },
    { key: 'completadas', icon: CheckCircle, label: 'Completadas', value: estadisticas.completadas, color: 'green' },
  ], [estadisticas]);

  // Configuración de ViewTabs
  const viewTabsConfig = useMemo(() => [
    { id: 'lista', label: 'Vista Lista', icon: List },
    { id: 'calendario', label: 'Vista Calendario', icon: CalendarDays },
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agendamiento</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona citas y recordatorios
        </p>
      </div>

      {/* Tabs de navegación */}
      <AgendamientoNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header de sección - Mobile First */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Gestión de Citas</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  Administra y monitorea todas las citas de tu negocio
                </p>
              </div>
            </div>
            <Button variant="primary" onClick={handleNuevaCita} className="w-full sm:w-auto">
              <Plus className="w-5 h-5 mr-2" />
              Nueva Cita
            </Button>
          </div>
        </div>
        {/* Estadísticas Rápidas */}
        <StatCardGrid stats={statsConfig} columns={4} />

        {/* Sistema de Tabs - Vista Lista / Calendario */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg px-6">
          <ViewTabs
            tabs={viewTabsConfig}
            activeTab={vistaActiva}
            onChange={setVistaActiva}
          />
        </div>

        {/* Contenido según vista activa */}
        {vistaActiva === 'lista' ? (
          <>
            {/* Filtros (solo en vista lista) */}
            <CitaFilters
              filtros={filtros}
              onFiltrosChange={handleFiltrosChange}
              profesionales={profesionales}
              servicios={servicios}
              onLimpiarFiltros={handleLimpiarFiltros}
            />

            {/* Lista de Citas */}
            <CitasList
              citas={citas}
              isLoading={cargandoCitas}
              onVerDetalles={handleVerDetalles}
              onCambiarEstado={handleCambiarEstado}
              onEditar={handleEditar}
              onCancelar={handleAbrirModalCancelar}
              onLimpiarFiltros={handleLimpiarFiltros}
            />

            {/* Paginación */}
            {citasMeta.total_pages > 1 && (
              <div className="mt-4">
                <Pagination
                  pagination={{
                    page: citasMeta.page,
                    limit: citasMeta.limit,
                    total: citasMeta.total,
                    totalPages: citasMeta.total_pages,
                    hasNext: citasMeta.has_next,
                    hasPrev: citasMeta.has_prev,
                  }}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Calendario Mensual */}
            <CalendarioMensual
              onVerCita={handleVerDetalles}
              onCrearCita={handleNuevaCita}
              onEditarCita={handleEditar}
            />
          </>
        )}
      </div>

      {/* Modal de Detalles */}
      <CitaDetailModal
        isOpen={isOpen('detalles')}
        onClose={() => closeModal('detalles')}
        cita={getModalData('detalles')}
        onCambiarEstado={handleCambiarEstado}
        onEditar={handleEditar}
        onCancelar={handleAbrirModalCancelar}
      />

      {/* Modal de Formulario Crear/Editar */}
      <CitaFormModal
        key={`${getModalProps('formulario').mode}-${getModalData('formulario')?.id || 'new'}`}
        isOpen={isOpen('formulario')}
        onClose={() => closeModal('formulario')}
        mode={getModalProps('formulario').mode || 'create'}
        cita={getModalData('formulario')}
        fechaPreseleccionada={getModalProps('formulario').fechaPreseleccionada}
        clientePreseleccionado={getModalProps('formulario').clientePreseleccionado}
      />

      {/* Modal de Completar Cita */}
      <CompletarCitaModal
        isOpen={isOpen('completar')}
        onClose={() => closeModal('completar')}
        cita={getModalData('completar')}
      />

      {/* Modal de No Show */}
      <NoShowModal
        isOpen={isOpen('noShow')}
        onClose={() => closeModal('noShow')}
        cita={getModalData('noShow')}
      />

      {/* Modal de Cancelar */}
      <CancelarCitaModal
        isOpen={isOpen('cancelar')}
        onClose={() => closeModal('cancelar')}
        cita={getModalData('cancelar')}
      />
    </div>
  );
}

export default CitasPage;
