/**
 * MiEquipoAusenciasTab - Gestión de equipo para supervisores/admins
 * Muestra una sección específica según el prop `seccion`
 * Enero 2026
 */
import { useState, useMemo, memo, useCallback } from 'react';
import {
  Users,
  Umbrella,
  HeartPulse,
  Lock,
  Plus,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  TrendingDown,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Modal, StatCardGrid } from '@/components/ui';
import { useModalManager } from '@/hooks/utils';

// Componentes de Vacaciones
import { SolicitudesEquipoSection } from '@/components/vacaciones';

// Componentes de Incapacidades
import { IncapacidadesList, IncapacidadFormModal } from '@/components/incapacidades';

// Componentes de Bloqueos
import BloqueosList from '@/components/bloqueos/BloqueosList';
import BloqueoFilters from '@/components/bloqueos/BloqueoFilters';
import BloqueoFormDrawer from '@/components/bloqueos/BloqueoFormDrawer';
import BloqueoDetailModal from '@/components/bloqueos/BloqueoDetailModal';

// Hooks
import { useBloqueos, useEliminarBloqueo } from '@/hooks/agendamiento';
import {
  useProfesionales,
  useEstadisticasVacaciones,
  useEstadisticasIncapacidades,
} from '@/hooks/personas';
import {
  filtrarBloqueos,
  esBloqueoAutoGenerado,
  calcularEstadisticasBloqueos,
} from '@/utils/bloqueoHelpers';
import { formatCurrency } from '@/lib/utils';

// Configuración de secciones
const SECCIONES_CONFIG = {
  vacaciones: {
    icon: Umbrella,
    title: 'Vacaciones del Equipo',
    description: 'Solicitudes de vacaciones pendientes de aprobación',
  },
  incapacidades: {
    icon: HeartPulse,
    title: 'Incapacidades del Equipo',
    description: 'Gestión de incapacidades médicas del equipo',
  },
  bloqueos: {
    icon: Lock,
    title: 'Bloqueos del Equipo',
    description: 'Bloqueos manuales: mantenimiento, eventos especiales, emergencias',
  },
};

/**
 * Sección de Vacaciones con estadísticas
 */
const VacacionesSection = memo(function VacacionesSection({ stats, isLoading }) {
  const vacaciones = stats || {};
  const totalProfesionales = vacaciones.saldos?.total_empleados || 0;
  const pendientesVac = vacaciones.solicitudes?.pendientes || 0;
  const aprobadasVac = vacaciones.solicitudes?.aprobadas || 0;
  const diasOtorgados = vacaciones.saldos?.total_dias_usados || 0;

  return (
    <div className="space-y-6">
      {/* Estadísticas de vacaciones */}
      <StatCardGrid
        stats={[
          {
            key: 'con-saldo',
            icon: Users,
            label: 'Profesionales con saldo',
            value: totalProfesionales,
            color: 'primary',
          },
          {
            key: 'pendientes-vac',
            icon: Clock,
            label: 'Pendientes',
            value: pendientesVac,
            color: 'yellow',
          },
          {
            key: 'aprobadas',
            icon: CheckCircle,
            label: 'Aprobadas',
            value: aprobadasVac,
            color: 'green',
          },
          {
            key: 'dias-otorgados',
            icon: Calendar,
            label: 'Días otorgados',
            value: diasOtorgados,
            color: 'blue',
          },
        ]}
        columns={4}
        isLoading={isLoading}
      />

      {/* Lista de solicitudes pendientes */}
      <SolicitudesEquipoSection />
    </div>
  );
});

/**
 * Sección de Incapacidades con estadísticas
 */
const IncapacidadesSection = memo(function IncapacidadesSection({ stats, isLoading, onRegistrar }) {
  const incapacidades = stats || {};

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <StatCardGrid
        stats={[
          {
            key: 'total-incap',
            icon: HeartPulse,
            label: 'Total incapacidades',
            value: incapacidades.total || 0,
            color: 'primary',
          },
          {
            key: 'activas',
            icon: Users,
            label: 'Activas',
            value: incapacidades.activas || 0,
            color: 'green',
          },
          {
            key: 'dias-incap',
            icon: Calendar,
            label: 'Días totales',
            value: incapacidades.dias_totales || 0,
            color: 'red',
          },
          {
            key: 'promedio',
            icon: Clock,
            label: 'Promedio días',
            value: incapacidades.promedio_dias
              ? parseFloat(incapacidades.promedio_dias).toFixed(1)
              : '0',
            color: 'purple',
          },
        ]}
        columns={4}
        isLoading={isLoading}
      />

      {/* Lista de incapacidades */}
      <IncapacidadesList onRegistrar={onRegistrar} />
    </div>
  );
});

/**
 * Sección de Bloqueos con estadísticas
 */
const BloqueosSection = memo(function BloqueosSection({
  filtros,
  setFiltros,
  bloqueosFiltrados,
  isLoadingBloqueos,
  isLoadingProfesionales,
  profesionales,
  onVer,
  onEditar,
  onEliminar,
  onLimpiarFiltros,
  statsBloqueos,
}) {
  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <StatCardGrid
        stats={[
          {
            key: 'total-bloqueos',
            icon: Lock,
            label: 'Total bloqueos',
            value: statsBloqueos?.totalBloqueos || 0,
            color: 'primary',
          },
          {
            key: 'dias-bloqueos',
            icon: Calendar,
            label: 'Días bloqueados',
            value: statsBloqueos?.totalDias || 0,
            color: 'yellow',
          },
          {
            key: 'proximos',
            icon: Clock,
            label: 'Próximos 30 días',
            value: statsBloqueos?.proximos30Dias || 0,
            color: 'blue',
          },
          {
            key: 'ingresos-perdidos',
            icon: TrendingDown,
            label: 'Ingresos perdidos',
            value: formatCurrency(statsBloqueos?.ingresosPerdidos || 0),
            color: 'red',
          },
        ]}
        columns={4}
        isLoading={isLoadingBloqueos}
      />

      {/* Filtros */}
      <BloqueoFilters
        filtros={filtros}
        onFiltrosChange={setFiltros}
        onLimpiar={onLimpiarFiltros}
        profesionales={profesionales}
        isLoadingProfesionales={isLoadingProfesionales}
      />

      {/* Lista */}
      <BloqueosList
        bloqueos={bloqueosFiltrados}
        isLoading={isLoadingBloqueos}
        onVer={onVer}
        onEditar={onEditar}
        onEliminar={onEliminar}
      />
    </div>
  );
});

/**
 * MiEquipoAusenciasTab - Componente principal
 * @param {string} seccion - 'vacaciones' | 'incapacidades' | 'bloqueos'
 */
function MiEquipoAusenciasTab({ seccion = 'vacaciones' }) {
  const queryClient = useQueryClient();
  const config = SECCIONES_CONFIG[seccion] || SECCIONES_CONFIG.vacaciones;
  const Icon = config.icon;

  // Estado de filtros para bloqueos
  const [filtrosBloqueos, setFiltrosBloqueos] = useState({
    busqueda: '',
    tipo_bloqueo: '',
    profesional_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    solo_activos: true,
  });

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    incapacidadForm: { isOpen: false },
    bloqueoForm: { isOpen: false, data: null },
    bloqueoDetalle: { isOpen: false, data: null },
    bloqueoDelete: { isOpen: false, data: null },
  });

  // Año actual para estadísticas
  const anioActual = new Date().getFullYear();

  // Estadísticas de vacaciones (solo se cargan si la sección es vacaciones)
  const {
    data: statsVacaciones,
    isLoading: isLoadingVacaciones,
  } = useEstadisticasVacaciones(
    seccion === 'vacaciones' ? { anio: anioActual } : false
  );

  // Estadísticas de incapacidades (solo se cargan si la sección es incapacidades)
  const {
    data: statsIncapacidades,
    isLoading: isLoadingIncapacidades,
  } = useEstadisticasIncapacidades(
    seccion === 'incapacidades' ? { anio: anioActual } : false
  );

  // Queries para bloqueos (solo se cargan si la sección es bloqueos)
  const { data: profesionalesData, isLoading: isLoadingProfesionales } = useProfesionales(
    seccion === 'bloqueos' ? { activo: true } : false
  );
  const profesionales = profesionalesData?.profesionales || [];

  const queryParams = useMemo(() => {
    if (seccion !== 'bloqueos') return null;
    const params = {};
    if (filtrosBloqueos.fecha_desde) params.fecha_inicio = filtrosBloqueos.fecha_desde;
    if (filtrosBloqueos.fecha_hasta) params.fecha_fin = filtrosBloqueos.fecha_hasta;
    if (filtrosBloqueos.tipo_bloqueo_id) params.tipo_bloqueo_id = filtrosBloqueos.tipo_bloqueo_id;
    if (filtrosBloqueos.profesional_id) params.profesional_id = parseInt(filtrosBloqueos.profesional_id);
    return params;
  }, [seccion, filtrosBloqueos]);

  const { data: bloqueos = [], isLoading: isLoadingBloqueos } = useBloqueos(
    seccion === 'bloqueos' ? queryParams : null
  );
  const eliminarMutation = useEliminarBloqueo();

  // Filtrar bloqueos: solo manuales (NO auto-generados)
  const bloqueosFiltrados = useMemo(() => {
    if (seccion !== 'bloqueos') return [];
    const soloManuales = bloqueos.filter((b) => !esBloqueoAutoGenerado(b));
    return filtrarBloqueos(soloManuales, {
      busqueda: filtrosBloqueos.busqueda,
      activo: filtrosBloqueos.solo_activos ? true : undefined,
    });
  }, [seccion, bloqueos, filtrosBloqueos.busqueda, filtrosBloqueos.solo_activos]);

  // Estadísticas de bloqueos manuales
  const statsBloqueos = useMemo(() => {
    if (seccion !== 'bloqueos') return null;
    const bloqueosManuales = bloqueos.filter((b) => !esBloqueoAutoGenerado(b));
    const stats = calcularEstadisticasBloqueos(bloqueosManuales);

    // Calcular bloqueos próximos 30 días
    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(hoy.getDate() + 30);
    const proximos30Dias = bloqueosManuales.filter((b) => {
      const fecha = new Date(b.fecha_inicio);
      return fecha >= hoy && fecha <= treintaDias;
    }).length;

    return { ...stats, proximos30Dias };
  }, [seccion, bloqueos]);

  // Handlers
  const handleRefresh = useCallback(() => {
    if (seccion === 'vacaciones') {
      queryClient.invalidateQueries({ queryKey: ['vacaciones'], refetchType: 'active' });
    } else if (seccion === 'incapacidades') {
      queryClient.invalidateQueries({ queryKey: ['incapacidades'], refetchType: 'active' });
    } else if (seccion === 'bloqueos') {
      queryClient.invalidateQueries({ queryKey: ['bloqueos'], refetchType: 'active' });
    }
  }, [queryClient, seccion]);

  const handleLimpiarFiltros = useCallback(() => {
    setFiltrosBloqueos({
      busqueda: '',
      tipo_bloqueo: '',
      profesional_id: '',
      fecha_desde: '',
      fecha_hasta: '',
      solo_activos: true,
    });
  }, []);

  const handleNuevoBloqueo = useCallback(() => {
    openModal('bloqueoForm', { bloqueo: null, mode: 'crear', fechaPreseleccionada: null });
  }, [openModal]);

  const handleVerBloqueo = useCallback((bloqueo) => {
    if (!esBloqueoAutoGenerado(bloqueo)) {
      openModal('bloqueoDetalle', bloqueo);
    }
  }, [openModal]);

  const handleEditarBloqueo = useCallback((bloqueo) => {
    openModal('bloqueoForm', { bloqueo, mode: 'editar', fechaPreseleccionada: null });
  }, [openModal]);

  const handleEliminarBloqueo = useCallback((bloqueo) => {
    openModal('bloqueoDelete', bloqueo);
  }, [openModal]);

  const handleConfirmarEliminar = useCallback(async () => {
    const bloqueoParaEliminar = getModalData('bloqueoDelete');
    if (!bloqueoParaEliminar) return;
    try {
      await eliminarMutation.mutateAsync(bloqueoParaEliminar.id);
      closeModal('bloqueoDelete');
    } catch (err) {
      console.error('Error al eliminar bloqueo:', err);
    }
  }, [getModalData, eliminarMutation, closeModal]);

  // Botón de acción según sección
  const renderActionButton = () => {
    if (seccion === 'incapacidades') {
      return (
        <Button size="sm" onClick={() => openModal('incapacidadForm')}>
          <Plus className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Registrar</span>
        </Button>
      );
    }
    if (seccion === 'bloqueos') {
      return (
        <Button size="sm" onClick={handleNuevoBloqueo}>
          <Plus className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
      );
    }
    return null;
  };

  // Renderizar contenido según sección
  const renderContent = () => {
    switch (seccion) {
      case 'vacaciones':
        return <VacacionesSection stats={statsVacaciones} isLoading={isLoadingVacaciones} />;
      case 'incapacidades':
        return (
          <IncapacidadesSection
            stats={statsIncapacidades}
            isLoading={isLoadingIncapacidades}
            onRegistrar={() => openModal('incapacidadForm')}
          />
        );
      case 'bloqueos':
        return (
          <BloqueosSection
            filtros={filtrosBloqueos}
            setFiltros={setFiltrosBloqueos}
            bloqueosFiltrados={bloqueosFiltrados}
            isLoadingBloqueos={isLoadingBloqueos}
            isLoadingProfesionales={isLoadingProfesionales}
            profesionales={profesionales}
            onVer={handleVerBloqueo}
            onEditar={handleEditarBloqueo}
            onEliminar={handleEliminarBloqueo}
            onLimpiarFiltros={handleLimpiarFiltros}
            statsBloqueos={statsBloqueos}
          />
        );
      default:
        return <VacacionesSection stats={statsVacaciones} isLoading={isLoadingVacaciones} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {config.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {renderActionButton()}
        </div>
      </div>

      {/* Contenido */}
      {renderContent()}

      {/* Modal de incapacidad */}
      {seccion === 'incapacidades' && (
        <IncapacidadFormModal
          isOpen={isOpen('incapacidadForm')}
          onClose={() => closeModal('incapacidadForm')}
        />
      )}

      {/* Modales de bloqueos */}
      {seccion === 'bloqueos' && (
        <>
          <BloqueoFormDrawer
            isOpen={isOpen('bloqueoForm')}
            onClose={() => closeModal('bloqueoForm')}
            bloqueo={getModalData('bloqueoForm')?.bloqueo}
            modo={getModalData('bloqueoForm')?.mode || 'crear'}
            fechaInicial={getModalData('bloqueoForm')?.fechaPreseleccionada}
          />

          <BloqueoDetailModal
            isOpen={isOpen('bloqueoDetalle')}
            onClose={() => closeModal('bloqueoDetalle')}
            bloqueo={getModalData('bloqueoDetalle')}
            onEditar={handleEditarBloqueo}
            onEliminar={handleEliminarBloqueo}
          />

          <Modal
            isOpen={isOpen('bloqueoDelete')}
            onClose={() => closeModal('bloqueoDelete')}
            title="Eliminar Bloqueo"
            size="md"
          >
            {getModalData('bloqueoDelete') && (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  ¿Estás seguro de que deseas eliminar el siguiente bloqueo?
                </p>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {getModalData('bloqueoDelete')?.titulo}
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Tipo: {getModalData('bloqueoDelete')?.tipo_bloqueo}</p>
                    <p>
                      Fecha: {getModalData('bloqueoDelete')?.fecha_inicio} - {getModalData('bloqueoDelete')?.fecha_fin}
                    </p>
                    {getModalData('bloqueoDelete')?.citas_afectadas > 0 && (
                      <p className="text-red-600 dark:text-red-400 font-medium mt-2">
                        Este bloqueo afecta {getModalData('bloqueoDelete')?.citas_afectadas} citas
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => closeModal('bloqueoDelete')}>
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
        </>
      )}
    </div>
  );
}

export default MiEquipoAusenciasTab;
