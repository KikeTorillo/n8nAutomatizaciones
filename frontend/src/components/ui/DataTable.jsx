import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { SkeletonTable } from './SkeletonTable';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import { Inbox } from 'lucide-react';

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
export function DataTable({
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
    const widthMap = { sm: 'sm', md: 'md', lg: 'lg', xl: 'xl', auto: 'md' };
    return columns.map(col => widthMap[col.width] || 'md');
  }, [columns]);

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

  // Helpers de alineación
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Helpers de ancho
  const widthClasses = {
    sm: 'w-20',
    md: 'w-32',
    lg: 'w-48',
    xl: 'w-64',
    auto: '',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={cn('min-w-full divide-y divide-gray-200 dark:divide-gray-700', tableClassName)}>
            {/* Header */}
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key || index}
                    className={cn(
                      'px-4 sm:px-6 py-3',
                      'text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      alignClasses[column.align] || 'text-left',
                      widthClasses[column.width],
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
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row, rowIndex) => (
                <tr
                  key={row[keyField] || rowIndex}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    onRowClick && 'cursor-pointer',
                    striped && rowIndex % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/50'
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
                        className={cn(
                          'px-4 sm:px-6 py-4',
                          'text-sm text-gray-900 dark:text-gray-100',
                          alignClasses[column.align] || 'text-left',
                          column.hideOnMobile && 'hidden md:table-cell',
                          column.className
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
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
}

/**
 * DataTableActions - Contenedor para acciones de fila
 * Helper para agrupar botones de acción en una celda
 */
export function DataTableActions({ children, className }) {
  return (
    <div className={cn('flex items-center justify-end gap-1 sm:gap-2', className)}>
      {children}
    </div>
  );
}

/**
 * DataTableActionButton - Botón de acción compacto para tablas
 */
export function DataTableActionButton({
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

  return (
    <button
      type="button"
      onClick={onClick}
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
}

export default DataTable;
