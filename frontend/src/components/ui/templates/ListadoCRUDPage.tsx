import { memo } from 'react';
import { cn } from '../lib/cn';
import type { DataTableColumn } from '../organisms/DataTable';
import { StatCardGrid, type StatConfig } from '../molecules/StatCardGrid';
import { ViewTabs } from '../organisms/ViewTabs';
import { Button } from '../atoms/Button';
import { Plus } from 'lucide-react';
import { useListadoCRUDState } from './useListadoCRUDState';
import { ListadoHeader } from './components/ListadoHeader';
import { ListadoModals } from './components/ListadoModals';
import { ListadoFilters } from './components/ListadoFilters';
import { ListadoTableView } from './components/ListadoTableView';

type LucideIcon = React.ComponentType<{ className?: string }>;

type ColumnDef = DataTableColumn;

interface ViewComponentProps {
  items: Record<string, unknown>[];
  isLoading: boolean;
  onItemClick?: (item: Record<string, unknown>) => void;
  handlers?: CrudHandlers;
  pagination?: unknown;
  onPageChange?: (page: number) => void;
}

interface ViewMode {
  id: string;
  label: string;
  icon?: LucideIcon;
  component?: React.ComponentType<ViewComponentProps>;
}

interface ExportConfig {
  filename?: string;
  columns?: Array<{ key: string; header: string }>;
  mapRow?: (row: Record<string, unknown>) => Record<string, unknown>;
}

interface OverlayComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  data?: unknown;
  [key: string]: unknown;
}

interface ExtraModalConfig {
  component: React.ComponentType<OverlayComponentProps>;
  mapData?: (data: unknown) => Record<string, unknown>;
  props?: Record<string, unknown>;
}

interface CrudHandlers {
  onEdit: (item: Record<string, unknown>) => void;
  onDelete: (item: Record<string, unknown>) => void;
  onViewStats: (item: Record<string, unknown>) => void;
  openModal: (name: string, data?: unknown) => void;
  extraMutations: Record<string, unknown>;
}

type OpenModalFn = (name: string, data?: unknown) => void;
type CloseModalFn = (name: string, clearData?: boolean) => void;
type SetFiltroFn = (key: string, value: unknown) => void;

interface PageLayoutProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  [key: string]: unknown;
}

interface ListadoCRUDPageProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  PageLayout?: React.ComponentType<PageLayoutProps>;
  layoutProps?: Record<string, unknown>;
   
  useListQuery: (params: Record<string, unknown>) => {
    data?: any;
    isLoading: boolean;
  };
  queryParams?: Record<string, unknown>;
  dataKey?: string;
  useDeleteMutation?: () => {
    mutate: (id: unknown) => void;
    isPending: boolean;
    [key: string]: unknown;
  };
  deleteMutationOptions?: Record<string, unknown>;
  extraMutations?: Record<string, unknown>;
  columns: ColumnDef[];
  keyField?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyState?: Record<string, unknown>;
  rowActions?: (
    row: Record<string, unknown>,
    handlers: CrudHandlers
  ) => React.ReactNode;
  initialFilters?: Record<string, unknown>;
  filterConfig?: unknown[];
  filterPersistId?: string;
  limit?: number;
  statsConfig?: StatConfig[];
  FormDrawer?: React.ComponentType<OverlayComponentProps>;
  formDrawerProps?: Record<string, unknown>;
  mapFormData?: (data: unknown) => Record<string, unknown>;
  StatsModal?: React.ComponentType<OverlayComponentProps>;
  statsModalProps?: Record<string, unknown>;
  mapStatsData?: (data: unknown) => Record<string, unknown>;
  actions?:
    | React.ReactNode
    | ((context: {
        openModal: OpenModalFn;
        closeModal: CloseModalFn;
        items: unknown[];
        isLoading: boolean;
        handlers: CrudHandlers;
      }) => React.ReactNode);
  showNewButton?: boolean;
  newButtonLabel?: string;
  viewModes?: ViewMode[];
  defaultViewMode?: string;
  extraModals?: Record<string, ExtraModalConfig>;
  exportConfig?: ExportConfig;
  renderFilters?: (context: {
    filtros: Record<string, unknown>;
    setFiltro: SetFiltroFn;
    limpiarFiltros: () => void;
    filtrosActivos: number;
    resetPage: () => void;
  }) => React.ReactNode;
  renderBeforeTable?: (context: {
    items: unknown[];
    isLoading: boolean;
    paginacion: unknown;
    openModal: OpenModalFn;
  }) => React.ReactNode;
  renderAfterTable?: (context: {
    items: unknown[];
    isLoading: boolean;
  }) => React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const ListadoCRUDPage = memo(function ListadoCRUDPage({
  title,
  subtitle,
  icon: Icon,
  PageLayout,
  layoutProps = {},
  useListQuery,
  queryParams: extraQueryParams = {},
  dataKey = 'items',
  useDeleteMutation,
  deleteMutationOptions = {},
  extraMutations = {},
  columns: columnsProp,
  keyField = 'id',
  onRowClick,
  emptyState = {},
  rowActions,
  initialFilters = { busqueda: '' },
  filterPersistId,
  limit = 20,
  statsConfig,
  FormDrawer,
  formDrawerProps = {},
  mapFormData,
  StatsModal,
  statsModalProps = {},
  mapStatsData,
  actions,
  showNewButton = true,
  newButtonLabel = 'Nuevo',
  viewModes,
  defaultViewMode = 'table',
  extraModals = {},
  exportConfig,
  renderFilters,
  renderBeforeTable,
  renderAfterTable,
  className,
  children,
}: ListadoCRUDPageProps) {
  const {
    activeView,
    setActiveView,
    handlePageChange,
    resetPage,
    filtros,
    setFiltro,
    limpiarFiltros,
    filtrosActivos,
    openModal,
    closeModal,
    isOpen,
    getModalData,
    isLoading,
    items,
    paginacion,
    handleExport,
    deleteMutation,
    deleteConfirmProps,
    handleNuevo,
    handleEditar,
    handlers,
    columns,
  } = useListadoCRUDState({
    useListQuery,
    queryParams: extraQueryParams,
    dataKey,
    useDeleteMutation,
    deleteMutationOptions,
    extraMutations,
    columns: columnsProp,
    rowActions,
    initialFilters,
    filterPersistId,
    limit,
    extraModals,
    exportConfig,
    title,
    defaultViewMode,
  });

  const computedSubtitle =
    subtitle || `${paginacion.total} ${title?.toLowerCase() || 'elementos'}`;
  const computedActions =
    typeof actions === 'function'
      ? actions({ openModal, closeModal, items, isLoading, handlers })
      : actions;

  const layoutContent = (
    <>
      {statsConfig && <StatCardGrid stats={statsConfig} className="mb-6" />}

      <div className="mb-6 space-y-4">
        {viewModes && viewModes.length > 1 && (
          <ViewTabs
            tabs={viewModes}
            activeTab={activeView}
            onChange={setActiveView}
          />
        )}

        {renderFilters ? (
          renderFilters({
            filtros,
            setFiltro,
            limpiarFiltros,
            filtrosActivos,
            resetPage,
          })
        ) : (
          <ListadoFilters
            filtros={filtros}
            setFiltro={setFiltro}
            limpiarFiltros={limpiarFiltros}
            filtrosActivos={filtrosActivos}
            resetPage={resetPage}
            exportConfig={exportConfig}
            itemsCount={items.length}
            onExport={handleExport}
          />
        )}
      </div>

      {renderBeforeTable?.({ items, isLoading, paginacion, openModal })}

      <ListadoTableView
        viewModes={viewModes}
        activeView={activeView}
        columns={columns}
        items={items}
        isLoading={isLoading}
        keyField={keyField}
        onRowClick={onRowClick}
        handleEditar={handleEditar}
        paginacion={paginacion}
        handlePageChange={handlePageChange}
        handlers={handlers}
        icon={Icon}
        title={title}
        filtrosActivos={filtrosActivos}
        showNewButton={showNewButton}
        newButtonLabel={newButtonLabel}
        handleNuevo={handleNuevo}
        emptyState={emptyState}
      />

      {renderAfterTable?.({ items, isLoading })}

      <ListadoModals
        FormDrawer={FormDrawer}
        formDrawerProps={formDrawerProps}
        mapFormData={mapFormData}
        StatsModal={StatsModal}
        statsModalProps={statsModalProps}
        mapStatsData={mapStatsData}
        extraModals={extraModals}
        deleteMutation={deleteMutation}
        deleteConfirmProps={deleteConfirmProps}
        isOpen={isOpen}
        closeModal={closeModal}
        getModalData={getModalData}
      />

      {children}
    </>
  );

  const LayoutComponent = (PageLayout ||
    'div') as React.ElementType<PageLayoutProps>;

  if (PageLayout) {
    return (
      <LayoutComponent
        icon={Icon}
        title={title}
        subtitle={computedSubtitle}
        actions={
          computedActions ||
          (showNewButton && (
            <Button onClick={handleNuevo} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{newButtonLabel}</span>
            </Button>
          ))
        }
        {...layoutProps}
      >
        {layoutContent}
      </LayoutComponent>
    );
  }

  return (
    <div className={cn('p-6', className)}>
      <ListadoHeader
        icon={Icon}
        title={title}
        subtitle={computedSubtitle}
        actions={computedActions}
        showNewButton={showNewButton}
        newButtonLabel={newButtonLabel}
        onNuevo={handleNuevo}
      />
      {layoutContent}
    </div>
  );
});

ListadoCRUDPage.displayName = 'ListadoCRUDPage';

export { ListadoCRUDPage };
export default ListadoCRUDPage;
export type {
  ListadoCRUDPageProps,
  ColumnDef,
  ViewMode,
  ViewComponentProps,
  ExportConfig,
  ExtraModalConfig,
  OverlayComponentProps,
  CrudHandlers,
  PageLayoutProps,
  OpenModalFn,
  CloseModalFn,
  SetFiltroFn,
};
