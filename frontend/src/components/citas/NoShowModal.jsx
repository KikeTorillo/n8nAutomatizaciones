import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, Drawer, Textarea } from '@/components/ui';
import { useNoShowCita } from '@/hooks/agendamiento';
import { useToast } from '@/hooks/utils';
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
    } catch {
      // El error ya se maneja en el hook
    }
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Marcar como No Show">
      <div className="space-y-6">
        {/* Header con ícono */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cliente No Asistió</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Registra el motivo por el que el cliente no llegó a la cita
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

        {/* Motivo del No Show */}
        <Textarea
          label="Motivo del No Show"
          required
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: Cliente no llegó y no avisó, No contestó llamadas, Llegó 30 min tarde..."
          rows={4}
          maxLength={500}
          showCharCount
        />

        {/* Sugerencias de motivos comunes */}
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Motivos comunes:</p>
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
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
              >
                {motivoComun}
              </button>
            ))}
          </div>
        </div>

        {/* Mensajes informativos */}
        <div className="space-y-3">
          <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm text-orange-900 dark:text-orange-200">
              ⚠️ <strong>Importante:</strong> Al marcar como No Show, la cita se registrará
              como finalizada por inasistencia del cliente. Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <p className="text-sm text-primary-900 dark:text-primary-200">
              💡 <strong>Consejo:</strong> Considera contactar al cliente antes de marcar
              No Show para confirmar si tuvo algún inconveniente.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
    </Drawer>
  );
}

export default NoShowModal;
