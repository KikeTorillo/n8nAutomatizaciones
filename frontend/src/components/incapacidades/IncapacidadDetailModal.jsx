/**
 * IncapacidadDetailModal - Modal de detalle de incapacidad
 * Módulo de Profesionales - Enero 2026
 */
import { useState } from 'react';
import {
  HeartPulse,
  Calendar,
  Clock,
  User,
  FileText,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Plus,
  X,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  useFinalizarIncapacidad,
  useCancelarIncapacidad,
  getTipoIncapacidadConfig,
  getEstadoIncapacidadConfig,
  formatDiasIncapacidad,
} from '@/hooks/useIncapacidades';
import ProrrogaModal from './ProrrogaModal';

/**
 * Formatea fecha completa
 */
function formatFechaCompleta(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Fila de información
 */
function InfoRow({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

/**
 * Modal de detalle de incapacidad con acciones
 */
function IncapacidadDetailModal({ isOpen, onClose, incapacidad }) {
  const [showProrrogaModal, setShowProrrogaModal] = useState(false);
  const [showFinalizarConfirm, setShowFinalizarConfirm] = useState(false);
  const [showCancelarConfirm, setShowCancelarConfirm] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  const finalizarMutation = useFinalizarIncapacidad();
  const cancelarMutation = useCancelarIncapacidad();

  if (!incapacidad) return null;

  const tipoConfig = getTipoIncapacidadConfig(incapacidad.tipo_incapacidad);
  const estadoConfig = getEstadoIncapacidadConfig(incapacidad.estado);
  const esActiva = incapacidad.estado === 'activa';
  const esProrroga = !!incapacidad.incapacidad_origen_id;

  // Calcular días restantes
  const hoy = new Date();
  const fechaFin = new Date(incapacidad.fecha_fin);
  const diasRestantes = Math.max(0, Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24)));

  const handleFinalizar = async () => {
    try {
      await finalizarMutation.mutateAsync({
        id: incapacidad.id,
        data: { fecha_reincorporacion: new Date().toISOString().split('T')[0] },
      });
      setShowFinalizarConfirm(false);
      onClose();
    } catch (error) {
      // Error manejado por hook
    }
  };

  const handleCancelar = async () => {
    if (!motivoCancelacion.trim()) return;
    try {
      await cancelarMutation.mutateAsync({
        id: incapacidad.id,
        motivo_cancelacion: motivoCancelacion,
      });
      setShowCancelarConfirm(false);
      setMotivoCancelacion('');
      onClose();
    } catch (error) {
      // Error manejado por hook
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Detalle de Incapacidad"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header con estado */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${tipoConfig.bgColor}`}>
                <HeartPulse className={`h-6 w-6 ${tipoConfig.textColor}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {incapacidad.codigo}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoConfig.bgColor} ${tipoConfig.textColor}`}>
                    {tipoConfig.label}
                  </span>
                  {esProrroga && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Prórroga
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Badge variant={estadoConfig.color === 'green' ? 'success' : estadoConfig.color === 'red' ? 'error' : 'default'}>
              {estadoConfig.label}
            </Badge>
          </div>

          {/* Información del profesional */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <InfoRow
              icon={User}
              label="Profesional"
              value={incapacidad.profesional_nombre ||
                     incapacidad.profesional?.nombre_completo ||
                     'Sin profesional'}
            />
          </div>

          {/* Grid de información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow
              icon={FileText}
              label="Folio IMSS"
              value={incapacidad.folio_imss}
            />
            <InfoRow
              icon={Clock}
              label="Días autorizados"
              value={formatDiasIncapacidad(incapacidad.dias_autorizados)}
            />
            <InfoRow
              icon={Calendar}
              label="Fecha de inicio"
              value={formatFechaCompleta(incapacidad.fecha_inicio)}
            />
            <InfoRow
              icon={Calendar}
              label="Fecha de fin"
              value={formatFechaCompleta(incapacidad.fecha_fin)}
            />
          </div>

          {/* Días restantes (si está activa) */}
          {esActiva && (
            <div className={`rounded-lg p-4 ${diasRestantes > 7 ? 'bg-green-50 dark:bg-green-900/20' : diasRestantes > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div className="flex items-center gap-3">
                <Clock className={`h-5 w-5 ${diasRestantes > 7 ? 'text-green-500' : diasRestantes > 0 ? 'text-amber-500' : 'text-red-500'}`} />
                <div>
                  <p className={`text-sm ${diasRestantes > 7 ? 'text-green-700 dark:text-green-300' : diasRestantes > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'}`}>
                    {diasRestantes > 0
                      ? `${diasRestantes} días restantes`
                      : 'Incapacidad vencida'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Diagnóstico */}
          {incapacidad.diagnostico && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Diagnóstico
              </h4>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                {incapacidad.diagnostico}
              </p>
            </div>
          )}

          {/* Notas */}
          {incapacidad.notas && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas internas
              </h4>
              <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                {incapacidad.notas}
              </p>
            </div>
          )}

          {/* Motivo de cancelación */}
          {incapacidad.motivo_cancelacion && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Motivo de cancelación
              </h4>
              <p className="text-red-700 dark:text-red-300">
                {incapacidad.motivo_cancelacion}
              </p>
            </div>
          )}

          {/* Acciones (solo si está activa) */}
          {esActiva && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowProrrogaModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Prórroga
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFinalizarConfirm(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Anticipadamente
              </Button>
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => setShowCancelarConfirm(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Incapacidad
              </Button>
            </div>
          )}

          {/* Botón cerrar */}
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>

        {/* Confirmación finalizar */}
        {showFinalizarConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Finalizar Incapacidad
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                ¿Estás seguro de finalizar esta incapacidad anticipadamente?
                El profesional volverá a estar disponible para citas.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowFinalizarConfirm(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinalizar}
                  loading={finalizarMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmación cancelar */}
        {showCancelarConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Cancelar Incapacidad
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Por favor ingresa el motivo de la cancelación:
              </p>
              <textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                rows={3}
                placeholder="Motivo de cancelación..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => {
                  setShowCancelarConfirm(false);
                  setMotivoCancelacion('');
                }}>
                  Volver
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancelar}
                  disabled={!motivoCancelacion.trim()}
                  loading={cancelarMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Incapacidad
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de prórroga */}
      <ProrrogaModal
        isOpen={showProrrogaModal}
        onClose={() => setShowProrrogaModal(false)}
        incapacidadOrigen={incapacidad}
      />
    </>
  );
}

export default IncapacidadDetailModal;
