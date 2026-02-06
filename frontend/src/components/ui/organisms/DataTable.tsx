import { useMemo, memo, useCallback, forwardRef, type ReactNode, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { SkeletonTable } from '../molecules/SkeletonTable';
import { EmptyState } from '../molecules/EmptyState';
import { Pagination } from './Pagination';
import { Inbox } from 'lucide-react';
import {
  TABLE_ALIGN_CLASSES,
  TABLE_WIDTH_CLASSES,
  TABLE_WIDTH_MAP,
  TABLE_BASE_STYLES,
  TABLE_HEADER_CELL,
  TABLE_BODY_CELL,
  TABLE_ROW_STYLES,
} from '@/lib/uiConstants';
import type { PaginationInfo } from '@/types/organisms';

/**
 * Alineación de columna
 */
export type TableColumnAlign = 'left' | 'center' | 'right';

/**
 * Ancho de columna
 */
export type TableColumnWidth = 'sm' | 'md' | 'lg' | 'xl' | 'auto';

/**
 * Configuración de columna para DataTable
 */
export interface DataTableColumn<T = Record<string, unknown>> {
  /** Key del dato en cada fila */
  key?: keyof T | string;
  /** Texto del header */
  header: string;
  /** Función de renderizado custom */
  render?: (row: T, value: unknown, rowIndex: number) => ReactNode;
  /** Alineación */
  align?: TableColumnAlign;
  /** Ancho */
  width?: TableColumnWidth;
  /** Ocultar en móvil */
  hideOnMobile?: boolean;
  /** Clases adicionales para la celda */
  className?: string;
  /** Clases adicionales para el header */
  headerClassName?: string;
}

/**
 * Configuración del estado vacío
 */
export interface DataTableEmptyState {
  /** Icono */
  icon?: ComponentType<{ className?: string }>;
  /** Título */
  title?: string;
  /** Descripción */
  description?: string;
  /** Texto del botón */
  actionLabel?: string;
  /** Callback del botón */
  onAction?: () => void;
}

/**
 * Props del componente DataTable
 */
export interface DataTableProps<T = Record<string, unknown>> {
  /** Configuración de columnas */
  columns: DataTableColumn<T>[];
  /** Array de datos a mostrar */
  data?: T[];
  /** Campo a usar como key */
  keyField?: keyof T;
  /** Estado de carga */
  isLoading?: boolean;
  /** Callback al hacer click en una fila */
  onRowClick?: (row: T) => void;
  /** Mostrar efecto hover en filas */
  hoverable?: boolean;
  /** Filas con colores alternados */
  striped?: boolean;
  /** Configuración del estado vacío */
  emptyState?: DataTableEmptyState;
  /** Objeto de paginación */
  pagination?: PaginationInfo;
  /** Callback cuando cambia la página */
  onPageChange?: (page: number) => void;
  /** Filas del skeleton */
  skeletonRows?: number;
  /** Clases adicionales para el contenedor */
  className?: string;
  /** Clases adicionales para la tabla */
  tableClassName?: string;
}

/**
 * DataTable - Tabla de datos genérica reutilizable
 */
function DataTableComponent<T = Record<string, unknown>>(
  {
  columns,
  data = [],
  keyField = 'id' as keyof T,
  isLoading = false,
  onRowClick,
  hoverable = true,
  striped = false,
  emptyState = {},
  pagination,
  onPageChange,
  skeletonRows = 5,
  className,
  tableClassName,
}: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  // Calcular anchos de columna para skeleton
  const columnWidths = useMemo(() => {
    return columns.map((col) => (TABLE_WIDTH_MAP[col.width || 'md'] || 'md') as 'sm' | 'md' | 'lg' | 'xl');
  }, [columns]);

  // Handler memoizado para click en fila
  const handleRowClick = useCallback(
    (row: T) => {
      if (onRowClick) onRowClick(row);
    },
    [onRowClick]
  );

  // Estado de carga
  if (isLoading) {
    return (
      <div ref={ref} className={className}>
        <SkeletonTable rows={skeletonRows} columns={columns.length} columnWidths={columnWidths} />
      </div>
    );
  }

  // Estado vacío
  if (!data || data.length === 0) {
    return (
      <div ref={ref} className={className}>
        <EmptyState
          icon={emptyState.icon || Inbox}
          title={emptyState.title || 'No hay datos'}
          description={emptyState.description}
          actionLabel={emptyState.actionLabel}
          onAction={emptyState.onAction}
          size="md"
        />
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('space-y-4', className)}>
      {/* Tabla */}
      <div className={TABLE_BASE_STYLES.container}>
        <div className={TABLE_BASE_STYLES.wrapper}>
          <table role="table" className={cn(TABLE_BASE_STYLES.table, tableClassName)}>
            {/* Header */}
            <thead role="rowgroup" className={TABLE_BASE_STYLES.thead}>
              <tr role="row">
                {columns.map((column, index) => (
                  <th
                    key={(column.key as string) || index}
                    scope="col"
                    role="columnheader"
                    className={cn(
                      TABLE_HEADER_CELL,
                      TABLE_ALIGN_CLASSES[column.align || 'left'] || 'text-left',
                      TABLE_WIDTH_CLASSES[column.width || 'auto'],
                      column.hideOnMobile && 'hidden md:table-cell',
                      column.headerClassName
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody role="rowgroup" className={TABLE_BASE_STYLES.tbody}>
              {data.map((row, rowIndex) => (
                <DataTableRow
                  key={String((row as Record<string, unknown>)[keyField as string] || rowIndex)}
                  row={row}
                  rowIndex={rowIndex}
                  columns={columns}
                  onRowClick={handleRowClick}
                  hoverable={hoverable}
                  striped={striped}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {pagination && onPageChange && <Pagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  );
}

export const DataTable = memo(forwardRef(DataTableComponent)) as <T = Record<string, unknown>>(
  props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement | null;

(DataTable as any).displayName = 'DataTable';

/**
 * Props para DataTableRow
 */
interface DataTableRowProps<T> {
  row: T;
  rowIndex: number;
  columns: DataTableColumn<T>[];
  onRowClick?: (row: T) => void;
  hoverable: boolean;
  striped: boolean;
}

/**
 * DataTableRow - Fila memoizada para evitar re-renders innecesarios
 */
const DataTableRow = memo(function DataTableRow<T>({
  row,
  rowIndex,
  columns,
  onRowClick,
  hoverable,
  striped,
}: DataTableRowProps<T>) {
  const handleClick = useCallback(() => {
    if (onRowClick) onRowClick(row);
  }, [onRowClick, row]);

  return (
    <tr
      role="row"
      onClick={onRowClick ? handleClick : undefined}
      className={cn(
        TABLE_ROW_STYLES.base,
        hoverable && TABLE_ROW_STYLES.hoverable,
        onRowClick && TABLE_ROW_STYLES.clickable,
        striped && rowIndex % 2 === 1 && TABLE_ROW_STYLES.striped
      )}
    >
      {columns.map((column, colIndex) => {
        const value = column.key ? (row as Record<string, unknown>)[column.key as string] : null;
        const content = column.render ? column.render(row, value, rowIndex) : (value as ReactNode);

        return (
          <td
            key={(column.key as string) || colIndex}
            role="cell"
            className={cn(
              TABLE_BODY_CELL,
              TABLE_ALIGN_CLASSES[column.align || 'left'] || 'text-left',
              column.hideOnMobile && 'hidden md:table-cell',
              column.className
            )}
          >
            {content}
          </td>
        );
      })}
    </tr>
  );
}) as <T>(props: DataTableRowProps<T>) => React.ReactElement;

/**
 * Props para DataTableActions
 */
export interface DataTableActionsProps {
  children: ReactNode;
  className?: string;
}

/**
 * DataTableActions - Contenedor para acciones de fila
 */
export const DataTableActions = memo(function DataTableActions({
  children,
  className,
}: DataTableActionsProps) {
  return <div className={cn('flex items-center justify-end gap-1 sm:gap-2', className)}>{children}</div>;
});

DataTableActions.displayName = 'DataTableActions';

/**
 * Variante del botón de acción
 */
export type DataTableActionVariant = 'ghost' | 'danger' | 'primary';

/**
 * Props para DataTableActionButton
 */
export interface DataTableActionButtonProps {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  variant?: DataTableActionVariant;
  disabled?: boolean;
  className?: string;
}

/**
 * DataTableActionButton - Botón de acción compacto para tablas
 */
export const DataTableActionButton = memo(function DataTableActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'ghost',
  disabled = false,
  className,
}: DataTableActionButtonProps) {
  const variantClasses: Record<DataTableActionVariant, string> = {
    ghost:
      'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
    danger:
      'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
    primary:
      'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={label}
      className={cn(
        'p-1.5 sm:p-2 rounded-lg transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
    </button>
  );
});

DataTableActionButton.displayName = 'DataTableActionButton';
