import { Save, Package } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

/**
 * Modal para confirmar aplicar ajustes de inventario
 */
export default function AplicarAjustesModal({
  isOpen,
  onClose,
  conteo,
  onConfirm,
  isLoading,
}) {
  const conDiferencia = conteo?.resumen?.con_diferencia || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aplicar Ajustes de Inventario"
    >
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          ¿Deseas aplicar los ajustes del conteo <strong>{conteo?.folio}</strong>?
        </p>
        <div className="flex items-start gap-2 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg mb-4">
          <Package className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
          <p className="text-sm text-primary-700 dark:text-primary-300">
            Se crearán movimientos de inventario para ajustar el stock de los{' '}
            {conDiferencia} producto(s) con diferencia.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} isLoading={isLoading}>
            <Save className="h-4 w-4 mr-1" />
            Aplicar Ajustes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
