/**
 * SolicitudVacacionesQuickView - Modal de detalle con acciones rápidas
 * Permite aprobar/rechazar si el usuario tiene permisos y solicitud está pendiente
 * Ene 2026: Calendario de Equipo para competir con Odoo
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { User, Calendar, Check, X, Loader2, Building } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import {
  useAprobarSolicitud,
  useRechazarSolicitud,
  getEstadoSolicitud,
  formatDias,
} from '@/hooks/useVacaciones';

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Colores de badge por estado
const badgeColors = {
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  aprobada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rechazada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  cancelada: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

function SolicitudVacacionesQuickView({ isOpen, onClose, solicitud = null }) {
  const [modoRechazo, setModoRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const aprobarMutation = useAprobarSolicitud();
  const rechazarMutation = useRechazarSolicitud();

  // Reset estado al cerrar
  const handleClose = () => {
    setModoRechazo(false);
    setMotivoRechazo('');
    onClose();
  };

  if (!solicitud) return null;

  const estadoConfig = getEstadoSolicitud(solicitud.estado);
  const esPendiente = solicitud.estado === 'pendiente';

  const handleAprobar = async () => {
    await aprobarMutation.mutateAsync({ id: solicitud.id });
    handleClose();
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) return;
    await rechazarMutation.mutateAsync({
      id: solicitud.id,
      motivo_rechazo: motivoRechazo,
    });
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Detalle de Solicitud" size="md">
      <div className="space-y-4">
        {/* Header con empleado y estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {solicitud.profesional_nombre || 'Sin nombre'}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Building className="w-3 h-3" />
                <span>{solicitud.departamento_nombre || 'Sin departamento'}</span>
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badgeColors[solicitud.estado]}`}
          >
            {estadoConfig.icon} {estadoConfig.label}
          </span>
        </div>

        {/* Período */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-primary-500" />
            <span className="font-medium text-gray-900 dark:text-gray-100">Período</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Inicio:</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatFecha(solicitud.fecha_inicio)}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Fin:</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatFecha(solicitud.fecha_fin)}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Días solicitados</span>
            <span className="font-bold text-primary-600 dark:text-primary-400">
              {formatDias(solicitud.dias_solicitados)}
            </span>
          </div>
        </div>

        {/* Código de solicitud */}
        {solicitud.codigo && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Código: </span>
            <span className="font-mono text-gray-700 dark:text-gray-300">{solicitud.codigo}</span>
          </div>
        )}

        {/* Motivo de solicitud */}
        {solicitud.motivo_solicitud && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Motivo:</span>
            <p className="mt-1 text-gray-700 dark:text-gray-300">{solicitud.motivo_solicitud}</p>
          </div>
        )}

        {/* Motivo de rechazo (si fue rechazada) */}
        {solicitud.estado === 'rechazada' && solicitud.motivo_rechazo && (
          <div className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <span className="text-red-600 dark:text-red-400 font-medium">Motivo de rechazo:</span>
            <p className="mt-1 text-red-700 dark:text-red-300">{solicitud.motivo_rechazo}</p>
          </div>
        )}

        {/* Modo rechazo - campo de texto */}
        {modoRechazo && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo del rechazo *
            </label>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Explica el motivo del rechazo..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cerrar
          </Button>

          {esPendiente && !modoRechazo && (
            <>
              <Button
                variant="outline"
                onClick={() => setModoRechazo(true)}
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4 mr-1" />
                Rechazar
              </Button>
              <Button
                onClick={handleAprobar}
                disabled={aprobarMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {aprobarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Aprobar
              </Button>
            </>
          )}

          {modoRechazo && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setModoRechazo(false);
                  setMotivoRechazo('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRechazar}
                disabled={rechazarMutation.isPending || !motivoRechazo.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {rechazarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <X className="w-4 h-4 mr-1" />
                )}
                Confirmar Rechazo
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

SolicitudVacacionesQuickView.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  solicitud: PropTypes.shape({
    id: PropTypes.number,
    codigo: PropTypes.string,
    profesional_nombre: PropTypes.string,
    departamento_nombre: PropTypes.string,
    fecha_inicio: PropTypes.string,
    fecha_fin: PropTypes.string,
    dias_solicitados: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    estado: PropTypes.string,
    motivo_solicitud: PropTypes.string,
    motivo_rechazo: PropTypes.string,
  }),
};

export default SolicitudVacacionesQuickView;
