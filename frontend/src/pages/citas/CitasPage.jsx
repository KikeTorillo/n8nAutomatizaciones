import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Plus, TrendingUp, Clock, CheckCircle, AlertCircle, List, CalendarDays } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Modal from '@/components/ui/Modal';
import CitasList from '@/components/citas/CitasList';
import CitaFilters from '@/components/citas/CitaFilters';
import CitaDetailModal from '@/components/citas/CitaDetailModal';
import CitaFormModal from '@/components/citas/CitaFormModal';
import CompletarCitaModal from '@/components/citas/CompletarCitaModal';
import NoShowModal from '@/components/citas/NoShowModal';
import CalendarioMensual from '@/components/citas/CalendarioMensual';
import AgendamientoNavTabs from '@/components/agendamiento/AgendamientoNavTabs';
import { useToast } from '@/hooks/useToast';
import {
  useCitas,
  useCitasDelDia,
  useCancelarCita,
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
  const { showToast } = useToast();

  // Estado de vista activa (lista o calendario)
  const [vistaActiva, setVistaActiva] = useState('lista'); // 'lista' o 'calendario'

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

  // Estado de modales
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [citaParaEditar, setCitaParaEditar] = useState(null);
  const [fechaPreseleccionada, setFechaPreseleccionada] = useState(null);
  const [modalCompletarAbierto, setModalCompletarAbierto] = useState(false);
  const [modalNoShowAbierto, setModalNoShowAbierto] = useState(false);
  const [clientePreseleccionado, setClientePreseleccionado] = useState(null);

  // Efecto para abrir modal desde navegación (ej: desde ClienteDetailPage)
  useEffect(() => {
    if (location.state?.abrirModal) {
      setModalMode('create');
      if (location.state?.clienteId) {
        setClientePreseleccionado(location.state.clienteId);
      }
      setIsFormModalOpen(true);
      // Limpiar el state para evitar que se abra de nuevo al navegar
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Queries
  const { data: citas = [], isLoading: cargandoCitas } = useCitas(filtros);
  const { data: citasDelDia = [] } = useCitasDelDia();

  // ✅ FIX: Query para todas las citas pendientes (sin filtro de fecha)
  const { data: todasCitasPendientes = [] } = useCitas({ estado: 'pendiente' });

  const { data: profesionalesData } = useProfesionales({ activo: true });
  const profesionales = profesionalesData?.profesionales || [];
  const { data: serviciosData } = useServicios({ activo: true });
  const servicios = serviciosData?.servicios || [];

  // Mutations
  const cancelarMutation = useCancelarCita();
  const confirmarMutation = useConfirmarCita();
  const iniciarMutation = useIniciarCita();

  // Handlers de filtros
  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
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
  };

  // Handlers de acciones
  const handleVerDetalles = (cita) => {
    setCitaSeleccionada(cita);
    setModalDetallesAbierto(true);
  };

  const handleCambiarEstado = (cita, accion) => {
    setCitaSeleccionada(cita);

    switch (accion) {
      case 'confirmar':
        confirmarMutation.mutate({ id: cita.id });
        break;
      case 'iniciar':
        iniciarMutation.mutate({ id: cita.id });
        break;
      case 'completar':
        // Transición suave: cerrar modal de detalles y después de la animación abrir modal de completar
        setModalDetallesAbierto(false);
        setTimeout(() => {
          setModalCompletarAbierto(true);
        }, 300); // Espera a que termine la animación de cierre del modal
        break;
      case 'no_show':
        // Transición suave: cerrar modal de detalles y después de la animación abrir modal de no_show
        setModalDetallesAbierto(false);
        setTimeout(() => {
          setModalNoShowAbierto(true);
        }, 300); // Espera a que termine la animación de cierre del modal
        break;
      default:
        break;
    }
  };

  const handleEditar = (cita) => {
    setCitaParaEditar(cita);
    setModalMode('edit');
    setIsFormModalOpen(true);
  };

  const handleAbrirModalCancelar = (cita) => {
    setCitaSeleccionada(cita);
    setMotivoCancelacion('');
    setModalCancelarAbierto(true);
  };

  const handleCancelar = () => {
    if (!motivoCancelacion.trim()) {
      showToast('Debes indicar un motivo de cancelación', 'error');
      return;
    }

    cancelarMutation.mutate(
      {
        id: citaSeleccionada.id,
        motivo_cancelacion: motivoCancelacion,
      },
      {
        onSuccess: () => {
          setModalCancelarAbierto(false);
          setMotivoCancelacion('');
          setCitaSeleccionada(null);
        },
      }
    );
  };

  const handleNuevaCita = (fechaDesdeCalendario) => {
    setModalMode('create');
    setCitaParaEditar(null);

    // Si se proporciona una fecha desde el calendario, guardarla para pre-llenar el formulario
    if (fechaDesdeCalendario) {
      setFechaPreseleccionada(fechaDesdeCalendario);
    } else {
      setFechaPreseleccionada(null);
    }

    setIsFormModalOpen(true);
  };

  // Calcular estadísticas
  // ✅ FIX: Pendientes muestra TODAS las citas pendientes (no solo las de hoy)
  const citasPendientes = todasCitasPendientes.length;
  // En Curso y Completadas solo cuentan las de HOY
  const citasEnCurso = citasDelDia.filter((c) => c.estado === 'en_curso').length;
  const citasCompletadas = citasDelDia.filter((c) => c.estado === 'completada').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agendamiento</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona citas, bloqueos y clientes
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
        {/* Estadísticas Rápidas - 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
          {/* Total Citas del Día */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Citas Hoy</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{citasDelDia.length}</p>
              </div>
              <div className="bg-primary-100 dark:bg-primary-900/40 p-2 sm:p-3 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{citasPendientes}</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 sm:p-3 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* En Curso */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">En Curso</p>
                <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{citasEnCurso}</p>
              </div>
              <div className="bg-primary-100 dark:bg-primary-900/40 p-2 sm:p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          {/* Completadas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Completadas</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{citasCompletadas}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/40 p-2 sm:p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Sistema de Tabs - Vista Lista / Calendario */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setVistaActiva('lista')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  flex items-center gap-2
                  ${
                    vistaActiva === 'lista'
                      ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <List className="w-5 h-5" />
                Vista Lista
              </button>
              <button
                onClick={() => setVistaActiva('calendario')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  flex items-center gap-2
                  ${
                    vistaActiva === 'calendario'
                      ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <CalendarDays className="w-5 h-5" />
                Vista Calendario
              </button>
            </nav>
          </div>
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
            />
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
        isOpen={modalDetallesAbierto}
        onClose={() => {
          setModalDetallesAbierto(false);
          setCitaSeleccionada(null);
        }}
        cita={citaSeleccionada}
        onCambiarEstado={handleCambiarEstado}
        onEditar={handleEditar}
        onCancelar={handleAbrirModalCancelar}
      />

      {/* Modal de Formulario Crear/Editar */}
      <CitaFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setModalMode('create');
          setCitaParaEditar(null);
          setFechaPreseleccionada(null);
          setClientePreseleccionado(null);
        }}
        mode={modalMode}
        cita={citaParaEditar}
        fechaPreseleccionada={fechaPreseleccionada}
        clientePreseleccionado={clientePreseleccionado}
      />

      {/* Modal de Completar Cita */}
      <CompletarCitaModal
        isOpen={modalCompletarAbierto}
        onClose={() => {
          setModalCompletarAbierto(false);
          setCitaSeleccionada(null);
        }}
        cita={citaSeleccionada}
      />

      {/* Modal de No Show */}
      <NoShowModal
        isOpen={modalNoShowAbierto}
        onClose={() => {
          setModalNoShowAbierto(false);
          setCitaSeleccionada(null);
        }}
        cita={citaSeleccionada}
      />

      {/* Modal de Cancelar */}
      <Modal
        isOpen={modalCancelarAbierto}
        onClose={() => {
          setModalCancelarAbierto(false);
          setCitaSeleccionada(null);
          setMotivoCancelacion('');
        }}
        title="Cancelar Cita"
      >
        <div className="space-y-4">
          {/* Información de la cita */}
          {citaSeleccionada && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">¿Estás seguro?</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vas a cancelar la cita <strong className="text-gray-900 dark:text-gray-100">{citaSeleccionada.codigo_cita}</strong> del
                cliente <strong className="text-gray-900 dark:text-gray-100">{citaSeleccionada.cliente_nombre}</strong>
              </p>
            </div>
          )}

          {/* Motivo de cancelación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo de cancelación <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="Indica el motivo de la cancelación..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => {
                setModalCancelarAbierto(false);
                setMotivoCancelacion('');
              }}
            >
              Volver
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelar}
              disabled={cancelarMutation.isLoading || !motivoCancelacion.trim()}
            >
              {cancelarMutation.isLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CitasPage;
