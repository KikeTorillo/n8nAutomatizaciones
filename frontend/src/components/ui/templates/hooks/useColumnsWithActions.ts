import { useMemo } from 'react';
import type { DataTableColumn } from '../../organisms/DataTable';

interface CrudHandlers {
  onEdit: (item: Record<string, unknown>) => void;
  onDelete: (item: Record<string, unknown>) => void;
  onViewStats: (item: Record<string, unknown>) => void;
  openModal: (name: string, data?: unknown) => void;
  extraMutations: Record<string, unknown>;
}

type RowActionsFn = (row: Record<string, unknown>, handlers: CrudHandlers) => React.ReactNode;

/**
 * Hook que agrega columna _actions automáticamente a las columnas de la tabla
 */
export function useColumnsWithActions(
  columnsProp: DataTableColumn[],
  rowActions: RowActionsFn | undefined,
  handlers: CrudHandlers
): DataTableColumn[] {
  return useMemo(() => {
    if (!rowActions) return columnsProp;

    const actionsColumn: DataTableColumn = {
      key: '_actions',
      header: '',
      align: 'right' as const,
      render: (row: Record<string, unknown>) => rowActions(row, handlers),
    };

    const filtered = columnsProp.filter(
      (col) => col.key !== 'actions' && col.key !== '_actions'
    );
    return [...filtered, actionsColumn];
  }, [columnsProp, rowActions, handlers]);
}
