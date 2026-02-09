import { memo } from 'react';
import { cn } from '@/lib/utils';
import { DataTable, type DataTableColumn } from '../organisms/DataTable';
import { SearchInput } from '../organisms/SearchInput';
import { Button } from '../atoms/Button';
import { StatCardGrid, type StatConfig } from '../molecules/StatCardGrid';
import { ViewTabs } from '../organisms/ViewTabs';
import { ConfirmDialog, type ConfirmDialogProps } from '../organisms/ConfirmDialog';
import { Plus, Download } from 'lucide-react';
import { SEMANTIC_COLORS } from '@/lib/uiConstants';
import { useListadoCRUDState } from './useListadoCRUDState';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useListQuery: (params: Record<string, unknown>) => { data?: any; isLoading: boolean };
  queryParams?: Record<string, unknown>;
  dataKey?: string;
  useDeleteMutation?: () => { mutate: (id: unknown) => void; isPending: boolean; [key: string]: unknown };
  deleteMutationOptions?: Record<string, unknown>;
  extraMutations?: Record<string, unknown>;
  columns: ColumnDef[];
  keyField?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyState?: Record<string, unknown>;
  rowActions?: (row: Record<string, unknown>, handlers: CrudHandlers) => React.ReactNode;
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
  actions?: React.ReactNode | ((context: { openModal: OpenModalFn; closeModal: CloseModalFn; items: unknown[]; isLoading: boolean; handlers: CrudHandlers }) => React.ReactNode);
  showNewButton?: boolean;
  newButtonLabel?: string;
  viewModes?: ViewMode[];
  defaultViewMode?: string;
  extraModals?: Record<string, ExtraModalConfig>;
  exportConfig?: ExportConfig;
  renderFilters?: (context: { filtros: Record<string, unknown>; setFiltro: SetFiltroFn; limpiarFiltros: () => void; filtrosActivos: number; resetPage: () => void }) => React.ReactNode;
  renderBeforeTable?: (context: { items: unknown[]; isLoading: boolean; paginacion: unknown; openModal: OpenModalFn }) => React.ReactNode;
  renderAfterTable?: (context: { items: unknown[]; isLoading: boolean }) => React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const ListadoCRUDPage = memo(function ListadoCRUDPage({
  // Layout
  title,
  subtitle,
  icon: Icon,
  PageLayout,
  layoutProps = {},

  // Data
  useListQuery,
  queryParams: extraQueryParams = {},
  dataKey = 'items',

  // Mutations
  useDeleteMutation,
  deleteMutationOptions = {},
  extraMutations = {},

  // Table
  columns: columnsProp,
  keyField = 'id',
  onRowClick,
  emptyState = {},
  rowActions,

  // Filters
  initialFilters = { busqueda: '' },
  filterConfig = [],
  filterPersistId,
  limit = 20,

  // Stats (opcional)
  statsConfig,

  // Modals
  FormDrawer,
  formDrawerProps = {},
  mapFormData,
  StatsModal,
  statsModalProps = {},
  mapStatsData,

  // Actions
  actions,
  showNewButton = true,
  newButtonLabel = 'Nuevo',

  // ViewModes (tabla/cards)
  viewModes,
  defaultViewMode = 'table',

  // Extra modals
  extraModals = {},

  // Export CSV
  exportConfig,

  // Customization
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

  // Computed subtitle
  const computedSubtitle = subtitle || `${paginacion.total} ${title?.toLowerCase() || 'elementos'}`;

  // Computed actions - permite función o ReactNode
  const computedActions = typeof actions === 'function'
    ? actions({ openModal, closeModal, items, isLoading, handlers })
    : actions;

  // Wrapper de layout
  const LayoutComponent = (PageLayout || 'div') as React.ElementType<PageLayoutProps>;
  const layoutContent = (
    <>
      {/* Stats */}
      {statsConfig && <StatCardGrid stats={statsConfig} className="mb-6" />}

      {/* ViewTabs + Filtros + Export */}
      <div className="mb-6 space-y-4">
        {/* ViewTabs si hay múltiples vistas */}
        {viewModes && viewModes.length > 1 && (
          <ViewTabs
            tabs={viewModes}
            activeTab={activeView}
            onChange={setActiveView}
          />
        )}

        {/* Filtros */}
        {renderFilters ? (
          renderFilters({ filtros, setFiltro, limpiarFiltros, filtrosActivos, resetPage })
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                value={(filtros.busqueda as string) || ''}
                onChange={(e) => {
                  setFiltro('busqueda', (e.target as HTMLInputElement).value);
                  resetPage();
                }}
                placeholder="Buscar..."
              />
            </div>
            <div className="flex gap-2">
              {filtrosActivos > 0 && (
                <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              )}
              {exportConfig && items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={false}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Before table slot */}
      {renderBeforeTable?.({ items, isLoading, paginacion, openModal })}

      {/* Table o Vista Custom */}
      {(() => {
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
        // Fallback a DataTable si no hay componente custom
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
      })()}

      {/* After table slot */}
      {renderAfterTable?.({ items, isLoading })}

      {/* Form Drawer */}
      {FormDrawer && isOpen('form') && (
        <FormDrawer
          key={`form-${getModalData('form')?.id || 'new'}`}
          isOpen={isOpen('form')}
          onClose={() => closeModal('form')}
          onSuccess={() => closeModal('form')}
          {...(mapFormData?.(getModalData('form')) ?? { data: getModalData('form') })}
          {...formDrawerProps}
        />
      )}

      {/* Stats Modal */}
      {StatsModal && (
        <StatsModal
          isOpen={isOpen('stats')}
          onClose={() => closeModal('stats')}
          {...(mapStatsData?.(getModalData('stats')) ?? { data: getModalData('stats') })}
          {...statsModalProps}
        />
      )}

      {/* Extra Modals */}
      {Object.entries(extraModals).map(([modalKey, modalConfig]) => {
        const { component: ModalComponent, mapData, props: modalProps = {} } = modalConfig;
        if (!ModalComponent) return null;
        return (
          <ModalComponent
            key={modalKey}
            isOpen={isOpen(modalKey)}
            onClose={() => closeModal(modalKey)}
            {...(mapData ? mapData(getModalData(modalKey)) : { data: getModalData(modalKey) })}
            {...modalProps}
          />
        );
      })}

      {/* Delete Confirmation */}
      {deleteMutation && <ConfirmDialog {...deleteConfirmProps as ConfirmDialogProps} />}

      {/* Children slot */}
      {children}
    </>
  );

  // Render con o sin PageLayout
  if (PageLayout) {
    return (
      <LayoutComponent
        icon={Icon}
        title={title}
        subtitle={computedSubtitle}
        actions={
          computedActions || (showNewButton && (
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
      {/* Header simple si no hay PageLayout */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className={cn('h-7 w-7', SEMANTIC_COLORS.primary.icon)} />}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{computedSubtitle}</p>
          </div>
        </div>
        {(computedActions || showNewButton) && (
          <div className="flex gap-2">
            {computedActions || (
              <Button onClick={handleNuevo} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {newButtonLabel}
              </Button>
            )}
          </div>
        )}
      </div>
      {layoutContent}
    </div>
  );
});

ListadoCRUDPage.displayName = 'ListadoCRUDPage';

export { ListadoCRUDPage };
export default ListadoCRUDPage;
export type { ListadoCRUDPageProps, ColumnDef, ViewMode, ViewComponentProps, ExportConfig, ExtraModalConfig, OverlayComponentProps, CrudHandlers, PageLayoutProps, OpenModalFn, CloseModalFn, SetFiltroFn };
