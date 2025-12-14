import { useState } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useCompletarCita } from '@/hooks/useCitas';
import { useToast } from '@/hooks/useToast';
import { formatearFecha, formatearHora } from '@/utils/dateHelpers';

/**
 * Modal especializado para completar citas
 * Permite agregar notas del profesional y calificación opcional
 */
function CompletarCitaModal({ isOpen, onClose, cita }) {
  const toast = useToast();
  const completarMutation = useCompletarCita();

  const [notasProfesional, setNotasProfesional] = useState('');
  const [comentarioCliente, setComentarioCliente] = useState('');
  const [calificacion, setCalificacion] = useState(0);

  if (!cita) return null;

  const handleCompletar = async () => {
    if (!notasProfesional.trim() && calificacion === 0) {
      toast.error('Agrega al menos notas del profesional o una calificación');
      return;
    }

    try {
      const data = {
        id: cita.id,
        notas_profesional: notasProfesional.trim() || undefined,
        comentario_profesional: comentarioCliente.trim() || undefined,
        calificacion_profesional: calificacion > 0 ? calificacion : undefined,
      };

      await completarMutation.mutateAsync(data);

      // Reset y cerrar
      setNotasProfesional('');
      setComentarioCliente('');
      setCalificacion(0);
      onClose();
    } catch {
      // El error ya se maneja en el hook
    }
  };

  const handleClose = () => {
    setNotasProfesional('');
    setComentarioCliente('');
    setCalificacion(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Completar Cita" size="large">
      <div className="space-y-6">
        {/* Header con ícono */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Completar Cita</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Agrega notas y calificación del servicio
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
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Servicio</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {cita.servicio_nombre || 'Sin servicio'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Profesional</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {cita.profesional_nombre || 'Sin asignar'}
              </p>
            </div>
          </div>
        </div>

        {/* Notas del Profesional */}
        <Textarea
          label="Notas del Profesional"
          required
          value={notasProfesional}
          onChange={(e) => setNotasProfesional(e.target.value)}
          placeholder="Describe cómo fue el servicio, detalles del trabajo realizado, observaciones..."
          rows={4}
          maxLength={500}
          showCharCount
        />

        {/* Comentario del Cliente (opcional) */}
        <Textarea
          label="Comentario del Cliente (Opcional)"
          value={comentarioCliente}
          onChange={(e) => setComentarioCliente(e.target.value)}
          placeholder="Si el cliente dejó algún comentario o feedback..."
          rows={3}
          maxLength={500}
          showCharCount
        />

        {/* Calificación del Cliente */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Star className="w-4 h-4" />
            Calificación del Servicio (Opcional)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCalificacion(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= calificacion
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
            {calificacion > 0 && (
              <button
                type="button"
                onClick={() => setCalificacion(0)}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Limpiar
              </button>
            )}
          </div>
          {calificacion > 0 && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Calificación: {calificacion} de 5 estrellas
            </p>
          )}
        </div>

        {/* Mensaje informativo */}
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <p className="text-sm text-primary-900 dark:text-primary-200">
            ℹ️ <strong>Nota:</strong> Al completar la cita, se registrará como finalizada y
            no podrá cambiar de estado. Asegúrate de que toda la información sea correcta.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={completarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCompletar}
            isLoading={completarMutation.isPending}
            disabled={completarMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {completarMutation.isPending ? 'Completando...' : 'Completar Cita'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CompletarCitaModal;
