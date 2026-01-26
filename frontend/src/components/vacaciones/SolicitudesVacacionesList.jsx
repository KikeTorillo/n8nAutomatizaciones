/**
 * SolicitudesVacacionesList - Lista de solicitudes de vacaciones
 * Fase 3 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState, memo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  X as XIcon
} from 'lucide-react';
import { Badge, Button, Pagination } from '@/components/ui';
import {
  useMisSolicitudesVacaciones,
  useCancelarSolicitud,
  getEstadoSolicitud,
  formatDias,
  ESTADOS_SOLICITUD
} from '@/hooks/personas';

/**
 * Formatea una fecha en formato legible
 */
function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatea rango de fechas
 */
function formatRangoFechas(fechaInicio, fechaFin, esMedioDia, turno) {
  if (esMedioDia) {
    const turnoLabel = turno === 'manana' ? 'mañana' : 'tarde';
    return `${formatFecha(fechaInicio)} (${turnoLabel})`;
  }

  if (fechaInicio === fechaFin) {
    return formatFecha(fechaInicio);
  }

  return `${formatFecha(fechaInicio)} - ${formatFecha(fechaFin)}`;
}

/**
 * Badge de estado de solicitud
 */
const EstadoBadge = memo(function EstadoBadge({ estado }) {
  const config = getEstadoSolicitud(estado);

  const colorMap = {
    yellow: 'warning',
    green: 'success',
    red: 'error',
    gray: 'default',
  };

  return (
    <Badge variant={colorMap[config.color] || 'default'}>
      {config.icon} {config.label}
    </Badge>
  );
});

/**
 * Tarjeta de solicitud individual
 */
const SolicitudCard = memo(function SolicitudCard({ solicitud, onVerDetalle, onCancelar }) {
  const [showMenu, setShowMenu] = useState(false);
  const esPendiente = solicitud.estado === 'pendiente';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-primary-500 flex-shrink-0" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatRangoFechas(
                solicitud.fecha_inicio,
                solicitud.fecha_fin,
                solicitud.es_medio_dia,
                solicitud.turno_medio_dia
              )}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDias(solicitud.dias_habiles)}
            </span>
            <span>
              Solicitado: {formatFecha(solicitud.creado_en)}
            </span>
          </div>

          {solicitud.motivo_solicitud && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {solicitud.motivo_solicitud}
            </p>
          )}

          {solicitud.motivo_rechazo && (
            <div className="mt-2 bg-red-50 dark:bg-red-900/20 rounded p-2">
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>Motivo del rechazo:</strong> {solicitud.motivo_rechazo}
              </p>
            </div>
          )}
        </div>

        {/* Estado y acciones */}
        <div className="flex items-center gap-2">
          <EstadoBadge estado={solicitud.estado} />

          {esPendiente && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[140px]">
                    <button
                      onClick={() => {
                        onVerDetalle(solicitud);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalle
                    </button>
                    <button
                      onClick={() => {
                        onCancelar(solicitud);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                    >
                      <XIcon className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Lista de solicitudes de vacaciones del usuario
 * @param {string} filtroEstado - Filtrar por estado
 * @param {number} anio - Año a consultar
 * @param {Function} onVerDetalle - Callback al ver detalle
 */
const SolicitudesVacacionesList = memo(function SolicitudesVacacionesList({
  filtroEstado = null,
  anio = null,
  onVerDetalle = () => {},
}) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const cancelarMutation = useCancelarSolicitud();

  const { data, isLoading, error } = useMisSolicitudesVacaciones({
    estado: filtroEstado,
    anio,
    page,
    limit,
  });

  const solicitudes = data?.data || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  const handleCancelar = async (solicitud) => {
    if (window.confirm('¿Estás seguro de cancelar esta solicitud de vacaciones?')) {
      await cancelarMutation.mutateAsync({
        id: solicitud.id,
        motivo: 'Cancelado por el solicitante',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
          >
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <span className="text-red-700 dark:text-red-300">
          Error al cargar solicitudes: {error.message}
        </span>
      </div>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No tienes solicitudes de vacaciones
          {filtroEstado && ` con estado "${getEstadoSolicitud(filtroEstado).label}"`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de solicitudes */}
      <div className="space-y-3">
        {solicitudes.map((solicitud) => (
          <SolicitudCard
            key={solicitud.id}
            solicitud={solicitud}
            onVerDetalle={onVerDetalle}
            onCancelar={handleCancelar}
          />
        ))}
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <Pagination
          pagination={{
            page,
            limit,
            total: pagination.total,
            totalPages: pagination.pages,
            hasNext: page < pagination.pages,
            hasPrev: page > 1,
          }}
          onPageChange={setPage}
        />
      )}
    </div>
  );
});

export default SolicitudesVacacionesList;
