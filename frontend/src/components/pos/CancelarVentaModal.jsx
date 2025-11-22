import { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import useAuthStore from '@/store/authStore';
import { useCancelarVenta } from '@/hooks/useVentas';

/**
 * Modal para cancelar una venta
 * Solicita motivo y revierte stock automáticamente
 */
export default function CancelarVentaModal({ isOpen, onClose, venta }) {
  const toast = useToast();
  const { user } = useAuthStore();
  const cancelarMutation = useCancelarVenta();

  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    const nuevosErrores = {};
    if (!motivo.trim()) {
      nuevosErrores.motivo = 'El motivo de cancelación es requerido';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    // Confirmar acción
    if (!window.confirm('¿Estás seguro de cancelar esta venta? Esta acción revertirá el stock automáticamente.')) {
      return;
    }

    try {
      await cancelarMutation.mutateAsync({
        id: venta.id,
        motivo: motivo.trim(),
        usuario_id: user.id,
      });

      toast.success('Venta cancelada exitosamente. Stock revertido.');
      handleClose();
    } catch (error) {
      console.error('Error al cancelar venta:', error);
      toast.error(error.response?.data?.mensaje || 'Error al cancelar la venta');
    }
  };

  const handleClose = () => {
    setMotivo('');
    setErrores({});
    onClose();
  };

  if (!isOpen || !venta) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header personalizado */}
        <div className="flex items-start gap-3">
          <div className="bg-red-100 p-3 rounded-lg">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Cancelar Venta</h2>
            <p className="text-sm text-gray-500 mt-1">
              Folio: <span className="font-semibold text-gray-900">{venta.folio}</span>
            </p>
          </div>
        </div>

        {/* Advertencia */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Advertencia importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Esta acción cancelará la venta permanentemente</li>
                <li>El stock de los productos se revertirá automáticamente</li>
                <li>Se registrará un movimiento de reversión en el inventario</li>
                <li>Esta acción no se puede deshacer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Información de la venta */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total de la venta:</span>
            <span className="font-semibold text-gray-900">
              ${parseFloat(venta.total || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Método de pago:</span>
            <span className="font-medium text-gray-900">
              {venta.metodo_pago === 'efectivo' ? 'Efectivo' :
               venta.metodo_pago === 'tarjeta' ? 'Tarjeta' :
               venta.metodo_pago === 'transferencia' ? 'Transferencia' :
               venta.metodo_pago === 'qr' ? 'QR Mercado Pago' :
               venta.metodo_pago}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium text-gray-900">
              {venta.cliente_nombre || 'Venta directa'}
            </span>
          </div>
        </div>

        {/* Motivo de cancelación */}
        <div>
          <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de Cancelación <span className="text-red-500">*</span>
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (errores.motivo) {
                setErrores({ ...errores, motivo: null });
              }
            }}
            rows={4}
            className={`w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
              errores.motivo ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe el motivo de la cancelación (ej: Error en el registro, Cliente solicitó cancelación, etc.)"
          />
          {errores.motivo && (
            <p className="mt-1 text-sm text-red-600">{errores.motivo}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Este motivo quedará registrado en el historial de la venta
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={cancelarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={cancelarMutation.isPending}
            icon={XCircle}
          >
            {cancelarMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
