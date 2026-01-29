import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Edit2, Trash2, Eye, BarChart3, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { DropdownMenu } from '../molecules/DropdownMenu';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * StandardRowActions - Acciones estándar para filas de tablas
 *
 * Componente reutilizable que proporciona acciones comunes para filas de tablas:
 * editar, eliminar, ver detalle, estadísticas. Soporta modo compacto (dropdown)
 * y confirmación antes de eliminar.
 *
 * @param {Object} row - Objeto de la fila
 * @param {function} onEdit - Handler para editar
 * @param {function} onDelete - Handler para eliminar
 * @param {function} onView - Handler para ver detalle
 * @param {function} onStats - Handler para estadísticas
 * @param {boolean} canEdit - Si tiene permiso de editar (default: true)
 * @param {boolean} canDelete - Si tiene permiso de eliminar (default: true)
 * @param {boolean} compact - Usar dropdown en lugar de botones (default: false)
 * @param {boolean} confirmDelete - Mostrar confirmación antes de eliminar (default: true)
 * @param {string} deleteMessage - Mensaje de confirmación de eliminación
 * @param {string} entityName - Nombre de la entidad para el mensaje de confirmación
 * @param {Array} extraActions - Acciones adicionales [{icon, label, onClick, show, loading, disabled}]
 * @param {string} size - Tamaño de botones: 'xs' | 'sm' (default: 'sm')
 * @param {string} className - Clases adicionales
 *
 * @example
 * // Uso básico
 * <StandardRowActions
 *   row={cliente}
 *   onEdit={() => handleEdit(cliente)}
 *   onDelete={() => handleDelete(cliente.id)}
 * />
 *
 * @example
 * // Modo compacto con dropdown
 * <StandardRowActions
 *   row={producto}
 *   compact
 *   onEdit={() => editarProducto(producto)}
 *   onDelete={() => eliminarProducto(producto.id)}
 *   onView={() => navigate(`/productos/${producto.id}`)}
 *   entityName="producto"
 * />
 *
 * @example
 * // Con acciones extra
 * <StandardRowActions
 *   row={orden}
 *   onEdit={handleEdit}
 *   extraActions={[
 *     { icon: Download, label: 'Descargar PDF', onClick: () => descargarPDF(orden.id) },
 *     { icon: Copy, label: 'Duplicar', onClick: () => duplicar(orden.id), show: orden.puede_duplicar },
 *   ]}
 * />
 */
const StandardRowActions = memo(function StandardRowActions({
  row,
  onEdit,
  onDelete,
  onView,
  onStats,
  canEdit = true,
  canDelete = true,
  compact = false,
  confirmDelete = true,
  deleteMessage,
  entityName = 'registro',
  extraActions = [],
  size = 'sm',
  className,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      setShowDeleteConfirm(true);
    } else {
      handleConfirmDelete();
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(row);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Construir lista de acciones para dropdown
  const dropdownActions = [
    onView && { icon: Eye, label: 'Ver detalle', onClick: () => onView(row) },
    onEdit && canEdit && { icon: Edit2, label: 'Editar', onClick: () => onEdit(row) },
    onStats && { icon: BarChart3, label: 'Estadísticas', onClick: () => onStats(row) },
    ...extraActions.filter(a => a.show !== false).map(a => ({
      icon: a.icon,
      label: a.label,
      onClick: () => a.onClick?.(row),
      disabled: a.disabled || a.loading,
    })),
    onDelete && canDelete && { icon: Trash2, label: 'Eliminar', onClick: handleDeleteClick, variant: 'danger' },
  ].filter(Boolean);

  // Modo compacto: dropdown con todas las acciones
  if (compact) {
    return (
      <>
        <DropdownMenu
          trigger={
            <Button
              variant="ghost"
              size={size}
              className="p-1"
              aria-label="Más acciones"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          }
          items={dropdownActions.map(action => ({
            label: action.label,
            icon: action.icon,
            onClick: action.onClick,
            className: action.variant === 'danger' ? 'text-red-600 dark:text-red-400' : undefined,
          }))}
          align="end"
        />

        {confirmDelete && onDelete && canDelete && (
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleConfirmDelete}
            title={`Eliminar ${entityName}`}
            message={deleteMessage || `¿Estás seguro de que deseas eliminar este ${entityName}? Esta acción no se puede deshacer.`}
            confirmLabel="Eliminar"
            variant="danger"
            isLoading={isDeleting}
          />
        )}
      </>
    );
  }

  // Modo normal: botones inline
  const buttonSize = size === 'xs' ? 'xs' : 'sm';
  const iconSize = size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <>
      <div className={cn('flex items-center gap-1', className)}>
        {onView && (
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={() => onView(row)}
            className="p-1.5"
            aria-label="Ver detalle"
            title="Ver detalle"
          >
            <Eye className={iconSize} />
          </Button>
        )}

        {onEdit && canEdit && (
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={() => onEdit(row)}
            className="p-1.5"
            aria-label="Editar"
            title="Editar"
          >
            <Edit2 className={iconSize} />
          </Button>
        )}

        {onStats && (
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={() => onStats(row)}
            className="p-1.5"
            aria-label="Estadísticas"
            title="Estadísticas"
          >
            <BarChart3 className={iconSize} />
          </Button>
        )}

        {extraActions.filter(a => a.show !== false).map((action, idx) => {
          const ActionIcon = action.icon;
          const isDisabled = action.disabled || action.loading;
          return (
            <Button
              key={idx}
              variant="ghost"
              size={buttonSize}
              onClick={() => action.onClick?.(row)}
              disabled={isDisabled}
              className={cn('p-1.5', isDisabled && 'opacity-50 cursor-not-allowed')}
              aria-label={action.label}
              title={action.label}
            >
              <ActionIcon className={iconSize} />
            </Button>
          );
        })}

        {onDelete && canDelete && (
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={handleDeleteClick}
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            aria-label="Eliminar"
            title="Eliminar"
          >
            <Trash2 className={iconSize} />
          </Button>
        )}
      </div>

      {confirmDelete && onDelete && canDelete && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
          title={`Eliminar ${entityName}`}
          message={deleteMessage || `¿Estás seguro de que deseas eliminar este ${entityName}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </>
  );
});

StandardRowActions.displayName = 'StandardRowActions';

StandardRowActions.propTypes = {
  /** Objeto de la fila */
  row: PropTypes.object.isRequired,
  /** Handler para editar */
  onEdit: PropTypes.func,
  /** Handler para eliminar */
  onDelete: PropTypes.func,
  /** Handler para ver detalle */
  onView: PropTypes.func,
  /** Handler para estadísticas */
  onStats: PropTypes.func,
  /** Si tiene permiso de editar */
  canEdit: PropTypes.bool,
  /** Si tiene permiso de eliminar */
  canDelete: PropTypes.bool,
  /** Usar dropdown en lugar de botones */
  compact: PropTypes.bool,
  /** Mostrar confirmación antes de eliminar */
  confirmDelete: PropTypes.bool,
  /** Mensaje de confirmación de eliminación */
  deleteMessage: PropTypes.string,
  /** Nombre de la entidad para mensaje de confirmación */
  entityName: PropTypes.string,
  /** Acciones adicionales */
  extraActions: PropTypes.arrayOf(PropTypes.shape({
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    show: PropTypes.bool,
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
  })),
  /** Tamaño de botones */
  size: PropTypes.oneOf(['xs', 'sm']),
  /** Clases adicionales */
  className: PropTypes.string,
};

export { StandardRowActions };
