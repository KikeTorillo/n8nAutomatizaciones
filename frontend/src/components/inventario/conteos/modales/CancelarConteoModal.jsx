import { XCircle } from 'lucide-react';
import { Button, Drawer, Textarea } from '@/components/ui';

/**
 * Modal para confirmar cancelación de conteo
 */
export default function CancelarConteoModal({
  isOpen,
  onClose,
  conteo,
  onConfirm,
  isLoading,
  motivo,
  onMotivoChange,
}) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Cancelar Conteo">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">
          ¿Deseas cancelar el conteo <strong>{conteo?.folio}</strong>?
        </p>
        <Textarea
          label="Motivo de cancelación (opcional)"
          value={motivo}
          onChange={(e) => onMotivoChange(e.target.value)}
          placeholder="Ingresa el motivo..."
          rows={3}
        />
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            <XCircle className="h-4 w-4 mr-1" />
            Cancelar Conteo
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
