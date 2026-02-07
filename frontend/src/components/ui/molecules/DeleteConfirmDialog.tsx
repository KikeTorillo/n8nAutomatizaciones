import { memo, forwardRef } from 'react';
import { ConfirmDialog } from '../organisms/ConfirmDialog';

/**
 * Props del componente DeleteConfirmDialog
 */
export interface DeleteConfirmDialogProps {
  /** Si el diálogo está abierto */
  isOpen: boolean;
  /** Callback para cerrar el diálogo */
  onClose: () => void;
  /** Callback al confirmar eliminación */
  onConfirm: () => void;
  /** Nombre del elemento a eliminar */
  itemName: string;
  /** Tipo de elemento (ej: 'producto', 'usuario') */
  itemType?: string;
  /** Descripción adicional del impacto */
  description?: string;
  /** Estado de carga del botón confirmar */
  isLoading?: boolean;
  /** Título personalizado (override) */
  title?: string;
  /** Mensaje personalizado (override) */
  message?: string;
  /** Texto botón confirmar */
  confirmText?: string;
  /** Texto botón cancelar */
  cancelText?: string;
}

/**
 * DeleteConfirmDialog - Diálogo especializado para confirmación de eliminación
 *
 * Wrapper sobre ConfirmDialog con configuración preestablecida para operaciones
 * de eliminación, reduciendo código repetitivo.
 */
const DeleteConfirmDialog = memo(
  forwardRef<HTMLDivElement, DeleteConfirmDialogProps>(function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'elemento',
  description,
  isLoading = false,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
}, ref) {
  // Generar título y mensaje automáticamente si no se proporcionan
  const dialogTitle = title || 'Confirmar eliminación';
  const dialogMessage =
    message ||
    `¿Estás seguro de eliminar ${itemType} "${itemName}"? Esta acción no se puede deshacer.${description ? ` ${description}` : ''}`;

  return (
    <div ref={ref}>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        title={dialogTitle}
        message={dialogMessage}
        confirmText={confirmText}
        cancelText={cancelText}
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  );
  })
);

DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';

export { DeleteConfirmDialog };
