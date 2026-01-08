import { useState, useMemo } from 'react';
import { Plus, Lock, Calendar, TrendingDown, Clock, CalendarDays, Users, Building2 } from 'lucide-react';
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
import { StatCardGrid } from '@/components/ui/StatCardGrid';
import { ViewTabs } from '@/components/ui/ViewTabs';
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

  // Calcular próximos bloqueos (próximos 30 días)
  const proximosBloqueos = useMemo(() => {
    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(hoy.getDate() + 30);
    return bloqueosFiltrados.filter((b) => {
      const fecha = new Date(b.fecha_inicio);
      return fecha >= hoy && fecha <= treintaDias;
    }).length;
  }, [bloqueosFiltrados]);

  // Configuración de StatCards
  const statsConfig = useMemo(() => [
    { key: 'total', icon: Lock, label: 'Total Bloqueos', value: estadisticas.totalBloqueos, color: 'primary' },
    { key: 'dias', icon: Calendar, label: 'Total Días', value: estadisticas.totalDias, color: 'primary' },
    { key: 'perdidos', icon: TrendingDown, label: 'Ingresos Perdidos', value: formatCurrency(estadisticas.ingresosPerdidos), color: 'red' },
    { key: 'proximos', icon: Clock, label: 'Próximos 30 días', value: proximosBloqueos, color: 'yellow' },
  ], [estadisticas, proximosBloqueos]);

  // Configuración de ViewTabs
  const viewTabsConfig = useMemo(() => [
    { id: 'todos', label: 'Todos', icon: Lock },
    { id: 'profesionales', label: 'Por Profesional', icon: Users },
    { id: 'organizacionales', label: 'Organizacionales', icon: Building2 },
    { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  ], []);

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

        {/* Estadísticas */}
        <StatCardGrid stats={statsConfig} columns={4} />

        {/* Tabs de vistas */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-sm border border-gray-200 dark:border-gray-700 border-b-0 px-4">
          <ViewTabs
            tabs={viewTabsConfig}
            activeTab={vistaActiva}
            onChange={setVistaActiva}
          />
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
