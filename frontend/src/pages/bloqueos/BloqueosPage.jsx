import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Lock, Calendar, TrendingDown, Clock, CalendarDays, ArrowLeft } from 'lucide-react';
import { useBloqueos, useEliminarBloqueo } from '@/hooks/useBloqueos';
import { useProfesionales } from '@/hooks/useProfesionales';
import BloqueosList from '@/components/bloqueos/BloqueosList';
import BloqueosCalendar from '@/components/bloqueos/BloqueosCalendar';
import BloqueoFilters from '@/components/bloqueos/BloqueoFilters';
import BloqueoFormModal from '@/components/bloqueos/BloqueoFormModal';
import BloqueoDetailModal from '@/components/bloqueos/BloqueoDetailModal';
import AgendamientoNavTabs from '@/components/agendamiento/AgendamientoNavTabs';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  calcularEstadisticasBloqueos,
  filtrarBloqueos,
} from '@/utils/bloqueoHelpers';
import { formatCurrency } from '@/lib/utils';

/**
 * BloqueosPage - Página principal de gestión de bloqueos de horarios
 */
function BloqueosPage() {
  const navigate = useNavigate();

  // Estados
  const [vistaActiva, setVistaActiva] = useState('todos'); // 'todos' | 'profesionales' | 'organizacionales'
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo_bloqueo: '',
    profesional_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    solo_activos: true,
  });
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState('crear'); // 'crear' | 'editar'
  const [bloqueoSeleccionado, setBloqueoSeleccionado] = useState(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [bloqueoParaEliminar, setBloqueoParaEliminar] = useState(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [bloqueoParaVer, setBloqueoParaVer] = useState(null);
  const [fechaPreseleccionada, setFechaPreseleccionada] = useState(null);

  // Queries
  const { data: profesionales = [], isLoading: isLoadingProfesionales } = useProfesionales({
    activo: true,
  });

  // Mutations
  const eliminarMutation = useEliminarBloqueo();

  // Construir params para la query de bloqueos basado en la vista activa
  const queryParams = useMemo(() => {
    const params = {};

    // Aplicar filtro de fecha
    if (filtros.fecha_desde) params.fecha_inicio = filtros.fecha_desde;
    if (filtros.fecha_hasta) params.fecha_fin = filtros.fecha_hasta;

    // Aplicar filtro de tipo
    if (filtros.tipo_bloqueo) params.tipo_bloqueo = filtros.tipo_bloqueo;

    // Según la vista activa
    if (vistaActiva === 'organizacionales') {
      params.solo_organizacionales = true;
    } else if (vistaActiva === 'profesionales' && filtros.profesional_id) {
      params.profesional_id = parseInt(filtros.profesional_id);
    }

    return params;
  }, [filtros, vistaActiva]);

  const { data: bloqueos = [], isLoading: isLoadingBloqueos } = useBloqueos(queryParams);

  // Filtrar bloqueos localmente por búsqueda y estado activo
  const bloqueosFiltrados = useMemo(() => {
    return filtrarBloqueos(bloqueos, {
      busqueda: filtros.busqueda,
      activo: filtros.solo_activos ? true : undefined,
    });
  }, [bloqueos, filtros.busqueda, filtros.solo_activos]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    return calcularEstadisticasBloqueos(bloqueosFiltrados);
  }, [bloqueosFiltrados]);

  // Handlers
  const handleLimpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      tipo_bloqueo: '',
      profesional_id: '',
      fecha_desde: '',
      fecha_hasta: '',
      solo_activos: true,
    });
  };

  const handleNuevoBloqueo = () => {
    setModoFormulario('crear');
    setBloqueoSeleccionado(null);
    setFechaPreseleccionada(null);
    setModalFormularioAbierto(true);
  };

  const handleCrearBloqueoDesdeCalendario = (fechaISO) => {
    setModoFormulario('crear');
    setBloqueoSeleccionado(null);
    setFechaPreseleccionada(fechaISO);
    setModalFormularioAbierto(true);
  };

  const handleVerBloqueo = (bloqueo) => {
    setBloqueoParaVer(bloqueo);
    setModalDetalleAbierto(true);
  };

  const handleEditarBloqueo = (bloqueo) => {
    setModoFormulario('editar');
    setBloqueoSeleccionado(bloqueo);
    setModalFormularioAbierto(true);
  };

  const handleEliminarBloqueo = (bloqueo) => {
    setBloqueoParaEliminar(bloqueo);
    setModalEliminarAbierto(true);
  };

  const handleConfirmarEliminar = async () => {
    try {
      await eliminarMutation.mutateAsync(bloqueoParaEliminar.id);
      setModalEliminarAbierto(false);
      setBloqueoParaEliminar(null);
    } catch (error) {
      console.error('Error al eliminar bloqueo:', error);
    }
  };

  const handleCerrarFormulario = () => {
    setModalFormularioAbierto(false);
    setBloqueoSeleccionado(null);
    setFechaPreseleccionada(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Volver al Inicio</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900">Agendamiento</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona citas, bloqueos y clientes
        </p>
      </div>

      {/* Tabs de navegación */}
      <AgendamientoNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header de sección */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="h-8 w-8 text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bloqueos de Horarios</h2>
                <p className="text-sm text-gray-600">
                  Gestiona bloqueos por vacaciones, feriados y más
                </p>
              </div>
            </div>
            <Button onClick={handleNuevoBloqueo} className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Bloqueo
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total bloqueos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bloqueos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalBloqueos}</p>
              </div>
            </div>
          </div>

          {/* Total días */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Días</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalDias}</p>
              </div>
            </div>
          </div>

          {/* Ingresos perdidos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ingresos Perdidos</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(estadisticas.ingresosPerdidos)}
                </p>
              </div>
            </div>
          </div>

          {/* Próximos bloqueos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Próximos 30 días</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bloqueosFiltrados.filter((b) => {
                    const hoy = new Date();
                    const fecha = new Date(b.fecha_inicio);
                    const treintaDias = new Date();
                    treintaDias.setDate(hoy.getDate() + 30);
                    return fecha >= hoy && fecha <= treintaDias;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de vistas */}
        <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 border-b-0">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setVistaActiva('todos')}
              className={`px-6 py-3 font-medium transition-colors ${
                vistaActiva === 'todos'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos los Bloqueos
            </button>
            <button
              onClick={() => setVistaActiva('profesionales')}
              className={`px-6 py-3 font-medium transition-colors ${
                vistaActiva === 'profesionales'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Profesional
            </button>
            <button
              onClick={() => setVistaActiva('organizacionales')}
              className={`px-6 py-3 font-medium transition-colors ${
                vistaActiva === 'organizacionales'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Organizacionales
            </button>
            <button
              onClick={() => setVistaActiva('calendario')}
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                vistaActiva === 'calendario'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Vista Calendario
            </button>
          </div>
        </div>

        {/* Vista condicional: Lista o Calendario */}
        {vistaActiva === 'calendario' ? (
          /* Vista de calendario */
          <div className="mb-6">
            <BloqueosCalendar
              profesionalId={
                vistaActiva === 'profesionales' && filtros.profesional_id
                  ? parseInt(filtros.profesional_id)
                  : null
              }
              onVerBloqueo={handleVerBloqueo}
              onCrearBloqueo={handleCrearBloqueoDesdeCalendario}
            />
          </div>
        ) : (
          /* Vista de lista con filtros */
          <>
            {/* Filtros */}
            <div className="mb-6">
              <BloqueoFilters
                filtros={filtros}
                onFiltrosChange={setFiltros}
                onLimpiar={handleLimpiarFiltros}
                profesionales={profesionales}
                isLoadingProfesionales={isLoadingProfesionales}
              />
            </div>

            {/* Lista de bloqueos */}
            <BloqueosList
              bloqueos={bloqueosFiltrados}
              isLoading={isLoadingBloqueos}
              onVer={handleVerBloqueo}
              onEditar={handleEditarBloqueo}
              onEliminar={handleEliminarBloqueo}
            />
          </>
        )}

        {/* Modal de formulario (crear/editar) */}
        <BloqueoFormModal
          isOpen={modalFormularioAbierto}
          onClose={handleCerrarFormulario}
          bloqueo={bloqueoSeleccionado}
          modo={modoFormulario}
          fechaInicial={fechaPreseleccionada}
        />

        {/* Modal de detalle (ver información completa) */}
        <BloqueoDetailModal
          isOpen={modalDetalleAbierto}
          onClose={() => {
            setModalDetalleAbierto(false);
            setBloqueoParaVer(null);
          }}
          bloqueo={bloqueoParaVer}
          onEditar={handleEditarBloqueo}
          onEliminar={handleEliminarBloqueo}
        />

        {/* Modal de confirmación de eliminación */}
        <Modal
          isOpen={modalEliminarAbierto}
          onClose={() => {
            setModalEliminarAbierto(false);
            setBloqueoParaEliminar(null);
          }}
          title="Eliminar Bloqueo"
          size="md"
        >
          {bloqueoParaEliminar && (
            <div className="space-y-4">
              <p className="text-gray-700">
                ¿Estás seguro de que deseas eliminar el siguiente bloqueo?
              </p>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">{bloqueoParaEliminar.titulo}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Tipo: {bloqueoParaEliminar.tipo_bloqueo}</p>
                  <p>
                    Fecha: {bloqueoParaEliminar.fecha_inicio} - {bloqueoParaEliminar.fecha_fin}
                  </p>
                  {bloqueoParaEliminar.citas_afectadas > 0 && (
                    <p className="text-red-600 font-medium mt-2">
                      ⚠️ Este bloqueo afecta {bloqueoParaEliminar.citas_afectadas} citas
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setModalEliminarAbierto(false);
                    setBloqueoParaEliminar(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmarEliminar}
                  disabled={eliminarMutation.isPending}
                >
                  {eliminarMutation.isPending ? 'Eliminando...' : 'Eliminar Bloqueo'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default BloqueosPage;
