/**
 * OtrosBloqueoTab - Tab de bloqueos manuales en módulo Ausencias
 * Muestra solo bloqueos manuales (mantenimiento, eventos, emergencias)
 * Excluye bloqueos auto-generados (vacaciones, incapacidad, feriados)
 * Enero 2026
 */
import { useState, useMemo } from 'react';
import { useModalManager } from '@/hooks/utils';
import { Plus, Lock, Calendar, TrendingDown, Clock, CalendarDays } from 'lucide-react';
import { useBloqueos, useEliminarBloqueo } from '@/hooks/agendamiento';
import { useProfesionales } from '@/hooks/personas';
import BloqueosList from '@/components/bloqueos/BloqueosList';
import BloqueosCalendar from '@/components/bloqueos/BloqueosCalendar';
import BloqueoFilters from '@/components/bloqueos/BloqueoFilters';
import BloqueoFormDrawer from '@/components/bloqueos/BloqueoFormDrawer';
import BloqueoDetailModal from '@/components/bloqueos/BloqueoDetailModal';
import { Button, Modal } from '@/components/ui';
import {
  calcularEstadisticasBloqueos,
  filtrarBloqueos,
  esBloqueoAutoGenerado,
} from '@/utils/bloqueoHelpers';
import { formatCurrency } from '@/lib/utils';

/**
 * OtrosBloqueoTab - Tab para gestionar bloqueos manuales
 * Filtra automáticamente para mostrar solo bloqueos NO auto-generados
 * @param {Object} props
 * @param {string} [props.initialView='lista'] - Vista inicial ('lista' | 'calendario')
 */
function OtrosBloqueoTab({ initialView = 'lista' }) {
  // La vista se controla desde la navegación principal (StateNavTabs)
  const vistaActiva = initialView;
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo_bloqueo: '',
    profesional_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    solo_activos: true,
  });
  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null }, // { bloqueo, mode, fechaPreseleccionada }
    delete: { isOpen: false, data: null }, // bloqueo
    detalle: { isOpen: false, data: null }, // bloqueo
  });

  // Queries
  const { data: profesionalesData, isLoading: isLoadingProfesionales } = useProfesionales({
    activo: true,
  });
  const profesionales = profesionalesData?.profesionales || [];

  // Mutations
  const eliminarMutation = useEliminarBloqueo();

  // Construir params para la query - NO filtramos por origen en el API,
  // filtraremos en el frontend para excluir auto-generados
  const queryParams = useMemo(() => {
    const params = {};

    if (filtros.fecha_desde) params.fecha_inicio = filtros.fecha_desde;
    if (filtros.fecha_hasta) params.fecha_fin = filtros.fecha_hasta;
    if (filtros.tipo_bloqueo_id) params.tipo_bloqueo_id = filtros.tipo_bloqueo_id;
    if (filtros.profesional_id) params.profesional_id = parseInt(filtros.profesional_id);

    return params;
  }, [filtros]);

  const { data: bloqueos = [], isLoading: isLoadingBloqueos } = useBloqueos(queryParams);

  // Filtrar bloqueos: solo manuales (NO auto-generados)
  const bloqueosFiltrados = useMemo(() => {
    // Primero excluir auto-generados (vacaciones, incapacidad, feriados)
    const soloManuales = bloqueos.filter((b) => !esBloqueoAutoGenerado(b));

    // Luego aplicar filtros locales
    return filtrarBloqueos(soloManuales, {
      busqueda: filtros.busqueda,
      activo: filtros.solo_activos ? true : undefined,
    });
  }, [bloqueos, filtros.busqueda, filtros.solo_activos]);

  // Calcular estadísticas solo de bloqueos manuales
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
    openModal('form', { bloqueo: null, mode: 'crear', fechaPreseleccionada: null });
  };

  const handleCrearBloqueoDesdeCalendario = (fechaISO) => {
    openModal('form', { bloqueo: null, mode: 'crear', fechaPreseleccionada: fechaISO });
  };

  const handleVerBloqueo = (bloqueo) => {
    // Solo mostrar detalles si es bloqueo manual
    if (!esBloqueoAutoGenerado(bloqueo)) {
      openModal('detalle', bloqueo);
    }
  };

  const handleEditarBloqueo = (bloqueo) => {
    openModal('form', { bloqueo, mode: 'editar', fechaPreseleccionada: null });
  };

  const handleEliminarBloqueo = (bloqueo) => {
    openModal('delete', bloqueo);
  };

  const handleConfirmarEliminar = async () => {
    const bloqueoParaEliminar = getModalData('delete');
    if (!bloqueoParaEliminar) return;
    try {
      await eliminarMutation.mutateAsync(bloqueoParaEliminar.id);
      closeModal('delete');
    } catch (err) {
      console.error('Error al eliminar bloqueo:', err);
    }
  };

  const handleCerrarFormulario = () => {
    closeModal('form');
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de crear */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Lock className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Otros Bloqueos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mantenimiento, eventos especiales, emergencias
            </p>
          </div>
        </div>
        <Button
          onClick={handleNuevoBloqueo}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Bloqueo
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Total Bloqueos
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {estadisticas.totalBloqueos}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Días</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {estadisticas.totalDias}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Ingresos Perdidos
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(estadisticas.ingresosPerdidos)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Próximos 30 días
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {
                  bloqueosFiltrados.filter((b) => {
                    const hoy = new Date();
                    const fecha = new Date(b.fecha_inicio);
                    const treintaDias = new Date();
                    treintaDias.setDate(hoy.getDate() + 30);
                    return fecha >= hoy && fecha <= treintaDias;
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vista según navegación */}
      {vistaActiva === 'calendario' ? (
        <BloqueosCalendar
          profesionalId={filtros.profesional_id ? parseInt(filtros.profesional_id) : null}
          onVerBloqueo={handleVerBloqueo}
          onCrearBloqueo={handleCrearBloqueoDesdeCalendario}
        />
      ) : (
        <>
          {/* Filtros */}
          <BloqueoFilters
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onLimpiar={handleLimpiarFiltros}
            profesionales={profesionales}
            isLoadingProfesionales={isLoadingProfesionales}
          />

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

      {/* Modal de formulario */}
      <BloqueoFormDrawer
        isOpen={isOpen('form')}
        onClose={handleCerrarFormulario}
        bloqueo={getModalData('form')?.bloqueo}
        modo={getModalData('form')?.mode || 'crear'}
        fechaInicial={getModalData('form')?.fechaPreseleccionada}
      />

      {/* Modal de detalle */}
      <BloqueoDetailModal
        isOpen={isOpen('detalle')}
        onClose={() => closeModal('detalle')}
        bloqueo={getModalData('detalle')}
        onEditar={handleEditarBloqueo}
        onEliminar={handleEliminarBloqueo}
      />

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        title="Eliminar Bloqueo"
        size="md"
      >
        {getModalData('delete') && (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              ¿Estás seguro de que deseas eliminar el siguiente bloqueo?
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                {getModalData('delete')?.titulo}
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Tipo: {getModalData('delete')?.tipo_bloqueo}</p>
                <p>
                  Fecha: {getModalData('delete')?.fecha_inicio} - {getModalData('delete')?.fecha_fin}
                </p>
                {getModalData('delete')?.citas_afectadas > 0 && (
                  <p className="text-red-600 dark:text-red-400 font-medium mt-2">
                    Este bloqueo afecta {getModalData('delete')?.citas_afectadas} citas
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => closeModal('delete')}
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
  );
}

export default OtrosBloqueoTab;
