import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

/**
 * Modal para confirmar completar conteo
 */
export default function CompletarConteoModal({
  isOpen,
  onClose,
  conteo,
  onConfirm,
  isLoading,
}) {
  const conDiferencia = conteo?.resumen?.con_diferencia || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Completar Conteo">
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          ¿Deseas completar el conteo <strong>{conteo?.folio}</strong>?
        </p>
        {conDiferencia > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Hay {conDiferencia} producto(s) con diferencia que generarán ajustes
              de inventario.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} isLoading={isLoading}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Completar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
