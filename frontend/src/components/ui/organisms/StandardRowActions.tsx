import { memo, useState, forwardRef, type ComponentType } from 'react';
import { Edit2, Trash2, Eye, BarChart3, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { DropdownMenu } from './DropdownMenu';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Acción extra para filas
 */
export interface ExtraAction<T = Record<string, unknown>> {
  /** Icono de la acción */
  icon: ComponentType<{ className?: string }>;
  /** Label de la acción */
  label: string;
  /** Handler de click */
  onClick?: (row: T) => void;
  /** Si mostrar la acción (default: true) */
  show?: boolean;
  /** Si está cargando */
  loading?: boolean;
  /** Si está deshabilitado */
  disabled?: boolean;
}

/**
 * Props del componente StandardRowActions
 */
export interface StandardRowActionsProps<T = Record<string, unknown>> {
  /** Objeto de la fila */
  row: T;
  /** Handler para editar */
  onEdit?: (row: T) => void;
  /** Handler para eliminar */
  onDelete?: (row: T) => void | Promise<void>;
  /** Handler para ver detalle */
  onView?: (row: T) => void;
  /** Handler para estadísticas */
  onStats?: (row: T) => void;
  /** Si tiene permiso de editar */
  canEdit?: boolean;
  /** Si tiene permiso de eliminar */
  canDelete?: boolean;
  /** Usar dropdown en lugar de botones */
  compact?: boolean;
  /** Mostrar confirmación antes de eliminar */
  confirmDelete?: boolean;
  /** Mensaje de confirmación de eliminación */
  deleteMessage?: string;
  /** Nombre de la entidad para mensaje de confirmación */
  entityName?: string;
  /** Acciones adicionales */
  extraActions?: ExtraAction<T>[];
  /** Tamaño de botones */
  size?: 'xs' | 'sm';
  /** Clases adicionales */
  className?: string;
}

/**
 * StandardRowActions - Acciones estándar para filas de tablas
 *
 * Componente reutilizable que proporciona acciones comunes para filas de tablas:
 * editar, eliminar, ver detalle, estadísticas. Soporta modo compacto (dropdown)
 * y confirmación antes de eliminar.
 */
function StandardRowActionsComponent<T = Record<string, unknown>>(
  {
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
}: StandardRowActionsProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
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
    ...extraActions
      .filter((a) => a.show !== false)
      .map((a) => ({
        icon: a.icon,
        label: a.label,
        onClick: () => a.onClick?.(row),
        disabled: a.disabled || a.loading,
      })),
    onDelete &&
      canDelete && {
        icon: Trash2,
        label: 'Eliminar',
        onClick: handleDeleteClick,
        variant: 'danger' as const,
      },
  ].filter(Boolean) as Array<{
    icon: ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'danger';
  }>;

  // Modo compacto: dropdown con todas las acciones
  if (compact) {
    return (
      <div ref={ref}>
        <DropdownMenu
          trigger={
            <Button variant="ghost" size={size} className="p-1" aria-label="Más acciones">
              <MoreVertical className="w-4 h-4" />
            </Button>
          }
          items={dropdownActions.map((action) => ({
            label: action.label,
            icon: action.icon,
            onClick: action.onClick,
            className: action.variant === 'danger' ? 'text-red-600 dark:text-red-400' : undefined,
          }))}
          align="right"
        />

        {confirmDelete && onDelete && canDelete && (
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleConfirmDelete}
            title={`Eliminar ${entityName}`}
            message={
              deleteMessage ||
              `¿Estás seguro de que deseas eliminar este ${entityName}? Esta acción no se puede deshacer.`
            }
            confirmText="Eliminar"
            variant="danger"
            isLoading={isDeleting}
          />
        )}
      </div>
    );
  }

  // Modo normal: botones inline
  const buttonSize = 'sm' as const; // xs no es válido en Button, usar siempre sm
  const iconSize = size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div ref={ref}>
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

        {extraActions
          .filter((a) => a.show !== false)
          .map((action, idx) => {
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
          message={
            deleteMessage ||
            `¿Estás seguro de que deseas eliminar este ${entityName}? Esta acción no se puede deshacer.`
          }
          confirmText="Eliminar"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

export const StandardRowActions = memo(
  forwardRef(StandardRowActionsComponent)
) as typeof StandardRowActionsComponent;

// @ts-expect-error - displayName en memo con generics
StandardRowActions.displayName = 'StandardRowActions';

export { StandardRowActions as default };
