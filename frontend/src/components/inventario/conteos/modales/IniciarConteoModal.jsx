import { Play } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

/**
 * Modal para confirmar inicio de conteo
 */
export default function IniciarConteoModal({
  isOpen,
  onClose,
  conteo,
  onConfirm,
  isLoading,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Iniciar Conteo">
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          ¿Deseas iniciar el conteo <strong>{conteo?.folio}</strong>?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Se generarán los productos a contar según los filtros configurados.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} isLoading={isLoading}>
            <Play className="h-4 w-4 mr-1" />
            Iniciar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
