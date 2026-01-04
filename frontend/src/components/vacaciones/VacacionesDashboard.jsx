/**
 * VacacionesDashboard - Panel principal de vacaciones del usuario
 * Fase 3 del Plan de Empleados Competitivo - Enero 2026
 * BUG-002 FIX: Implementar modal Ver Detalle de solicitud
 */
import { useState } from 'react';
import { Plus, Calendar, Filter, RefreshCw, Clock, User, FileText, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  useDashboardVacaciones,
  usePoliticaVacaciones,
  getEstadoSolicitud,
  formatDias,
  ESTADOS_SOLICITUD
} from '@/hooks/useVacaciones';
import SaldoVacacionesCard from './SaldoVacacionesCard';
import SolicitudVacacionesModal from './SolicitudVacacionesModal';
import SolicitudesVacacionesList from './SolicitudesVacacionesList';

/**
 * Formatea una fecha en formato legible
 */
function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Badge de estado de solicitud
 */
function EstadoBadge({ estado }) {
  const config = getEstadoSolicitud(estado);
  const colorMap = {
    yellow: 'warning',
    green: 'success',
    red: 'error',
    gray: 'default',
  };
  return (
    <Badge variant={colorMap[config.color] || 'default'} size="lg">
      {config.icon} {config.label}
    </Badge>
  );
}

/**
 * Tab de filtro por estado
 */
function FiltroEstadoTab({ label, value, count, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`
          ml-2 px-2 py-0.5 text-xs rounded-full
          ${isActive
            ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Dashboard de vacaciones del usuario
 * Muestra saldo, solicitudes y permite crear nuevas
 */
function VacacionesDashboard() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState(null);
  // BUG-002 FIX: Estados para modal de detalle
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const anioActual = new Date().getFullYear();

  // BUG-002 FIX: Handler para ver detalle de solicitud
  const handleVerDetalle = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalDetalle(true);
  };

  const handleCerrarDetalle = () => {
    setModalDetalle(false);
    setSolicitudSeleccionada(null);
  };

  // Queries
  const { data: dashboard, isLoading: loadingDashboard, refetch } = useDashboardVacaciones(anioActual);
  const { data: politica } = usePoliticaVacaciones();

  const saldo = dashboard?.saldo;
  const nivel = dashboard?.nivel;
  const conteos = dashboard?.conteos || {};

  // Días mínimos de anticipación de la política
  const diasAnticipacion = politica?.dias_anticipacion_minimos || 7;

  // Días disponibles
  const diasDisponibles = saldo ? parseFloat(saldo.dias_pendientes) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary-500" />
            Mis Vacaciones
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona tus días de descanso
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setModalAbierto(true)}
            disabled={diasDisponibles <= 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* Tarjeta de saldo */}
      <SaldoVacacionesCard
        saldo={saldo}
        nivel={nivel}
        isLoading={loadingDashboard}
      />

      {/* Sección de solicitudes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Tabs de filtro */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />

          <FiltroEstadoTab
            label="Todas"
            value={null}
            isActive={filtroEstado === null}
            onClick={setFiltroEstado}
          />

          <FiltroEstadoTab
            label="Pendientes"
            value="pendiente"
            count={conteos.pendientes}
            isActive={filtroEstado === 'pendiente'}
            onClick={setFiltroEstado}
          />

          <FiltroEstadoTab
            label="Aprobadas"
            value="aprobada"
            count={conteos.aprobadas}
            isActive={filtroEstado === 'aprobada'}
            onClick={setFiltroEstado}
          />

          <FiltroEstadoTab
            label="Rechazadas"
            value="rechazada"
            isActive={filtroEstado === 'rechazada'}
            onClick={setFiltroEstado}
          />

          <FiltroEstadoTab
            label="Canceladas"
            value="cancelada"
            isActive={filtroEstado === 'cancelada'}
            onClick={setFiltroEstado}
          />
        </div>

        {/* Lista de solicitudes */}
        <div className="p-4">
          <SolicitudesVacacionesList
            filtroEstado={filtroEstado}
            anio={anioActual}
            onVerDetalle={handleVerDetalle}
          />
        </div>
      </div>

      {/* Modal de nueva solicitud */}
      <SolicitudVacacionesModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        diasDisponibles={diasDisponibles}
        diasAnticipacionMinimos={diasAnticipacion}
      />

      {/* BUG-002 FIX: Modal de detalle de solicitud */}
      <Modal
        isOpen={modalDetalle}
        onClose={handleCerrarDetalle}
        title="Detalle de Solicitud"
        size="md"
      >
        {solicitudSeleccionada && (
          <div className="space-y-6">
            {/* Estado */}
            <div className="flex justify-center">
              <EstadoBadge estado={solicitudSeleccionada.estado} />
            </div>

            {/* Código de solicitud */}
            {solicitudSeleccionada.codigo && (
              <div className="text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Código: <span className="font-mono font-medium">{solicitudSeleccionada.codigo}</span>
                </span>
              </div>
            )}

            {/* Período */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-primary-500" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Período Solicitado</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha Inicio</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatFecha(solicitudSeleccionada.fecha_inicio)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha Fin</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatFecha(solicitudSeleccionada.fecha_fin)}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Días hábiles</span>
                  <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
                    {formatDias(solicitudSeleccionada.dias_habiles)}
                  </span>
                </div>
                {solicitudSeleccionada.es_medio_dia && (
                  <p className="text-xs text-gray-500 mt-1">
                    Turno: {solicitudSeleccionada.turno_medio_dia === 'manana' ? 'Mañana' : 'Tarde'}
                  </p>
                )}
              </div>
            </div>

            {/* Motivo de solicitud */}
            {solicitudSeleccionada.motivo_solicitud && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo de la solicitud</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  {solicitudSeleccionada.motivo_solicitud}
                </p>
              </div>
            )}

            {/* Info de aprobación/rechazo */}
            {(solicitudSeleccionada.estado === 'aprobada' || solicitudSeleccionada.estado === 'rechazada') && (
              <div className={`rounded-lg p-4 ${
                solicitudSeleccionada.estado === 'aprobada'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <h4 className="text-sm font-medium">
                    {solicitudSeleccionada.estado === 'aprobada' ? 'Aprobado por' : 'Rechazado por'}
                  </h4>
                </div>
                {solicitudSeleccionada.aprobador_nombre && (
                  <p className="text-sm font-medium">{solicitudSeleccionada.aprobador_nombre}</p>
                )}
                {solicitudSeleccionada.fecha_decision && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFecha(solicitudSeleccionada.fecha_decision)}
                  </p>
                )}
                {solicitudSeleccionada.motivo_rechazo && (
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      Motivo del rechazo:
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {solicitudSeleccionada.motivo_rechazo}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fechas de auditoría */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span>Creado: {formatFecha(solicitudSeleccionada.creado_en)}</span>
              {solicitudSeleccionada.actualizado_en !== solicitudSeleccionada.creado_en && (
                <span>Actualizado: {formatFecha(solicitudSeleccionada.actualizado_en)}</span>
              )}
            </div>

            {/* Botón cerrar */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleCerrarDetalle}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VacacionesDashboard;
