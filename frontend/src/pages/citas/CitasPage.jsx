import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, TrendingUp, Clock, CheckCircle, AlertCircle, List, CalendarDays, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CitasList from '@/components/citas/CitasList';
import CitaFilters from '@/components/citas/CitaFilters';
import CitaDetailModal from '@/components/citas/CitaDetailModal';
import CitaFormModal from '@/components/citas/CitaFormModal';
import CompletarCitaModal from '@/components/citas/CompletarCitaModal';
import NoShowModal from '@/components/citas/NoShowModal';
import CalendarioMensual from '@/components/citas/CalendarioMensual';
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
  const { showToast } = useToast();

  // Estado de vista activa (lista o calendario)
  const [vistaActiva, setVistaActiva] = useState('lista'); // 'lista' o 'calendario'

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    profesional_id: '',
    servicio_id: '',
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

  // Queries
  const { data: citas = [], isLoading: cargandoCitas } = useCitas(filtros);
  const { data: citasDelDia = [] } = useCitasDelDia();

  // ✅ FIX: Query para todas las citas pendientes (sin filtro de fecha)
  const { data: todasCitasPendientes = [] } = useCitas({ estado: 'pendiente' });

  const { data: profesionales = [] } = useProfesionales({ activo: true });
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Botón de regreso al home */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Volver al Inicio</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Citas</h1>
              <p className="text-sm text-gray-600 mt-1">
                Administra y monitorea todas las citas de tu negocio
              </p>
            </div>
            <Button variant="primary" onClick={handleNuevaCita}>
              <Plus className="w-5 h-5 mr-2" />
              Nueva Cita
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Total Citas del Día */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{citasDelDia.length}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{citasPendientes}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* En Curso */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Curso</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{citasEnCurso}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completadas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{citasCompletadas}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sistema de Tabs - Vista Lista / Calendario */}
        <div className="mb-6">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setVistaActiva('lista')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  flex items-center gap-2
                  ${
                    vistaActiva === 'lista'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        }}
        mode={modalMode}
        cita={citaParaEditar}
        fechaPreseleccionada={fechaPreseleccionada}
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold text-gray-900">¿Estás seguro?</h4>
              </div>
              <p className="text-sm text-gray-600">
                Vas a cancelar la cita <strong>{citaSeleccionada.codigo_cita}</strong> del
                cliente <strong>{citaSeleccionada.cliente_nombre}</strong>
              </p>
            </div>
          )}

          {/* Motivo de cancelación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de cancelación <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="Indica el motivo de la cancelación..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
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
