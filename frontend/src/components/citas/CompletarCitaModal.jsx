import { useState } from 'react';
import { CheckCircle2, FileText, Star } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
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
        comentario_cliente: comentarioCliente.trim() || undefined,
        calificacion_cliente: calificacion > 0 ? calificacion : undefined,
      };

      await completarMutation.mutateAsync(data);

      // Reset y cerrar
      setNotasProfesional('');
      setComentarioCliente('');
      setCalificacion(0);
      onClose();
    } catch (error) {
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
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Completar Cita</h3>
            <p className="text-sm text-gray-600">
              Agrega notas y calificación del servicio
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
            <div>
              <p className="text-xs text-gray-600">Servicio</p>
              <p className="text-sm font-medium text-gray-900">
                {cita.servicio_nombre || 'Sin servicio'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Profesional</p>
              <p className="text-sm font-medium text-gray-900">
                {cita.profesional_nombre || 'Sin asignar'}
              </p>
            </div>
          </div>
        </div>

        {/* Notas del Profesional */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4" />
            Notas del Profesional <span className="text-red-500">*</span>
          </label>
          <textarea
            value={notasProfesional}
            onChange={(e) => setNotasProfesional(e.target.value)}
            placeholder="Describe cómo fue el servicio, detalles del trabajo realizado, observaciones..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">
            {notasProfesional.length}/500 caracteres
          </p>
        </div>

        {/* Comentario del Cliente (opcional) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4" />
            Comentario del Cliente (Opcional)
          </label>
          <textarea
            value={comentarioCliente}
            onChange={(e) => setComentarioCliente(e.target.value)}
            placeholder="Si el cliente dejó algún comentario o feedback..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">
            {comentarioCliente.length}/500 caracteres
          </p>
        </div>

        {/* Calificación del Cliente */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
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
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {calificacion > 0 && (
              <button
                type="button"
                onClick={() => setCalificacion(0)}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Limpiar
              </button>
            )}
          </div>
          {calificacion > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Calificación: {calificacion} de 5 estrellas
            </p>
          )}
        </div>

        {/* Mensaje informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            ℹ️ <strong>Nota:</strong> Al completar la cita, se registrará como finalizada y
            no podrá cambiar de estado. Asegúrate de que toda la información sea correcta.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
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
