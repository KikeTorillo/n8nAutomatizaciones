/**
 * SolicitudesEquipoSection - Vista de solicitudes de vacaciones del equipo
 * Para supervisores que necesitan aprobar/rechazar solicitudes
 * Fase 3 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState } from 'react';
import {
  Users, Calendar, Check, X, Eye, Loader2, AlertCircle,
  RefreshCw, User, Clock
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  Textarea
} from '@/components/ui';
import { useModalManager } from '@/hooks/utils';
import {
  useSolicitudesPendientes,
  useAprobarSolicitud,
  useRechazarSolicitud,
  getEstadoSolicitud,
  formatDias
} from '@/hooks/personas';

/**
 * Formatea una fecha en formato legible
 */
function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatea fecha corta
 */
function formatFechaCorta(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Tarjeta de solicitud pendiente
 */
function SolicitudCard({ solicitud, onAprobar, onRechazar, onVerDetalle }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Info del empleado */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {solicitud.profesional_nombre || 'Empleado'}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {solicitud.puesto_nombre || 'Sin puesto'}
            </p>
          </div>
        </div>

        {/* Badge de días */}
        <div className="text-right flex-shrink-0">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            {formatDias(solicitud.dias_habiles)}
          </span>
        </div>
      </div>

      {/* Fechas */}
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Calendar className="w-4 h-4 flex-shrink-0" />
        <span>
          {formatFechaCorta(solicitud.fecha_inicio)} — {formatFechaCorta(solicitud.fecha_fin)}
        </span>
      </div>

      {/* Motivo */}
      {solicitud.motivo_solicitud && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {solicitud.motivo_solicitud}
        </p>
      )}

      {/* Fecha de creación */}
      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        <span>Solicitado: {formatFecha(solicitud.creado_en)}</span>
      </div>

      {/* Acciones */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onVerDetalle(solicitud)}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRechazar(solicitud)}
          className="flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
        >
          <X className="w-4 h-4 mr-1" />
          Rechazar
        </Button>
        <Button
          size="sm"
          onClick={() => onAprobar(solicitud)}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Check className="w-4 h-4 mr-1" />
          Aprobar
        </Button>
      </div>
    </div>
  );
}

/**
 * Modal de detalle de solicitud
 */
function DetalleModal({ isOpen, onClose, solicitud, onAprobar, onRechazar }) {
  if (!solicitud) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Solicitud"
      size="md"
    >
      <div className="space-y-4">
        {/* Empleado */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {solicitud.profesional_nombre}
            </h3>
            <p className="text-sm text-gray-500">{solicitud.puesto_nombre}</p>
          </div>
        </div>

        {/* Período */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-primary-500" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Período Solicitado</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Inicio</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatFecha(solicitud.fecha_inicio)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Fin</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatFecha(solicitud.fecha_fin)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-sm text-gray-500">Días hábiles</span>
            <span className="font-bold text-lg text-primary-600">
              {formatDias(solicitud.dias_habiles)}
            </span>
          </div>
        </div>

        {/* Motivo */}
        {solicitud.motivo_solicitud && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo de la solicitud
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
              {solicitud.motivo_solicitud}
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cerrar
          </Button>
          <Button
            variant="outline"
            onClick={() => onRechazar(solicitud)}
            className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Rechazar
          </Button>
          <Button
            onClick={() => onAprobar(solicitud)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Aprobar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Modal de confirmación de aprobación
 */
function AprobarModal({ isOpen, onClose, solicitud, onConfirm, isLoading }) {
  const [notas, setNotas] = useState('');

  const handleConfirm = () => {
    onConfirm(solicitud.id, notas);
  };

  if (!solicitud) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aprobar Solicitud"
      size="sm"
      disableClose={isLoading}
    >
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <Check className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 dark:text-green-200 font-medium">
            Aprobar vacaciones de {solicitud.profesional_nombre}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            {formatFechaCorta(solicitud.fecha_inicio)} — {formatFechaCorta(solicitud.fecha_fin)} ({formatDias(solicitud.dias_habiles)})
          </p>
        </div>

        <Textarea
          label="Notas internas (opcional)"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Comentarios adicionales..."
          rows={2}
        />

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Aprobando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirmar Aprobación
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Modal de rechazo
 */
function RechazarModal({ isOpen, onClose, solicitud, onConfirm, isLoading }) {
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!motivo.trim()) {
      setError('El motivo de rechazo es obligatorio');
      return;
    }
    onConfirm(solicitud.id, motivo, notas);
  };

  if (!solicitud) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rechazar Solicitud"
      size="sm"
      disableClose={isLoading}
    >
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <X className="w-12 h-12 text-red-600 mx-auto mb-2" />
          <p className="text-red-800 dark:text-red-200 font-medium">
            Rechazar vacaciones de {solicitud.profesional_nombre}
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {formatFechaCorta(solicitud.fecha_inicio)} — {formatFechaCorta(solicitud.fecha_fin)}
          </p>
        </div>

        <Textarea
          label="Motivo del rechazo *"
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            if (error) setError('');
          }}
          placeholder="Explica el motivo del rechazo..."
          rows={3}
          error={error}
        />

        <Textarea
          label="Notas internas (opcional)"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Comentarios adicionales (no visibles para el empleado)..."
          rows={2}
        />

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rechazando...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Confirmar Rechazo
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Sección principal de solicitudes del equipo
 */
function SolicitudesEquipoSection() {
  // Gestión de modales con hook centralizado
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    detalle: { isOpen: false, data: null },
    aprobar: { isOpen: false, data: null },
    rechazar: { isOpen: false, data: null },
  });

  // Queries
  const { data, isLoading, error, refetch } = useSolicitudesPendientes();
  const aprobarMutation = useAprobarSolicitud();
  const rechazarMutation = useRechazarSolicitud();

  const solicitudes = data?.data || [];

  // Handlers
  const handleVerDetalle = (sol) => {
    openModal('detalle', sol);
  };

  const handleIniciarAprobar = (sol) => {
    closeModal('detalle');
    openModal('aprobar', sol);
  };

  const handleIniciarRechazar = (sol) => {
    closeModal('detalle');
    openModal('rechazar', sol);
  };

  const handleConfirmarAprobar = async (id, notas) => {
    try {
      await aprobarMutation.mutateAsync({ id, notas_internas: notas || undefined });
      closeModal('aprobar');
    } catch (err) {
      // El toast de error ya se muestra en el hook
    }
  };

  const handleConfirmarRechazar = async (id, motivo, notas) => {
    try {
      await rechazarMutation.mutateAsync({
        id,
        motivo_rechazo: motivo,
        notas_internas: notas || undefined
      });
      closeModal('rechazar');
    } catch (err) {
      // El toast de error ya se muestra en el hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary-500" />
            Solicitudes de Mi Equipo
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Revisa y gestiona las solicitudes de vacaciones de tu equipo
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300">
            Error al cargar solicitudes: {error.message}
          </p>
        </div>
      )}

      {/* Lista vacía */}
      {!isLoading && !error && solicitudes.length === 0 && (
        <EmptyState
          icon={Users}
          title="Sin solicitudes pendientes"
          description="No hay solicitudes de vacaciones de tu equipo esperando aprobación"
        />
      )}

      {/* Lista de solicitudes */}
      {!isLoading && !error && solicitudes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {solicitudes.map((sol) => (
            <SolicitudCard
              key={sol.id}
              solicitud={sol}
              onVerDetalle={handleVerDetalle}
              onAprobar={handleIniciarAprobar}
              onRechazar={handleIniciarRechazar}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <DetalleModal
        isOpen={isOpen('detalle')}
        onClose={() => closeModal('detalle')}
        solicitud={getModalData('detalle')}
        onAprobar={handleIniciarAprobar}
        onRechazar={handleIniciarRechazar}
      />

      <AprobarModal
        isOpen={isOpen('aprobar')}
        onClose={() => closeModal('aprobar')}
        solicitud={getModalData('aprobar')}
        onConfirm={handleConfirmarAprobar}
        isLoading={aprobarMutation.isPending}
      />

      <RechazarModal
        isOpen={isOpen('rechazar')}
        onClose={() => closeModal('rechazar')}
        solicitud={getModalData('rechazar')}
        onConfirm={handleConfirmarRechazar}
        isLoading={rechazarMutation.isPending}
      />
    </div>
  );
}

export default SolicitudesEquipoSection;
