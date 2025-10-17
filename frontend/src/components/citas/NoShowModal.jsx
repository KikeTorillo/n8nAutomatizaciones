import { useState } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useNoShowCita } from '@/hooks/useCitas';
import { useToast } from '@/hooks/useToast';
import { formatearFecha, formatearHora } from '@/utils/dateHelpers';

/**
 * Modal especializado para marcar cita como No Show
 * Solicita el motivo obligatorio
 */
function NoShowModal({ isOpen, onClose, cita }) {
  const toast = useToast();
  const noShowMutation = useNoShowCita();

  const [motivo, setMotivo] = useState('');

  if (!cita) return null;

  const handleNoShow = async () => {
    if (!motivo.trim()) {
      toast.error('Debes indicar el motivo del No Show');
      return;
    }

    try {
      await noShowMutation.mutateAsync({
        id: cita.id,
        motivo: motivo.trim(),
      });

      // Reset y cerrar
      setMotivo('');
      onClose();
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Marcar como No Show">
      <div className="space-y-6">
        {/* Header con ícono */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cliente No Asistió</h3>
            <p className="text-sm text-gray-600">
              Registra el motivo por el que el cliente no llegó a la cita
            </p>
          </div>
        </div>

        {/* Información de la cita */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Código de Cita</p>
              <p className="text-sm font-medium text-gray-900">{cita.codigo_cita}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Cliente</p>
              <p className="text-sm font-medium text-gray-900">
                {cita.cliente_nombre || 'Sin nombre'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Fecha</p>
              <p className="text-sm font-medium text-gray-900">
                {formatearFecha(cita.fecha_cita, 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Hora</p>
              <p className="text-sm font-medium text-gray-900">
                {formatearHora(cita.hora_inicio)} - {formatearHora(cita.hora_fin)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-600">Servicio</p>
              <p className="text-sm font-medium text-gray-900">
                {cita.servicio_nombre || 'Sin servicio'}
              </p>
            </div>
          </div>
        </div>

        {/* Motivo del No Show */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4" />
            Motivo del No Show <span className="text-red-500">*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Cliente no llegó y no avisó, No contestó llamadas, Llegó 30 min tarde..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">{motivo.length}/500 caracteres</p>
        </div>

        {/* Sugerencias de motivos comunes */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Motivos comunes:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Cliente no llegó y no avisó',
              'No contestó llamadas de confirmación',
              'Llegó muy tarde y no se pudo atender',
              'Canceló en el último momento',
              'Emergencia personal',
            ].map((motivoComun) => (
              <button
                key={motivoComun}
                type="button"
                onClick={() => setMotivo(motivoComun)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {motivoComun}
              </button>
            ))}
          </div>
        </div>

        {/* Mensajes informativos */}
        <div className="space-y-3">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900">
              ⚠️ <strong>Importante:</strong> Al marcar como No Show, la cita se registrará
              como finalizada por inasistencia del cliente. Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Consejo:</strong> Considera contactar al cliente antes de marcar
              No Show para confirmar si tuvo algún inconveniente.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={noShowMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleNoShow}
            isLoading={noShowMutation.isPending}
            disabled={noShowMutation.isPending || !motivo.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {noShowMutation.isPending ? 'Registrando...' : 'Confirmar No Show'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default NoShowModal;
