import { useMemo, memo, useCallback } from 'react';
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

/**
 * DataTable - Tabla de datos genérica reutilizable
 *
 * @param {Object} props
 * @param {Array<Object>} props.columns - Configuración de columnas
 * @param {string} props.columns[].key - Key del dato en cada fila
 * @param {string} props.columns[].header - Texto del header
 * @param {Function} [props.columns[].render] - Función de renderizado custom (row, value) => ReactNode
 * @param {string} [props.columns[].align] - Alineación: 'left' | 'center' | 'right'
 * @param {string} [props.columns[].width] - Ancho: 'sm' | 'md' | 'lg' | 'xl' | 'auto'
 * @param {boolean} [props.columns[].hideOnMobile] - Ocultar en móvil
 * @param {string} [props.columns[].className] - Clases adicionales para la celda
 *
 * @param {Array<Object>} props.data - Array de datos a mostrar
 * @param {string} [props.keyField] - Campo a usar como key (default: 'id')
 * @param {boolean} [props.isLoading] - Estado de carga
 * @param {Function} [props.onRowClick] - Callback al hacer click en una fila
 * @param {boolean} [props.hoverable] - Mostrar efecto hover en filas (default: true)
 * @param {boolean} [props.striped] - Filas con colores alternados
 *
 * @param {Object} [props.emptyState] - Configuración del estado vacío
 * @param {React.ComponentType} [props.emptyState.icon] - Icono del estado vacío
 * @param {string} [props.emptyState.title] - Título cuando no hay datos
 * @param {string} [props.emptyState.description] - Descripción del estado vacío
 * @param {string} [props.emptyState.actionLabel] - Texto del botón de acción
 * @param {Function} [props.emptyState.onAction] - Callback del botón
 *
 * @param {Object} [props.pagination] - Objeto de paginación del backend
 * @param {Function} [props.onPageChange] - Callback cuando cambia la página
 *
 * @param {number} [props.skeletonRows] - Filas del skeleton (default: 5)
 * @param {string} [props.className] - Clases adicionales para el contenedor
 * @param {string} [props.tableClassName] - Clases adicionales para la tabla
 *
 * @example
 * const columns = [
 *   { key: 'nombre', header: 'Nombre', width: 'lg' },
 *   { key: 'email', header: 'Email', hideOnMobile: true },
 *   { key: 'estado', header: 'Estado', render: (row) => <Badge>{row.estado}</Badge> },
 *   {
 *     key: 'actions',
 *     header: '',
 *     align: 'right',
 *     render: (row) => (
 *       <div className="flex gap-2">
 *         <Button size="sm" onClick={() => handleEdit(row)}>Editar</Button>
 *       </div>
 *     )
 *   }
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={productos}
 *   isLoading={isLoading}
 *   pagination={paginationData}
 *   onPageChange={setPage}
 *   onRowClick={(row) => navigate(`/producto/${row.id}`)}
 *   emptyState={{
 *     title: 'No hay productos',
 *     description: 'Crea tu primer producto para comenzar',
 *     actionLabel: 'Nuevo producto',
 *     onAction: handleNuevo
 *   }}
 * />
 */
export const DataTable = memo(function DataTable({
  columns,
  data = [],
  keyField = 'id',
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
}) {
  // Calcular anchos de columna para skeleton
  const columnWidths = useMemo(() => {
    return columns.map(col => TABLE_WIDTH_MAP[col.width] || 'md');
  }, [columns]);

  // Handler memoizado para click en fila (DEBE estar antes de returns condicionales)
  const handleRowClick = useCallback((row) => {
    if (onRowClick) onRowClick(row);
  }, [onRowClick]);

  // Estado de carga
  if (isLoading) {
    return (
      <div className={className}>
        <SkeletonTable
          rows={skeletonRows}
          columns={columns.length}
          columnWidths={columnWidths}
        />
      </div>
    );
  }

  // Estado vacío
  if (!data || data.length === 0) {
    return (
      <div className={className}>
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
    <div className={cn('space-y-4', className)}>
      {/* Tabla */}
      <div className={TABLE_BASE_STYLES.container}>
        <div className={TABLE_BASE_STYLES.wrapper}>
          <table role="table" className={cn(TABLE_BASE_STYLES.table, tableClassName)}>
            {/* Header */}
            <thead role="rowgroup" className={TABLE_BASE_STYLES.thead}>
              <tr role="row">
                {columns.map((column, index) => (
                  <th
                    key={column.key || index}
                    scope="col"
                    role="columnheader"
                    className={cn(
                      TABLE_HEADER_CELL,
                      TABLE_ALIGN_CLASSES[column.align] || 'text-left',
                      TABLE_WIDTH_CLASSES[column.width],
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
                  key={row[keyField] || rowIndex}
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
      {pagination && onPageChange && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
});

/**
 * DataTableActions - Contenedor para acciones de fila
 * Helper para agrupar botones de acción en una celda
 */
export const DataTableActions = memo(function DataTableActions({ children, className }) {
  return (
    <div className={cn('flex items-center justify-end gap-1 sm:gap-2', className)}>
      {children}
    </div>
  );
});

DataTableActions.displayName = 'DataTableActions';

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
}) {
  const variantClasses = {
    ghost: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
    danger: 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
    primary: 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20',
  };

  const handleClick = (e) => {
    e.stopPropagation(); // Evitar que el clic propague al onRowClick de la fila
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
DataTable.displayName = 'DataTable';

/**
 * DataTableRow - Fila memoizada para evitar re-renders innecesarios
 */
const DataTableRow = memo(function DataTableRow({
  row,
  rowIndex,
  columns,
  onRowClick,
  hoverable,
  striped,
}) {
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
        const value = column.key ? row[column.key] : null;
        const content = column.render
          ? column.render(row, value, rowIndex)
          : value;

        return (
          <td
            key={column.key || colIndex}
            role="cell"
            className={cn(
              TABLE_BODY_CELL,
              TABLE_ALIGN_CLASSES[column.align] || 'text-left',
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
});
