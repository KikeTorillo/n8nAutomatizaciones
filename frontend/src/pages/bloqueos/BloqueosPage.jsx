import { useState, useMemo } from 'react';
import { Plus, Lock, Calendar, TrendingDown, Clock, CalendarDays } from 'lucide-react';
import { useBloqueos, useEliminarBloqueo } from '@/hooks/useBloqueos';
import { useProfesionales } from '@/hooks/useProfesionales';
import BloqueosList from '@/components/bloqueos/BloqueosList';
import BloqueosCalendar from '@/components/bloqueos/BloqueosCalendar';
import BloqueoFilters from '@/components/bloqueos/BloqueoFilters';
import BloqueoFormModal from '@/components/bloqueos/BloqueoFormModal';
import BloqueoDetailModal from '@/components/bloqueos/BloqueoDetailModal';
import AgendamientoNavTabs from '@/components/agendamiento/AgendamientoNavTabs';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
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
  const { data: profesionalesData, isLoading: isLoadingProfesionales } = useProfesionales({
    activo: true,
  });
  const profesionales = profesionalesData?.profesionales || [];

  // Mutations
  const eliminarMutation = useEliminarBloqueo();

  // Construir params para la query de bloqueos basado en la vista activa
  const queryParams = useMemo(() => {
    const params = {};

    // Aplicar filtro de fecha
    if (filtros.fecha_desde) params.fecha_inicio = filtros.fecha_desde;
    if (filtros.fecha_hasta) params.fecha_fin = filtros.fecha_hasta;

    // Aplicar filtro de tipo
    if (filtros.tipo_bloqueo_id) params.tipo_bloqueo_id = filtros.tipo_bloqueo_id;

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
              <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Bloqueos de Horarios</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  Gestiona bloqueos por vacaciones, feriados y más
                </p>
              </div>
            </div>
            <Button onClick={handleNuevoBloqueo} className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Bloqueo
            </Button>
          </div>
        </div>

        {/* Estadísticas - 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Total bloqueos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Bloqueos</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{estadisticas.totalBloqueos}</p>
              </div>
            </div>
          </div>

          {/* Total días */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Días</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{estadisticas.totalDias}</p>
              </div>
            </div>
          </div>

          {/* Ingresos perdidos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Ingresos Perdidos</p>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(estadisticas.ingresosPerdidos)}
                </p>
              </div>
            </div>
          </div>

          {/* Próximos bloqueos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Próximos 30 días</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
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

        {/* Tabs de vistas - Mobile First */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-sm border border-gray-200 dark:border-gray-700 border-b-0">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setVistaActiva('todos')}
              className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
                vistaActiva === 'todos'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setVistaActiva('profesionales')}
              className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
                vistaActiva === 'profesionales'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span className="sm:hidden">Profes.</span>
              <span className="hidden sm:inline">Por Profesional</span>
            </button>
            <button
              onClick={() => setVistaActiva('organizacionales')}
              className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
                vistaActiva === 'organizacionales'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span className="sm:hidden">Org.</span>
              <span className="hidden sm:inline">Organizacionales</span>
            </button>
            <button
              onClick={() => setVistaActiva('calendario')}
              className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 ${
                vistaActiva === 'calendario'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="sm:hidden">Cal.</span>
              <span className="hidden sm:inline">Calendario</span>
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
              <p className="text-gray-700 dark:text-gray-300">
                ¿Estás seguro de que deseas eliminar el siguiente bloqueo?
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{bloqueoParaEliminar.titulo}</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Tipo: {bloqueoParaEliminar.tipo_bloqueo}</p>
                  <p>
                    Fecha: {bloqueoParaEliminar.fecha_inicio} - {bloqueoParaEliminar.fecha_fin}
                  </p>
                  {bloqueoParaEliminar.citas_afectadas > 0 && (
                    <p className="text-red-600 dark:text-red-400 font-medium mt-2">
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
