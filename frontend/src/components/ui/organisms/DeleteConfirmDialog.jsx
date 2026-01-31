import { memo } from 'react';
import PropTypes from 'prop-types';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * DeleteConfirmDialog - Diálogo especializado para confirmación de eliminación
 *
 * Wrapper sobre ConfirmDialog con configuración preestablecida para operaciones
 * de eliminación, reduciendo código repetitivo.
 *
 * @example
 * <DeleteConfirmDialog
 *   isOpen={isOpen('delete')}
 *   onClose={() => closeModal('delete')}
 *   onConfirm={handleEliminar}
 *   itemName="Producto ABC"
 *   itemType="producto"
 *   description="Se eliminarán 5 variantes asociadas."
 *   isLoading={mutation.isPending}
 * />
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el diálogo está abierto
 * @param {Function} props.onClose - Callback para cerrar el diálogo
 * @param {Function} props.onConfirm - Callback al confirmar eliminación
 * @param {string} props.itemName - Nombre del elemento a eliminar
 * @param {string} [props.itemType] - Tipo de elemento (ej: 'producto', 'usuario')
 * @param {string} [props.description] - Descripción adicional del impacto
 * @param {boolean} [props.isLoading] - Estado de carga del botón confirmar
 * @param {string} [props.title] - Título personalizado (override)
 * @param {string} [props.message] - Mensaje personalizado (override)
 * @param {string} [props.confirmText] - Texto botón confirmar (default: 'Eliminar')
 * @param {string} [props.cancelText] - Texto botón cancelar (default: 'Cancelar')
 */
const DeleteConfirmDialog = memo(function DeleteConfirmDialog({
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
}) {
  // Generar título y mensaje automáticamente si no se proporcionan
  const dialogTitle = title || 'Confirmar eliminación';
  const dialogMessage = message || (
    `¿Estás seguro de eliminar ${itemType} "${itemName}"? Esta acción no se puede deshacer.${description ? ` ${description}` : ''}`
  );

  return (
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
  );
});

DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';

DeleteConfirmDialog.propTypes = {
  /** Si el diálogo está abierto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback para cerrar el diálogo */
  onClose: PropTypes.func.isRequired,
  /** Callback al confirmar eliminación */
  onConfirm: PropTypes.func.isRequired,
  /** Nombre del elemento a eliminar */
  itemName: PropTypes.string.isRequired,
  /** Tipo de elemento (ej: 'producto', 'usuario') */
  itemType: PropTypes.string,
  /** Descripción adicional del impacto */
  description: PropTypes.string,
  /** Estado de carga del botón confirmar */
  isLoading: PropTypes.bool,
  /** Título personalizado (override) */
  title: PropTypes.string,
  /** Mensaje personalizado (override) */
  message: PropTypes.string,
  /** Texto botón confirmar */
  confirmText: PropTypes.string,
  /** Texto botón cancelar */
  cancelText: PropTypes.string,
};

export { DeleteConfirmDialog };
