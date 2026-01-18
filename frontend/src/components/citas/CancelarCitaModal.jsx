import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, XCircle } from 'lucide-react';
import { Button, Drawer, Textarea } from '@/components/ui';
import { useCancelarCita } from '@/hooks/agendamiento';
import { formatearFecha, formatearHora } from '@/utils/dateHelpers';
import { useToast } from '@/hooks/utils';

/**
 * Modal especializado para cancelar citas
 * Solicita el motivo obligatorio de cancelación
 */
function CancelarCitaModal({ isOpen, onClose, cita = null }) {
  const cancelarMutation = useCancelarCita();
  const toast = useToast();

  const [motivo, setMotivo] = useState('');

  if (!cita) return null;

  const handleCancelar = async () => {
    if (!motivo.trim()) {
      return;
    }

    try {
      await cancelarMutation.mutateAsync({
        id: cita.id,
        motivo_cancelacion: motivo.trim(),
      });

      // Reset y cerrar
      setMotivo('');
      onClose();
    } catch (error) {
      toast.error('Error al cancelar: ' + (error.response?.data?.message || error.message || 'Intente de nuevo'));
    }
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Cancelar Cita">
      <div className="space-y-6">
        {/* Header con ícono */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">¿Cancelar esta cita?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta acción notificará al cliente y liberará el horario
            </p>
          </div>
        </div>

        {/* Información de la cita */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Código de Cita</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cita.codigo_cita}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Cliente</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {cita.cliente_nombre || 'Sin nombre'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Fecha</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatearFecha(cita.fecha_cita, 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Hora</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatearHora(cita.hora_inicio)} - {formatearHora(cita.hora_fin)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">Servicio</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {cita.servicio_nombre || 'Sin servicio'}
              </p>
            </div>
          </div>
        </div>

        {/* Motivo de cancelación */}
        <Textarea
          label="Motivo de cancelación"
          required
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: Solicitud del cliente, Cambio de horario, Emergencia..."
          rows={4}
          maxLength={500}
          showCharCount
        />

        {/* Sugerencias de motivos comunes */}
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Motivos comunes:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Solicitud del cliente',
              'Profesional no disponible',
              'Reprogramación solicitada',
              'Emergencia del cliente',
              'Error en la reserva',
            ].map((motivoComun) => (
              <button
                key={motivoComun}
                type="button"
                onClick={() => setMotivo(motivoComun)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
              >
                {motivoComun}
              </button>
            ))}
          </div>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-900 dark:text-red-200">
              <strong>Importante:</strong> Al cancelar esta cita, el horario quedará disponible
              para otras reservas. El cliente será notificado automáticamente si tiene configuradas
              las notificaciones.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={cancelarMutation.isPending}
          >
            Volver
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleCancelar}
            isLoading={cancelarMutation.isPending}
            disabled={cancelarMutation.isPending || !motivo.trim()}
          >
            {cancelarMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

CancelarCitaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cita: PropTypes.shape({
    id: PropTypes.number,
    codigo_cita: PropTypes.string,
    cliente_nombre: PropTypes.string,
    fecha_cita: PropTypes.string,
    hora_inicio: PropTypes.string,
    hora_fin: PropTypes.string,
    servicio_nombre: PropTypes.string,
  }),
};

export default CancelarCitaModal;
