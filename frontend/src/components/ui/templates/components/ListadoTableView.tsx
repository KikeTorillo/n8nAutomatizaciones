import { memo } from 'react';
import { DataTable, type DataTableColumn } from '../../organisms/DataTable';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface ViewComponentProps {
  items: Record<string, unknown>[];
  isLoading: boolean;
  onItemClick?: (item: Record<string, unknown>) => void;
  handlers?: unknown;
  pagination?: unknown;
  onPageChange?: (page: number) => void;
}

interface ViewMode {
  id: string;
  label: string;
  icon?: LucideIcon;
  component?: React.ComponentType<ViewComponentProps>;
}

interface ListadoTableViewProps {
  viewModes?: ViewMode[];
  activeView: string;
  columns: DataTableColumn[];
  items: Record<string, unknown>[];
  isLoading: boolean;
  keyField: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  handleEditar: (row: Record<string, unknown>) => void;
  paginacion: Record<string, unknown>;
  handlePageChange: (page: number) => void;
  handlers: unknown;
  icon?: LucideIcon;
  title?: string;
  filtrosActivos: number;
  showNewButton: boolean;
  newButtonLabel: string;
  handleNuevo: () => void;
  emptyState: Record<string, unknown>;
}

export const ListadoTableView = memo(function ListadoTableView({
  viewModes,
  activeView,
  columns,
  items,
  isLoading,
  keyField,
  onRowClick,
  handleEditar,
  paginacion,
  handlePageChange,
  handlers,
  icon: Icon,
  title,
  filtrosActivos,
  showNewButton,
  newButtonLabel,
  handleNuevo,
  emptyState,
}: ListadoTableViewProps) {
  // Buscar componente custom para el activeView actual
  const viewConfig = viewModes?.find(v => v.id === activeView);
  if (viewConfig?.component) {
    const ViewComponent = viewConfig.component;
    return (
      <ViewComponent
        items={items}
        isLoading={isLoading}
        onItemClick={onRowClick || handleEditar}
        handlers={handlers}
        pagination={paginacion}
        onPageChange={handlePageChange}
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={items}
      isLoading={isLoading}
      keyField={keyField}
      onRowClick={onRowClick || handleEditar}
      pagination={paginacion}
      onPageChange={handlePageChange}
      emptyState={{
        icon: Icon,
        title: `No hay ${title?.toLowerCase() || 'elementos'}`,
        description: filtrosActivos > 0
          ? 'No se encontraron resultados con esos filtros'
          : `Crea tu primer ${title?.toLowerCase() || 'elemento'}`,
        actionLabel: filtrosActivos === 0 && showNewButton ? newButtonLabel : undefined,
        onAction: filtrosActivos === 0 && showNewButton ? handleNuevo : undefined,
        ...emptyState,
      }}
    />
  );
});
