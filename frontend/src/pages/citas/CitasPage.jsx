import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Plus, TrendingUp, Clock, CheckCircle, List, CalendarDays, FileSpreadsheet } from 'lucide-react';
import Button from '@/components/ui/Button';
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
import AgendamientoPageLayout from '@/components/agendamiento/AgendamientoPageLayout';
import { useModalManager } from '@/hooks/useModalManager';
import {
  useCitas,
  useCitasDelDia,
  useConfirmarCita,
  useIniciarCita,
} from '@/hooks/useCitas';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useServicios } from '@/hooks/useServicios';
import { useToast } from '@/hooks/useToast';

/**
 * Página principal de Gestión de Citas - FASE 1-4
 */
function CitasPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

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

  // Handler para exportar CSV
  const handleExportarCSV = () => {
    if (!citas || citas.length === 0) {
      toast.error('No hay citas para exportar');
      return;
    }

    try {
      const headers = [
        'Código',
        'Fecha',
        'Hora',
        'Cliente',
        'Teléfono',
        'Profesional',
        'Servicios',
        'Total',
        'Estado',
      ];

      const estadoLabels = {
        pendiente: 'Pendiente',
        confirmada: 'Confirmada',
        en_curso: 'En Curso',
        completada: 'Completada',
        cancelada: 'Cancelada',
        no_show: 'No Asistió',
      };

      const rows = citas.map((c) => {
        // Formatear fecha
        const fechaFormateada = c.fecha_cita
          ? format(new Date(c.fecha_cita.split('T')[0] + 'T12:00:00'), 'dd/MM/yyyy')
          : '';

        // Formatear hora
        const horaFormateada = c.hora_inicio || '';

        // Concatenar servicios
        const serviciosTexto = c.servicios?.map((s) => s.nombre).join(', ') || c.servicio_nombre || '';

        // Formatear total
        const totalFormateado = c.precio_total ? `$${Number(c.precio_total).toFixed(2)}` : '';

        return [
          c.codigo_cita || '',
          fechaFormateada,
          horaFormateada,
          c.cliente_nombre || '',
          c.cliente_telefono || '',
          c.profesional_nombre || '',
          serviciosTexto,
          totalFormateado,
          estadoLabels[c.estado] || c.estado || '',
        ];
      });

      // BOM para UTF-8 (Excel)
      const BOM = '\uFEFF';
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `citas_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success('Citas exportadas exitosamente');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      toast.error('Error al exportar CSV');
    }
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
    <AgendamientoPageLayout
      icon={Calendar}
      title="Gestión de Citas"
      subtitle="Administra y monitorea todas las citas de tu negocio"
      actions={
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="secondary"
            onClick={handleExportarCSV}
            disabled={!citas?.length}
            aria-label="Exportar citas a CSV"
            className="flex-1 sm:flex-none"
          >
            <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => handleNuevaCita()}
            aria-label="Crear nueva cita"
            className="flex-1 sm:flex-none"
          >
            <Plus className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Nueva Cita</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      }
    >
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
    </AgendamientoPageLayout>
  );
}

export default CitasPage;
